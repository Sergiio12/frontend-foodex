import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../model/Producto';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { EditProductoModalComponent } from '../edit-producto-modal/edit-producto-modal.component';
import { switchMap, filter } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ErrorModalComponent } from '../error-modal/error-modal.component';
import { LoadingModalComponent } from '../load-modal/load-modal.component';
import { CreateProductoModalComponent } from '../create-producto-modal/create-producto-modal.component';

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
        this.productos = productos;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.handleLoadError(err);
      }
    });
  }

  onRetry(): void {
    this.errorMessage = null;
    this.loadProductos();
  }

  onCloseErrorModal(): void {
    this.errorMessage = null;
    this.router.navigate(['/home']);
  }

  hasAdminRole(): boolean {
    return this.authService.hasRole('ROLE_ADMIN');
  }

  deleteProducto(producto: Producto): void {
    if (!producto.id) return;

    const confirmation = confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`);
    if (!confirmation) return;

    this.isLoading = true;
    
    this.productosService.deleteProducto(producto.id).subscribe({
      next: () => {
        this.productos = this.productos.filter(p => p.id !== producto.id);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.handleDeleteError(err);
      }
    });
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
        
        if (!productoToUpdate.id || isNaN(productoToUpdate.id)) {
          return throwError(() => new Error('ID de producto inválido'));
        }
        
        return this.productosService.updateProducto(productoToUpdate).pipe(
          switchMap(updatedProducto => {
            if (!imageFile) return of(updatedProducto);
            
            if (!updatedProducto.id) {
              return throwError(() => new Error('ID de producto no encontrado'));
            }
            
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

  getImageUrl(producto: Producto): string {
    return this.productosService.buildImageUrl(
      producto.imgUrl, 
      producto.imgOrigen
    );
  }

  openCreateProductoModal(): void {
    const dialogRef = this.dialog.open(CreateProductoModalComponent, {
      width: '800px',
      panelClass: 'custom-dialog-container'
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProductos(); 
      }
    });
  }

  private handleUpdateSuccess(updatedProducto: Producto): void {
    this.productos = this.productos.map(p => 
      p.id === updatedProducto.id ? {
        ...updatedProducto,
        imgUrl: updatedProducto.imgUrl || p.imgUrl
      } : p
    );
  }

  private handleUpdateError(err: Error | HttpErrorResponse): void {
    this.isLoading = false;
    const message = err instanceof HttpErrorResponse 
      ? this.getErrorMessage(err)
      : err.message;
    
    this.errorMessage = message;
    console.error('Error en operación:', err);
    
    setTimeout(() => this.errorMessage = null, 5000);
  }

  private handleLoadError(err: HttpErrorResponse): void {
    this.errorMessage = this.getErrorMessage(err);
    console.error('[ProductosComponent] Error:', err);
  }

  private getErrorMessage(err: HttpErrorResponse): string {
    if (!err) return 'Error desconocido';
    switch(err.status) {
      case 400: return 'Datos inválidos enviados al servidor';
      case 401: return 'Sesión expirada. Por favor, inicie sesión nuevamente.';
      case 403: return 'No tiene permisos para esta acción';
      case 404: return 'Producto no encontrado';
      case 413: return 'La imagen es demasiado grande (Máx 2MB)';
      case 415: return 'Formato de imagen no soportado';
      default: return err.error?.message || err.message || 'Error desconocido';
    }
  }

  private handleDeleteError(err: Error | HttpErrorResponse): void {
    let errorMessage = 'Error al eliminar el producto';
    
    if (err instanceof HttpErrorResponse) {
      switch(err.status) {
        case 404:
          errorMessage = 'El producto no existe o ya fue eliminado';
          break;
        case 403:
          errorMessage = 'No tienes permisos para esta acción';
          break;
        case 500:
          errorMessage = 'Error del servidor al procesar la solicitud';
          break;
      }
      
      if (err.error?.message) {
        errorMessage += `: ${err.error.message}`;
      }
    }
    
    this.errorMessage = errorMessage;
    setTimeout(() => this.errorMessage = null, 5000);
  }
  
}