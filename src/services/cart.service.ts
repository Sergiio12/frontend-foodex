import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, tap, catchError, finalize, map, distinctUntilChanged, shareReplay } from 'rxjs';
import { AuthService } from './auth.service';
import { UpdateCartRequest } from '../payloads/UpdateCartRequest';
import { ApiResponseBody } from '../model/ApiResponseBody';
import { CarritoResponse } from '../payloads/CarritoResponse';
import { ItemCarrito } from '../model/ItemCarrito';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly API_URL = 'http://localhost:8080/api/carrito';
  
  // Corregir el tipo del BehaviorSubject
  private cartSubject = new BehaviorSubject<ApiResponseBody<CarritoResponse> | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Actualizar los observables públicos
  public cart$ = this.cartSubject.asObservable().pipe(shareReplay(1));
  public isLoading$ = this.loadingSubject.asObservable();
  
  public totalPrice$ = this.cart$.pipe(
    map(response => {
      if (!response?.data?.itemsCarrito) return 0;
      return response.data.itemsCarrito.reduce((total, item) => {
        return total + (item.producto.precio * item.cantidad);
      }, 0);
    }),
    distinctUntilChanged()
  );

  // Contador corregido
  public uniqueItemsCount$ = this.cart$.pipe(
    map(response => response?.data?.itemsCarrito?.length || 0),
    distinctUntilChanged()
  );

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // --- Métodos principales ---
  getCart(): Observable<ApiResponseBody<CarritoResponse>> {
    this.setLoading(true);
    return this.http.get<ApiResponseBody<CarritoResponse>>(this.API_URL, { 
      headers: this.authHeaders 
    }).pipe(
      tap(response => {
        if (response.status === 'success') {
          this.cartSubject.next(response); // Enviar toda la respuesta
        }
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  updateItem(request: UpdateCartRequest): Observable<ApiResponseBody<CarritoResponse>> {
    this.setLoading(true);
    return this.http.put<ApiResponseBody<CarritoResponse>>(
      `${this.API_URL}/añadir`,
      request,
      { headers: this.authHeaders }
    ).pipe(
      tap(response => this.handleCartResponse(response)),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  removeItem(productId: number): Observable<ApiResponseBody<CarritoResponse>> {
    this.setLoading(true);
    return this.http.delete<ApiResponseBody<CarritoResponse>>(
      `${this.API_URL}/eliminar`,
      { 
        headers: this.authHeaders,
        body: { productoId: productId }
      }
    ).pipe(
      tap(response => this.handleCartResponse(response)),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  clearCart(): Observable<ApiResponseBody<void>> {
    this.setLoading(true);
    return this.http.delete<ApiResponseBody<void>>(
      `${this.API_URL}/vaciar`,
      { headers: this.authHeaders }
    ).pipe(
      tap(() => this.cartSubject.next(null)),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  get currentTotal(): number {
    const response = this.cartSubject.value;
    if (!response?.data?.itemsCarrito) return 0;
    return response.data.itemsCarrito.reduce((total, item) => {
      return total + (item.producto.precio * item.cantidad);
    }, 0);
  }

  // --- Helpers ---
  private get authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) throw new Error('Usuario no autenticado');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleCartResponse(response: ApiResponseBody<CarritoResponse>): void {
    if (response.status === 'success') {
      const validatedCart = this.validateCartItems(response);
      this.cartSubject.next(validatedCart);
    }
  }

  private validateCartItems(response: ApiResponseBody<CarritoResponse>): ApiResponseBody<CarritoResponse> {
    if (!response.data?.itemsCarrito) return response;
    
    const validItems = response.data.itemsCarrito.filter(item => 
      item?.producto?.id && 
      item?.cantidad > 0 &&
      item?.producto?.precio > 0
    );
    
    return {
      ...response,
      data: {
        ...response.data,
        itemsCarrito: validItems
      }
    };
  }

  private setLoading(isLoading: boolean): void {
    this.loadingSubject.next(isLoading);
  }

  private handleError(error: any): Observable<never> {
    this.setLoading(false);
    
    const errorMessage = error.error?.message || 
                        error.message || 
                        'Error desconocido en el carrito';
    
    if (error.status === 401) {
      this.authService.logout();
      return throwError(() => new Error('Sesión expirada. Redirigiendo...'));
    }

    console.error('Error del carrito:', {
      error,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
    
    return throwError(() => new Error(errorMessage));
  }
}