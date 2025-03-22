import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoginRequest } from '../model/LoginRequest';
import { SignupRequest } from '../model/SignupRequest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `http://localhost:8080/api/auth`;
  private authStatus = new BehaviorSubject<boolean>(this.hasToken());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  authenticate(user: LoginRequest): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/signin`, user).pipe(
      tap(response => this.handleAuthentication(response.accessToken)),
      catchError(error => this.handleError(error))
    );
  }

  register(user: SignupRequest) : Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, user)
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  private handleAuthentication(token: string): void {
    localStorage.setItem('access_token', token);
    this.authStatus.next(true);
    this.router.navigate(['/dashboard']);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Credenciales inválidas';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión con el servidor';
    }

    return throwError(() => ({ 
      message: errorMessage,
      code: error.status
    }));
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.authStatus.next(false);
    this.router.navigate(['/login']);
  }

  getAuthStatus(): Observable<boolean> {
    return this.authStatus.asObservable();
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}