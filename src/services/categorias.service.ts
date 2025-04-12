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
  private imagenBaseUrl = 'http://localhost:8080/';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  updateCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(
      `${this.apiUrl}/${categoria.id}`,
      {
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        imgUrl: categoria.imgUrl  // Aquí usamos el nombre original del backend
      },
      { headers: this.createHeaders() }
    ).pipe(
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

    return this.http.post<Categoria>(
      `${this.apiUrl}/${id}/upload-image`,
      formData,
      { headers: this.createHeaders(false) }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getAll(): Observable<Categoria[]> {
    console.log('[CategoriasService] getAll() invocado');
    return this.http.get<ApiResponseBody<Categoria[]>>(
      this.apiUrl,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => {
        console.log('[CategoriasService] Respuesta recibida:', response);
        if (response.status?.toUpperCase() === 'SUCCESS') {
          return response.data.map(categoria => ({
            ...categoria,
            imagenUrl: this.buildImageUrl(categoria.imgUrl) // construimos la URL completa y la asignamos a una nueva propiedad
          }));
        }
        throw new Error(response.message || 'Error al obtener categorías');
      }),
      catchError(this.handleError)
    );
  }
  
  buildImageUrl(imagenPath: string): string {
    // Agregar '/' entre la URL base y el path
    return `${this.imagenBaseUrl}${imagenPath}`; // <-- Usar this. y agregar la barra
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
