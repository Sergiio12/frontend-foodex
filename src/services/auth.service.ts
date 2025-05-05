import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoginRequest } from '../payloads/LoginRequest';
import { SignupRequest } from '../payloads/SignupRequest';
import { ApiResponseBody } from '../model/ApiResponseBody';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'authToken';
  private authStatus = new BehaviorSubject<boolean>(this.isValidToken(this.getToken()));

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.validateExistingToken();
  }

  authenticate(user: LoginRequest): Observable<ApiResponseBody> {
    return this.http.post<ApiResponseBody>(`${this.API_URL}/signin`, user).pipe(
      tap(response => {
        if (response?.data?.token) {
          this.storeToken(response.data.token);
          this.authStatus.next(true);
          this.validateExistingToken();
        }
      }),
      catchError(error => this.handleError(error)) 
    );
  }

  register(user: SignupRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/signup`, user).pipe(
      catchError(error => this.handleError(error))
    );
  }

  logout(): void {
    this.clearToken();
    this.authStatus.next(false);
    this.router.navigate(['/login']);
  }

  getAuthStatus(): Observable<boolean> {
    return this.authStatus.asObservable();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.preferred_username || payload?.unique_name || payload?.username || payload?.sub || null;
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  }

  isValidToken(token: string | null): boolean {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (e) {
      return false;
    }
  }

  hasRole(requiredRole: string): boolean {
    const userRoles = this.getUserRoles();
    return userRoles.includes(requiredRole);
  }

  private getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles = payload.roles || [];
      return Array.isArray(roles) ? roles : [roles];
    } catch (e) {
      console.error('Error decodificando roles del token:', e);
      return [];
    }
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private validateExistingToken(): void {
    const token = this.getToken();
    const isValid = this.isValidToken(token);
    
    if (token && !isValid) {
      this.clearToken();
      this.authStatus.next(false);
    } else if (isValid) {
      this.authStatus.next(true); 
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = this.getErrorMessage(error);
    }
    console.error(`[${new Date().toISOString()}] Error AuthService: `, error);
    return throwError(() => ({
      message: errorMessage,
      code: error.status,
      details: error.error?.details || null
    }));
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'No ha sido posible contactar con el servidor. Revisa tu conexión a Internet y, si el error persiste, contacta con un administrador.';
      case 401:
        return 'Credenciales incorrectas.';
      case 403:
        return 'Acceso no autorizado.';
      case 500:
        return 'Error interno del servidor. Intente más tarde o contacte con un administrador.';
      default:
        return 'Error desconocido. Contacte con un administrador.';
    }
  }
}
