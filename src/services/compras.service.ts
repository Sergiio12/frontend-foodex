import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CompraDTO } from '../model/CompraDTO';
import { CompraRequestDTO } from '../model/CompraRequestDTO';
import { AuthService } from './auth.service';
import { URL_SERVIDOR } from '../utils/constantes';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private apiUrl = URL_SERVIDOR + 'api/compras';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  realizarCompra(compraRequest: CompraRequestDTO): Observable<CompraDTO> {
    return this.http.post<CompraDTO>(this.apiUrl, compraRequest, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(error => {
        console.error('Error en la compra:', error);
        return throwError(() => new Error(error.error?.message || 'Error al procesar la compra'));
      })
    );
  }

  getAllCompras(): Observable<CompraDTO[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((compra: any) => ({
            ...compra,
            fechaHora: new Date(compra.fechaHora)
          }));
        }
        throw new Error('Formato de respuesta inválido');
      }),
      catchError(this.handleError)
    );
  }

  getComprasByUsuario(username: string): Observable<CompraDTO[]> {
    const url = `${this.apiUrl}/usuario/${username}`;
    console.log('[CompraService] Solicitando compras para usuario:', username);
    
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('[CompraService] Respuesta cruda:', response)),
      map(response => {
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((compra: any) => ({
            ...compra,
            fechaHora: new Date(compra.fechaHora)
          }));
        }
        throw new Error('Formato de respuesta inválido');
      }),
      catchError(error => {
        console.error('[CompraService] Error obteniendo compras:', {
          status: error.status,
          mensaje: error.message,
          errorCompleto: error.error
        });
        return this.handleError(error);
      })
    );
  }

  getCompra(id: number): Observable<CompraDTO> {
    return this.http.get<CompraDTO>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      status: error.status || 'N/A',
      mensaje: error.error?.message || error.message || 'Error desconocido',
      url: error.url || 'URL no disponible',
      errorCompleto: error.error
    };
    
    console.error('[CompraService] Error detallado:', errorInfo);
    return throwError(() => new Error(
      `Error ${errorInfo.status}: ${errorInfo.mensaje}`
    ));
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.error('[CompraService] No se encontró token JWT');
      throw new Error('Autenticación requerida');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}