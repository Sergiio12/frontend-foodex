  import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiResponseBody } from '../model/ApiResponseBody';
import { CompraDTO } from '../model/CompraDTO';
import { CompraRequestDTO } from '../model/CompraRequestDTO';
import { EstadoCompra } from '../model/EstadoCompra';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private apiUrl = 'api/compras';

  constructor(private http: HttpClient) { }

  getAllCompras(): Observable<ApiResponseBody<CompraDTO[]>> {
    return this.http.get<ApiResponseBody<CompraDTO[]>>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
    );
  }

  getCompra(id: number): Observable<ApiResponseBody<CompraDTO>> {
    return this.http.get<ApiResponseBody<CompraDTO>>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteCompra(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  realizarCompra(compraRequest: CompraRequestDTO): Observable<CompraDTO> {
    return this.http.post<CompraDTO>(this.apiUrl, compraRequest)
      .pipe(
        catchError(error => {
          console.error('Error en la compra:', error);
          return throwError(() => new Error(error.error?.message || 'Error al procesar la compra'));
        })
      );
  }

  actualizarEstadoCompra(id: number, nuevoEstado: EstadoCompra): Observable<CompraDTO> {
    return this.http.patch<CompraDTO>(`${this.apiUrl}/${id}/estado`, { estado: nuevoEstado })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('Error en el servicio de compras:', error);
    return throwError(() => new Error(error.message || 'Error del servidor'));
  }
}