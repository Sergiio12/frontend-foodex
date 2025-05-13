import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Producto } from '../model/Producto';
import { AuthService } from './auth.service';
import { ApiResponseBody } from '../model/ApiResponseBody';
import { ImagenOrigen } from '../model/ImagenOrigen';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly apiUrl = 'http://localhost:8080/api/productos';
  private readonly imagenBaseUrl = 'http://localhost:8080/api/images';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAll(): Observable<Producto[]> {
    return this.http.get<ApiResponseBody<Producto[]>>(
      this.apiUrl,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  getByCategoria(categoriaId: number): Observable<Producto[]> {
    return this.http.get<ApiResponseBody<Producto[]>>(
      `${this.apiUrl}?categoriaId=${categoriaId}`,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  getProducto(id: number): Observable<Producto> {
    return this.http.get<ApiResponseBody<Producto>>(
      `${this.apiUrl}/${id}`,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  deleteProducto(id: number): Observable<void> {
    return this.http.delete<ApiResponseBody<void>>(
      `${this.apiUrl}/${id}`,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => {
        if (response.status !== "success") {
          throw new Error(response.message || 'Error desconocido al eliminar');
        }
      }),
      catchError(this.handleError)
    );
  }
  
  createProducto(producto: Omit<Producto, 'id'>): Observable<Producto> {
    return this.http.post<ApiResponseBody<Producto>>(
      this.apiUrl,
      producto,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  updateProducto(producto: Producto): Observable<Producto> {
    const payload = {
      ...producto,
      categoria: { id: producto.categoria.id },
      imgUrl: producto.imgUrl,
      imgOrigen: producto.imgOrigen 
    };

    return this.http.put<ApiResponseBody<Producto>>(
      `${this.apiUrl}/${producto.id}`,
      payload,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  uploadImage(id: number, file: File): Observable<Producto> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<ApiResponseBody<Producto>>(
      `${this.apiUrl}/${id}/upload-image`,
      formData,
      { headers: this.createHeaders(false) }
    ).pipe(
      map(response => response.data), 
      catchError(this.handleError)
    );
  }

  buildImageUrl(imgUrl?: string, imgOrigen?: ImagenOrigen): string {
    if (!imgUrl || !imgOrigen) {
      return 'assets/images/placeholder-product.jpg';
    }
    return `${this.imagenBaseUrl}/${imgOrigen}/${encodeURIComponent(imgUrl)}`;
  }

  private createHeaders(includeJsonContentType = true): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    if (includeJsonContentType) headers = headers.set('Content-Type', 'application/json');
    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = error.error instanceof ErrorEvent
      ? `Error del cliente: ${error.error.message}`
      : error.error?.message || error.message || 'Error desconocido';
    
    console.error('Error en ProductosService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}