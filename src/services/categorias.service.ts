import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Categoria } from '../model/Categoria';
import { AuthService } from './auth.service';
import { ApiResponseBody } from '../model/ApiResponseBody';
import { ImagenOrigen } from '../model/ImagenOrigen';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly apiUrl = 'http://localhost:8080/api/categorias';
  private readonly imagenBaseUrl = 'http://localhost:8080/api/images';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAll(): Observable<Categoria[]> {
    return this.http.get<ApiResponseBody<Categoria[]>>(
      this.apiUrl,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  getByCategoria(categoriaId: number): Observable<Categoria[]> {
    return this.http.get<ApiResponseBody<Categoria[]>>(
      `${this.apiUrl}?categoriaId=${categoriaId}`,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  getCategoria(id: number): Observable<Categoria> {
    return this.http.get<ApiResponseBody<Categoria>>(
      `${this.apiUrl}/${id}`,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  createCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.post<ApiResponseBody<Categoria>>(
      this.apiUrl,
      categoria,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  deleteCategoria(id: number): Observable<void> {
    return this.http.delete<ApiResponseBody<void>>(
      `${this.apiUrl}/${id}`,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => {
        if (response.status !== 'success') {
          throw new Error(response.message || 'Error desconocido al eliminar');
        }
      }),
      catchError(this.handleError)
    );
  }

  updateCategoria(categoria: Categoria): Observable<Categoria> {
    const payload = {
      ...categoria,
      imgUrl: categoria.imgUrl,
      imgOrigen: categoria.imgOrigen
    };

    return this.http.put<ApiResponseBody<Categoria>>(
      `${this.apiUrl}/${categoria.id}`,
      payload,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  uploadImage(id: number, file: File): Observable<Categoria> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<ApiResponseBody<Categoria>>(
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
      return 'assets/images/placeholder-category.jpg';
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
    
    console.error('Error en CategoriasService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}