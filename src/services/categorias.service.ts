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
      map(response => {
        if (response.status?.toUpperCase() === 'SUCCESS') {
          return response.data.map(categoria => ({
            ...categoria,
            imgUrl: this.buildImageUrl(categoria.imgUrl, categoria.imgOrigen)
          }));
        }
        throw new Error(response.message || 'Error al obtener categorías');
      }),
      catchError(this.handleError)
    );
  }

  updateCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.put<ApiResponseBody<Categoria>>(
      `${this.apiUrl}/${categoria.id}`,
      {
        nombre: categoria.nombre,
        descripcion: categoria.descripcion
      },
      { headers: this.createHeaders() }
    ).pipe(
      map(response => ({
        ...response.data,
        imgUrl: this.buildImageUrl(response.data.imgUrl, response.data.imgOrigen)
      })),
      catchError(this.handleError)
    );
  }

  uploadImage(id: number, file: File): Observable<Categoria> {
    if (!id || isNaN(id)) {
      return throwError(() => new Error('ID de categoría inválido'));
    }
    if (!file) {
      return throwError(() => new Error('Archivo no seleccionado'));
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<ApiResponseBody<Categoria>>(
      `${this.apiUrl}/${id}/upload-image`,
      formData,
      { headers: this.createHeaders(false) }
    ).pipe(
      map(response => ({
        ...response.data,
        imgUrl: this.buildImageUrl(response.data.imgUrl, response.data.imgOrigen)
      })),
      catchError(this.handleError)
    );
  }

  buildImageUrl(imgUrl?: string, imgOrigen?: ImagenOrigen): string {
    if (!imgUrl || !imgOrigen) {
      return 'assets/images/placeholder-category.jpg';
    }
    const encodedImgUrl = encodeURIComponent(imgUrl);
    return `${this.imagenBaseUrl}/${imgOrigen}/${encodedImgUrl}`;
  }

  private createHeaders(includeJsonContentType = true): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (includeJsonContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || error.message;
    }
    console.error('Error en CategoriasService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}