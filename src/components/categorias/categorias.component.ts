import { Component, OnInit } from '@angular/core';
import { Categoria } from '../../model/Categoria';
import { CategoriasService } from '../../services/categorias.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { EditCategoriaModalComponent } from '../edit-categoria-modal/edit-categoria-modal.component';
import { switchMap, filter, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ErrorModalComponent } from '../error-modal/error-modal.component';
import { LoadingModalComponent } from '../load-modal/load-modal.component';
import { Router } from '@angular/router';

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
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    console.log('[CategoriasComponent] ngOnInit()');
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.isLoading = true;
    this.errorMessage = null;
    console.log('[CategoriasComponent] Cargando categorías...');
  
    this.categoriasService.getAll().subscribe({
      next: (categorias: Categoria[]) => {
        console.log('[CategoriasComponent] Categorías cargadas:', categorias);
        this.categorias = categorias; 
        this.isLoading = false;
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading = false;
          this.handleLoadError(err);
        }, 3000);
      }
    });
  }

  verProductos(categoriaId: number): void {
    this.router.navigate(['/productos'], {
      queryParams: { categoriaId }
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
      data: { categoria: { ...categoria } }
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap(result => {
        if (!result.id || isNaN(result.id)) {
          return throwError(() => new Error('ID de categoría inválido'));
        }
        return this.categoriasService.updateCategoria(result).pipe(
          switchMap(updatedCategoria => {
            if (!result.imageFile) return of(updatedCategoria);
            if (!updatedCategoria?.id) {
              return throwError(() => new Error('ID no recibido del servidor'));
            }
            return this.categoriasService.uploadImage(
              Number(updatedCategoria.id),
              result.imageFile
            ).pipe(
              map(() => updatedCategoria)
            );
          })
        );
      })
    ).subscribe({
      next: (finalCategoria) => this.handleUpdateSuccess(finalCategoria),
      error: (err) => this.handleUpdateError(err)
    });
  }

  private handleLoadError(err: HttpErrorResponse): void {
    this.errorMessage = this.getErrorMessage(err);
    console.error('[CategoriasComponent] Error:', err);
  }

  private handleUpdateSuccess(updatedCategoria: Categoria): void {
    this.categorias = this.categorias.map(c => {
      if (c.id === updatedCategoria.id) {
        return {
          ...updatedCategoria,
          imgUrl: updatedCategoria.imgUrl || c.imgUrl
        };
      }
      return c;
    });
    this.errorMessage = null;
  }

  private handleUpdateError(err: Error | HttpErrorResponse): void {
    const message = err instanceof HttpErrorResponse 
      ? this.getErrorMessage(err)
      : err.message;
    
    this.errorMessage = message;
    console.error('Error actualizando categoría:', err);
    
    setTimeout(() => this.errorMessage = null, 5000);
  }

  private getErrorMessage(err: HttpErrorResponse): string {
    if (!err) return 'Error desconocido';
    if (err.status === 400) return 'Datos inválidos enviados al servidor';
    if (err.status === 401) return 'Sesión expirada. Por favor, inicie sesión nuevamente.';
    if (err.status === 403) return 'No tiene permisos para esta acción';
    if (err.status === 404) return 'Categoría no encontrada';
    if (err.status === 413) return 'La imagen es demasiado grande (Máx 2MB)';
    if (err.status === 415) return 'Formato de imagen no soportado';
    return err.error?.message || err.message || 'Error desconocido';
  }
}