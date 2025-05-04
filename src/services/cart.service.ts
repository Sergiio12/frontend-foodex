import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, finalize, map, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiResponseBody } from '../model/ApiResponseBody';
import { CarritoResponse } from '../payloads/CarritoResponse';
import { isEqual } from 'lodash';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly API_URL = 'http://localhost:8080/api/carrito';

  cartSubject = new BehaviorSubject<ApiResponseBody<CarritoResponse> | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Versión corregida en cart.service.ts:
  public cart$ = this.cartSubject.asObservable().pipe(
    map(res => res ? { 
      status: res.status,
      data: {
        itemsCarrito: res.data?.itemsCarrito || [],
        total: res.data?.total || 0 
      }
    } : null),
    distinctUntilChanged((prev, curr) => isEqual(prev?.data.itemsCarrito, curr?.data.itemsCarrito)),
    shareReplay(1)
  );

  public isLoading$ = this.loadingSubject.asObservable();

  public totalPrice$ = this.cart$.pipe(
    map(res => res?.data?.itemsCarrito.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0) || 0),
    distinctUntilChanged()
  );

  public uniqueItemsCount$ = this.cart$.pipe(
    map(res => res?.data?.itemsCarrito.length || 0),
    distinctUntilChanged()
  );

  constructor(private http: HttpClient, private authService: AuthService) {}

  getCart(): Observable<ApiResponseBody<CarritoResponse>> {
    this.setLoading(true);
    return this.http.get<ApiResponseBody<CarritoResponse>>(this.API_URL, { headers: this.authHeaders }).pipe(
      tap(response => response.status === 'success' && this.cartSubject.next(response)),
      catchError(err => this.handleError(err)),
      finalize(() => this.setLoading(false))
    );
  }

  addItem(productId: number, cantidad: number): Observable<ApiResponseBody<CarritoResponse>> {
    this.setLoading(true);
    const params = new HttpParams()
      .set('idProducto', productId.toString())
      .set('cantidad', cantidad.toString());
    return this.http.put<ApiResponseBody<CarritoResponse>>( `${this.API_URL}/añadir`, null, { headers: this.authHeaders, params }).pipe(
      tap(response => this.handleCartResponse(response)),
      catchError(err => this.handleError(err)),
      finalize(() => this.setLoading(false))
    );
  }

  modifyItem(productId: number, nuevaCantidad: number): Observable<ApiResponseBody<CarritoResponse>> {
    this.setLoading(true);
    const params = new HttpParams()
      .set('idProducto', productId.toString())
      .set('nuevaCantidad', nuevaCantidad.toString());
    return this.http.put<ApiResponseBody<CarritoResponse>>( `${this.API_URL}/modificar`, null, { headers: this.authHeaders, params }).pipe(
      tap(response => this.handleCartResponse(response)),
      catchError(err => this.handleError(err)),
      finalize(() => this.setLoading(false))
    );
  }

  removeItem(productId: number): Observable<ApiResponseBody<CarritoResponse>> {
    console.log('[CartService] Eliminando producto ID:', productId);
    this.setLoading(true);
    
    const params = new HttpParams()
      .set('idProducto', productId.toString());

    return this.http.delete<ApiResponseBody<CarritoResponse>>(
      `${this.API_URL}/eliminar`, 
      { headers: this.authHeaders, params }
    ).pipe(
      tap(response => {
        console.log('Respuesta de eliminación:', response); 
        this.handleCartResponse(response);
      }),
      catchError(err => this.handleError(err)),
      finalize(() => this.setLoading(false))
    );
  }

  clearCart(): Observable<ApiResponseBody<CarritoResponse>> {
    this.setLoading(true);
    return this.http.delete<ApiResponseBody<CarritoResponse>>( `${this.API_URL}/vaciar`, { headers: this.authHeaders }).pipe(
      tap(response => this.handleCartResponse(response)),
      catchError(err => this.handleError(err)),
      finalize(() => this.setLoading(false))
    );
  }

  get currentTotal(): number {
    const res = this.cartSubject.value;
    return res?.data?.itemsCarrito.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0) || 0;
  }

  setLoading(val: boolean): void { this.loadingSubject.next(val); }

  private get authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) throw new Error('Usuario no autenticado');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleCartResponse(response: ApiResponseBody<CarritoResponse>): void {
    console.log('[CartService] Respuesta recibida:', response);
    
    if (response.status === 'success') {
      const newCart = this.validateCart(response);
      const currentItems = this.cartSubject.value?.data?.itemsCarrito || [];
      const newItems = newCart.data?.itemsCarrito || [];

      console.log('[CartService] Comparando items:',
        'Actual:', currentItems.map(i => i.producto.id),
        'Nuevo:', newItems.map(i => i.producto.id)
      );

      if (!isEqual(currentItems, newItems)) {
        console.log('[CartService] Actualizando carrito con cambios');
        this.cartSubject.next({ ...response, data: { ...newCart.data } });
      } else {
        console.log('[CartService] Sin cambios en los items');
      }
    }
  }

  private validateCart(response: ApiResponseBody<CarritoResponse>): ApiResponseBody<CarritoResponse> {
    const items = response.data.itemsCarrito.filter(i => i.producto.id && i.cantidad > 0);
    return { ...response, data: { ...response.data, itemsCarrito: items }};
  }

  private handleError(error: any): Observable<never> {
    this.setLoading(false);
    if (error.status === 401) { this.authService.logout(); return throwError(() => new Error('Sesión expirada')); }
    const msg = error.error?.message || error.message || 'Error carrito';
    return throwError(() => new Error(msg));
  }
}
