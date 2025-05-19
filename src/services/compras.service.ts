import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CompraDTO } from '../model/CompraDTO';
import { CompraRequestDTO } from '../model/CompraRequestDTO';
import { AuthService } from './auth.service'; // Importar el servicio de autenticación

@Injectable({ providedIn: 'root' })
export class CompraService {
  private apiUrl = 'http://localhost:8080/api/compras'; // URL completa

  constructor(
    private http: HttpClient,
    private authService: AuthService // Inyectar AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  realizarCompra(compraRequest: CompraRequestDTO): Observable<CompraDTO> {
    return this.http.post<CompraDTO>(
      this.apiUrl, 
      compraRequest, 
      { headers: this.getHeaders() } // Incluir headers con token
    ).pipe(
      catchError(error => {
        console.error('Error en la compra:', error);
        return throwError(() => new Error(error.error?.message || 'Error al procesar la compra'));
      })
    );
  }

  // Resto de métodos actualizados para incluir headers
  getAllCompras(): Observable<CompraDTO[]> {
    return this.http.get<CompraDTO[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getCompra(id: number): Observable<CompraDTO> {
    return this.http.get<CompraDTO>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Error en el servicio de compras:', error);
    return throwError(() => new Error(error.message || 'Error del servidor'));
  }
}