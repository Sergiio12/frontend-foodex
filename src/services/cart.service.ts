import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, tap, catchError, take } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = 'http://localhost:8080/api/carrito';
  private cartItemsCount = new BehaviorSubject<number>(0);
  private loading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getCartItemsCount(): Observable<number> {
    return this.cartItemsCount.asObservable();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    // Asegurar que el token no sea null o undefined
    if (!token) {
      console.error('No se encontró el token JWT');
      this.authService.logout(); // Cerrar sesión si el token no está presente
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private handleAuthError(error: any): Observable<never> {
    if (error.status === 401) {
      this.authService.logout();
    }
    return throwError(() => error);
  }

  getCart(): Observable<any> {
    this.loading.next(true);
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      tap({
        next: (response) => {
          let totalItems = 0;
          
          // Compatibilidad con diferentes estructuras de respuesta
          if (response?.data?.itemsCarrito) { // Estructura 1
            totalItems = response.data.itemsCarrito.reduce((acc: number, item: any) => acc + item.cantidad, 0);
          } else if (response?.items) { // Estructura 2
            totalItems = response.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
          } else if (Array.isArray(response)) { // Estructura 3
            totalItems = response.reduce((acc: number, item: any) => acc + item.quantity, 0);
          }
          
          this.cartItemsCount.next(totalItems);
          this.loading.next(false);
        },
        error: () => this.loading.next(false)
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  addToCart(productId: number, cantidad: number): Observable<any> {
    this.loading.next(true);
    return this.http.put(
      `${this.apiUrl}/añadir?idProducto=${productId}&cantidad=${cantidad}`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        // Actualización optimizada
        const currentCount = this.cartItemsCount.value;
        this.cartItemsCount.next(currentCount + cantidad);
        this.refreshCart(); // Sincronización con backend
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  removeFromCart(productId: number, cantidad: number): Observable<any> {
    this.loading.next(true);
    return this.http.delete(
      `${this.apiUrl}/eliminar?idProducto=${productId}&cantidad=${cantidad}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        // Actualización optimizada
        const currentCount = this.cartItemsCount.value;
        this.cartItemsCount.next(Math.max(currentCount - cantidad, 0));
        this.refreshCart(); // Sincronización con backend
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  clearCart(): Observable<any> {
    this.loading.next(true);
    return this.http.delete(
      `${this.apiUrl}/vaciar`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        this.cartItemsCount.next(0);
        this.loading.next(false);
      }),
      catchError(error => {
        this.handleAuthError(error);
        return this.handleError(error);
      })
    );
  }

  // ... Los demás métodos permanecen igual ...

  private handleError(error: any): Observable<never> {
    this.loading.next(false);
    const errorMessage = error.error?.message || error.message || 'Unknown error';
    return throwError(() => new Error(errorMessage));
  }

  private refreshCart(): void {
    this.getCart().pipe(take(1)).subscribe({
      error: (err) => console.error('Error refreshing cart:', err)
    });
  }

}