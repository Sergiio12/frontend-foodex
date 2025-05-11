import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriasService } from '../../services/categorias.service';
import { Categoria } from '../../model/Categoria';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { EditCategoriaModalComponent } from '../edit-categoria-modal/edit-categoria-modal.component';
import { switchMap, filter } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ErrorModalComponent } from '../error-modal/error-modal.component';
import { LoadingModalComponent } from '../load-modal/load-modal.component';
import { CreateCategoriaModalComponent } from '../create-categoria-modal/create-categoria-modal.component';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ErrorModalComponent, LoadingModalComponent],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = true;
  hoverState: number | null = null;

  constructor(
    private categoriasService: CategoriasService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(() => {
      this.loadCategorias();
    });
  }

  loadCategorias(): void {
    console.log('[CategoriasComponent] Cargando categorías');
    this.isLoading = true;
    this.errorMessage = null;
  
    this.categoriasService.getAll().subscribe({
      next: (categorias: Categoria[]) => {
        this.categorias = categorias;
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
    this.loadCategorias();
  }

  onCloseErrorModal(): void {
    this.errorMessage = null;
    this.router.navigate(['/home']);
  }

  hasAdminRole(): boolean {
    return this.authService.hasRole('ROLE_ADMIN');
  }

  editCategoria(categoria: Categoria): void {
    const dialogRef = this.dialog.open(EditCategoriaModalComponent, {
      width: '600px',
      data: { 
        categoria: { 
          ...categoria
        } 
      }
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result: Categoria & { imageFile?: File }) => {
        const { imageFile, ...categoriaToUpdate } = result;
        
        if (!categoriaToUpdate.id || isNaN(categoriaToUpdate.id)) {
          return throwError(() => new Error('ID de categoría inválido'));
        }
        
        return this.categoriasService.updateCategoria(categoriaToUpdate).pipe(
          switchMap(updatedCategoria => {
            if (!imageFile) return of(updatedCategoria);
            
            if (!updatedCategoria.id) {
              return throwError(() => new Error('ID de categoría no encontrado'));
            }
            
            return this.categoriasService.uploadImage(
              updatedCategoria.id, 
              imageFile
            );
          })
        );
      })
    ).subscribe({
      next: (finalCategoria) => this.handleUpdateSuccess(finalCategoria),
      error: (err) => this.handleUpdateError(err)
    });
  }

  getImageUrl(categoria: Categoria): string {
    return this.categoriasService.buildImageUrl(
      categoria.imgUrl, 
      categoria.imgOrigen
    );
  }

  verProductos(categoriaId: number): void {
    this.router.navigate(['/productos'], {
      queryParams: { categoriaId }
    });
  }

  openCreateCategoriaModal(): void {
      const dialogRef = this.dialog.open(CreateCategoriaModalComponent, {
        width: '800px',
        panelClass: 'custom-dialog-container'
      });
    
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadCategorias(); 
        }
      });
    }

  private handleUpdateSuccess(updatedCategoria: Categoria): void {
    this.categorias = this.categorias.map(c => 
      c.id === updatedCategoria.id ? {
        ...updatedCategoria,
        imgUrl: updatedCategoria.imgUrl || c.imgUrl
      } : c
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
    console.error('[CategoriasComponent] Error:', err);
  }

  private getErrorMessage(err: HttpErrorResponse): string {
    if (!err) return 'Error desconocido';
    switch(err.status) {
      case 400: return 'Datos inválidos enviados al servidor';
      case 401: return 'Sesión expirada. Por favor, inicie sesión nuevamente.';
      case 403: return 'No tiene permisos para esta acción';
      case 404: return 'Categoría no encontrada';
      case 413: return 'La imagen es demasiado grande (Máx 2MB)';
      case 415: return 'Formato de imagen no soportado';
      default: return err.error?.message || err.message || 'Error desconocido';
    }
  }
}