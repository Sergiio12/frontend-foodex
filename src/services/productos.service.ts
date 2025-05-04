import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Producto } from '../model/Producto';
import { AuthService } from './auth.service';
import { ApiResponseBody } from '../model/ApiResponseBody';
import { ImagenOrigen } from '../model/ImagenOrigen';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://localhost:8080/api/productos';
  private imagenBaseUrl = 'http://localhost:8080/api/images';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // productos.service.ts
  updateProducto(producto: Producto): Observable<Producto> {
    const payload = {
      ...producto,
      categoria: { id: producto.categoria.id },
      // Mantener los campos de imagen si existen
      imgUrl: producto.imgUrl,
      imgOrigen: producto.imgOrigen
    };

    return this.http.put<ApiResponseBody<Producto>>(
      `${this.apiUrl}/${producto.id}`,
      payload,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => ({
        ...response.data,
        imgUrl: this.buildImageUrl(response.data.imgUrl, response.data.imgOrigen)
      }))
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
      map(response => ({
        ...response.data,
        // Forzar el origen a UPLOAD y reconstruir URL
        imgOrigen: ImagenOrigen.UPLOAD,
        imgUrl: this.buildImageUrl(response.data.imgUrl, ImagenOrigen.UPLOAD)
      }))
    );
  }

  getAll(): Observable<Producto[]> {
    return this.http.get<ApiResponseBody<Producto[]>>(
      this.apiUrl,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => {
        if (response.status?.toUpperCase() === 'SUCCESS') {
          return response.data.map(producto => ({
            ...producto,
            imgUrl: this.buildImageUrl(producto.imgUrl, producto.imgOrigen)
          }));
        }
        throw new Error(response.message || 'Error al obtener productos');
      }),
      catchError(this.handleError)
    );
  }

  getByCategoria(categoriaId: number): Observable<Producto[]> {
    return this.http.get<ApiResponseBody<Producto[]>>(
      `${this.apiUrl}?categoriaId=${categoriaId}`,
      { headers: this.createHeaders() }
    ).pipe(
      map(response => {
        if (response.status?.toUpperCase() === 'SUCCESS') {
          return response.data.map(producto => ({
            ...producto,
            imgUrl: this.buildImageUrl(producto.imgUrl, producto.imgOrigen)
          }));
        }
        throw new Error(response.message || 'Error al obtener productos por categoría');
      }),
      catchError(this.handleError)
    );
  }

  getProducto(id: number): Observable<Producto> {
    // Corregir URL para usar path parameter
    return this.http.get<ApiResponseBody<Producto>>(
      `${this.apiUrl}/${id}`,  // ✅ ID en la URL
      { headers: this.createHeaders() }
    ).pipe(
      map(response => ({
        ...response.data,
        imgUrl: this.buildImageUrl(response.data.imgUrl, response.data.imgOrigen)
      })),
      catchError(this.handleError)
    );
  }

  createProducto(producto: Producto): Observable<Producto> {
    return this.http.post<ApiResponseBody<Producto>>(
      this.apiUrl,
      producto,
      { headers: this.createHeaders() }
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
      console.warn('[ProductosService] Imagen no disponible, usando placeholder');
      return 'assets/images/placeholder-product.jpg';
    }
    
    const encodedImgUrl = encodeURIComponent(imgUrl);
    const finalUrl = `${this.imagenBaseUrl}/${imgOrigen}/${encodedImgUrl}`;
    console.log('[ProductosService] URL final de imagen:', finalUrl);
    
    return finalUrl;
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
    console.error('Error en ProductosService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}