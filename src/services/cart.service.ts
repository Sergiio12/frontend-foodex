import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiResponseBody } from '../model/ApiResponseBody';
import { CarritoResponse } from '../payloads/CarritoResponse';
import { isEqual } from 'lodash';
import { URL_SERVIDOR } from '../utils/constantes';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly API_URL = URL_SERVIDOR + 'api/carrito';

  private cartSubject = new BehaviorSubject<ApiResponseBody<CarritoResponse> | null>(null);

  cart$ = this.cartSubject.asObservable().pipe(
    map(res => res ? {
      status: res.status,
      data: {
        itemsCarrito: res.data?.itemsCarrito || [],
        total: res.data?.total || 0
      }
    } : null),
    shareReplay(1)
  );

  totalPrice$ = this.cart$.pipe(
    map(res => res?.data?.itemsCarrito.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0) || 0),
    distinctUntilChanged()
  );

  uniqueItemsCount$ = this.cart$.pipe(
    map(res => res?.data?.itemsCarrito.length || 0),
    distinctUntilChanged()
  );

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  get currentTotal(): number {
    const res = this.cartSubject.value;
    return res?.data?.itemsCarrito.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0) || 0;
  }

  getCart(): Observable<ApiResponseBody<CarritoResponse>> {
    return this.http
      .get<ApiResponseBody<CarritoResponse>>(this.API_URL, { headers: this.authHeaders })
      .pipe(
        tap(response => {
          if (response.status === 'success') {
            this.cartSubject.next(response);
          }
        }),
        catchError(err => this.handleError(err))
      );
  }

  addItem(productId: number, cantidad: number): Observable<ApiResponseBody<CarritoResponse>> {
    const params = new HttpParams()
      .set('idProducto', productId.toString())
      .set('cantidad', cantidad.toString());

    return this.http
      .put<ApiResponseBody<CarritoResponse>>(`${this.API_URL}/añadir`, null, {
        headers: this.authHeaders,
        params
      })
      .pipe(
        tap(response => {
          if (response.status === 'success') {
            const validated = this.validateCart(response);
            this.cartSubject.next(validated);
            window.location.reload();
          }
        }),
        catchError(err => this.handleError(err))
      );
  }

  modifyItem(productId: number, nuevaCantidad: number): Observable<ApiResponseBody<CarritoResponse>> {
    const currentCart = this.cartSubject.value;
    if (currentCart?.data) {
      const updatedItems = currentCart.data.itemsCarrito.map(item =>
        item.producto.id === productId ? { ...item, cantidad: nuevaCantidad } : item
      );
      const optimisticTotal = updatedItems.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);
      this.cartSubject.next({
        ...currentCart,
        data: { itemsCarrito: updatedItems, total: optimisticTotal }
      });
    }

    const params = new HttpParams()
      .set('idProducto', productId.toString())
      .set('nuevaCantidad', nuevaCantidad.toString());

    return this.http
      .put<ApiResponseBody<CarritoResponse>>(`${this.API_URL}/modificar`, null, {
        headers: this.authHeaders,
        params
      })
      .pipe(
        tap(response => this.handleCartResponse(response)),
        catchError(err => {
          if (currentCart) {
            this.cartSubject.next(currentCart);
          }
          return this.handleError(err);
        })
      );
  }

  removeItem(productId: number): Observable<ApiResponseBody<CarritoResponse>> {
    const params = new HttpParams().set('idProducto', productId.toString());
    return this.http
      .delete<ApiResponseBody<CarritoResponse>>(`${this.API_URL}/eliminar`, {
        headers: this.authHeaders,
        params
      })
      .pipe(
        tap(response => this.handleCartResponse(response)),
        catchError(err => this.handleError(err))
      );
  }

  clearCart(): Observable<ApiResponseBody<CarritoResponse>> {
    return this.http
      .delete<ApiResponseBody<CarritoResponse>>(`${this.API_URL}/vaciar`, {
        headers: this.authHeaders
      })
      .pipe(
        tap(response => this.handleCartResponse(response)),
        catchError(err => this.handleError(err))
      );
  }

  private get authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Usuario no autenticado');
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private handleCartResponse(response: ApiResponseBody<CarritoResponse>): void {
    if (response.status === 'success') {
      const validated = this.validateCart(response);
      const currentItems = this.cartSubject.value?.data?.itemsCarrito || [];
      const newItems = validated.data?.itemsCarrito || [];

      if (!isEqual(currentItems, newItems)) {
        this.cartSubject.next({
          ...validated,
          data: {
            itemsCarrito: newItems,
            total: validated.data?.total || 0
          }
        });
      }
    }
  }

  private validateCart(response: ApiResponseBody<CarritoResponse>): ApiResponseBody<CarritoResponse> {
    const safeData = response.data || { itemsCarrito: [], total: 0 };
    const validItems = safeData.itemsCarrito.filter(i => i.producto?.id && i.cantidad > 0);
    const total = safeData.total || validItems.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);

    return {
      ...response,
      data: { itemsCarrito: validItems, total }
    };
  }

  private handleError(error: any): Observable<never> {
    if (error.status === 401) {
      this.authService.logout();
      return throwError(() => new Error('Sesión expirada'));
    }
    const msg = error.error?.message || error.message || 'Error carrito';
    return throwError(() => new Error(msg));
  }
}
