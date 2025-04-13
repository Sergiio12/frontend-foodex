import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Categoria } from '../model/Categoria';
import { AuthService } from './auth.service';
import { ApiResponseBody } from '../model/ApiResponseBody';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private apiUrl = 'http://localhost:8080/api/categorias';
  private imagenBaseUrl = 'http://localhost:8080/api/images';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Método para actualizar una categoría
  updateCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.put<ApiResponseBody<Categoria>>(
      `${this.apiUrl}/${categoria.id}`,
      {
        nombre: categoria.nombre,
        descripcion: categoria.descripcion
      },
      { headers: this.createHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // Método para subir una imagen para una categoría
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
      map(response => {
        if (response.status?.toUpperCase() === 'SUCCESS') {
          return response.data;
        }
        throw new Error(response.message || 'Error al subir la imagen');
      }),
      catchError(this.handleError)
    );
  }

  // Método para obtener todas las categorías
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

  // Construye la ruta completa de imagen con el origen
  buildImageUrl(imgUrl: string, imgOrigen: string): string {
    return `${this.imagenBaseUrl}/${imgOrigen}/${imgUrl}`;
  }

  // Encabezados HTTP
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

  // Manejo de errores
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
