import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../model/Producto';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { EditProductoModalComponent } from '../edit-producto-modal/edit-producto-modal.component';
import { switchMap, filter, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { ErrorModalComponent } from '../error-modal/error-modal.component';
import { LoadingModalComponent } from '../load-modal/load-modal.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ErrorModalComponent, LoadingModalComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = true;
  hoverState: number | null = null;
  lastOperation: { type: 'update' | 'upload', product?: Producto, file?: File } | null = null;

  constructor(
    private productosService: ProductosService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.loadProductos(params['categoriaId']);
    });
  }

  loadProductos(categoriaId?: number): void {
    console.log('[ProductosComponent] Cargando productos para categoría ID:', categoriaId || 'todas');
    this.isLoading = true;
    this.errorMessage = null;
  
    const productos$ = categoriaId 
      ? this.productosService.getByCategoria(categoriaId)
      : this.productosService.getAll();
  
    productos$.subscribe({
      next: (productos: Producto[]) => {
        console.log('[ProductosComponent] Productos recibidos:', productos);
        this.productos = productos;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[ProductosComponent] Error cargando productos:', err);
        this.isLoading = false;
        this.handleLoadError(err);
      }
    });
  }

  onRetry(): void {
    if (this.lastOperation) {
      this.errorMessage = null;
      this.isLoading = true;

      if (this.lastOperation.type === 'update') {
        this.retryUpdate();
      } else if (this.lastOperation.type === 'upload') {
        this.retryUpload();
      }
    } else {
      this.loadProductos();
    }
  }

  onCloseErrorModal(): void {
    this.errorMessage = null;
    this.router.navigate(['/home']);
  }

  hasAdminRole(): boolean {
    return this.authService.hasRole('ROLE_ADMIN');
  }

  editProducto(producto: Producto): void {
    const dialogRef = this.dialog.open(EditProductoModalComponent, {
      width: '600px',
      data: { 
        producto: { 
          ...producto,
          categoria: { ...producto.categoria }
        } 
      }
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result: Producto & { imageFile?: File }) => {
        const { imageFile, ...productoToUpdate } = result;
        
        return this.productosService.updateProducto(productoToUpdate).pipe(
          switchMap(updatedProducto => {
            if (!imageFile) return of(updatedProducto);
            return this.productosService.uploadImage(
              updatedProducto.id,
              imageFile
            );
          })
        );
      })
    ).subscribe({ 
      next: (finalProducto) => this.handleUpdateSuccess(finalProducto),
      error: (err) => this.handleUpdateError(err)
    });
  }

  private retryUpdate(): void {
    if (!this.lastOperation?.product) return;

    this.productosService.updateProducto(this.lastOperation.product).subscribe({
      next: (updatedProducto) => this.handleUpdateSuccess(updatedProducto),
      error: (err) => this.handleUpdateError(err)
    });
  }

  private retryUpload(): void {
    if (!this.lastOperation?.product?.id || !this.lastOperation?.file) return;

    this.productosService.uploadImage(
      this.lastOperation.product.id,
      this.lastOperation.file
    ).subscribe({
      next: (updatedProducto) => this.handleUpdateSuccess(updatedProducto),
      error: (err) => this.handleUpdateError(err)
    });
  }

  private handleUpdateSuccess(updatedProducto: Producto): void {
    this.productosService.getProducto(updatedProducto.id).subscribe(freshProduct => {
        this.productos = this.productos.map(p => 
            p.id === freshProduct.id ? freshProduct : p
        );
    });
  }

  private handleUpdateError(err: Error | HttpErrorResponse): void {
    this.isLoading = false;
    const message = err instanceof HttpErrorResponse 
      ? this.getErrorMessage(err)
      : err.message;
    
    this.errorMessage = message;
    console.error('Error en operación:', this.lastOperation?.type, err);
    
    setTimeout(() => this.errorMessage = null, 5000);
  }

  private handleLoadError(err: HttpErrorResponse): void {
    this.errorMessage = this.getErrorMessage(err);
    console.error('[ProductosComponent] Error:', err);
  }

  private getErrorMessage(err: HttpErrorResponse): string {
    if (!err) return 'Error desconocido';
    if (err.status === 400) return 'Datos inválidos enviados al servidor';
    if (err.status === 401) return 'Sesión expirada. Por favor, inicie sesión nuevamente.';
    if (err.status === 403) return 'No tiene permisos para esta acción';
    if (err.status === 404) return 'Producto no encontrado';
    if (err.status === 413) return 'La imagen es demasiado grande (Máx 2MB)';
    if (err.status === 415) return 'Formato de imagen no soportado';
    return err.error?.message || err.message || 'Error desconocido';
  }
}