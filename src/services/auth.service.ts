import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoginRequest } from '../model/LoginRequest';
import { SignupRequest } from '../model/SignupRequest';

interface AuthResponse {
  status: string;
  message: string;
  timestamp: string;
  data: {
    token: string;
  };
}

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

  // En tu AuthService
  authenticate(user: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/signin`, user).pipe(
      tap(response => {
        if (response?.data?.token) {
          this.storeToken(response.data.token);
          this.authStatus.next(true);
          // ¡Faltaba actualizar el estado de autenticación aquí!
          this.validateExistingToken(); // Añadir esta línea
        }
      }),
      catchError(error => this.handleError(error)) // Añadir manejo de errores
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

  // Extrae información del token decodificándolo
  // En AuthService
  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.preferred_username || 
            payload?.unique_name || 
            payload?.username || 
            payload?.sub || 
            null;
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  }

  // MEJORAR MÉTODO isValidToken
  isValidToken(token: string | null): boolean {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now; // Verificar expiración real del token
    } catch (e) {
      return false;
    }
  }

  // Añade este método en la clase AuthService
  hasRole(requiredRole: string): boolean {
    const userRoles = this.getUserRoles();
    return userRoles.includes(requiredRole);
  }

  private getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles || [];
    } catch (e) {
      console.error('Error decodificando roles del token:', e);
      return [];
    }
  }
  // Solo almacena el token en el localStorage
  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // MEJORAR validateExistingToken
  private validateExistingToken(): void {
    const token = this.getToken();
    const isValid = this.isValidToken(token);
    
    if (token && !isValid) {
      this.clearToken();
      this.authStatus.next(false);
    } else if (isValid) {
      this.authStatus.next(true); // Forzar actualización de estado
    }
  }

  // ACTUALIZAR handleError
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
