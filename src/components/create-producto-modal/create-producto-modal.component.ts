import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductosService } from '../../services/productos.service';
import { CategoriasService } from '../../services/categorias.service';
import { Categoria } from '../../model/Categoria';
import { switchMap } from 'rxjs';
import { Producto } from '../../model/Producto';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-producto-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatOptionModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './create-producto-modal.component.html',
  styleUrls: ['./create-producto-modal.component.css']
})
export class CreateProductoModalComponent implements OnInit {
  productoForm: FormGroup;
  categorias: Categoria[] = [];
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  errorMessage: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    public dialogRef: MatDialogRef<CreateProductoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
      precio: ['', [Validators.required, Validators.min(0.01), Validators.max(10000)]],
      stock: ['', [Validators.required, Validators.min(0), Validators.max(100000)]],
      descatalogado: [false],
      categoria: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCategorias();
  }

  getError(controlName: string): string | null {
    const control = this.productoForm.get(controlName);
    
    if (!control?.touched || !control.errors) return null;

    if (control.hasError('required')) return 'Campo obligatorio';
    if (control.hasError('minlength')) 
      return `Mín. ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.hasError('maxlength')) 
      return `Máx. ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.hasError('min')) 
      return `Valor mínimo: ${control.errors['min'].min}`;
    if (control.hasError('max')) 
      return `Valor máximo: ${control.errors['max'].max}`;

    return null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeMB = 2;
    
    if (!validTypes.includes(file.type)) {
      this.errorMessage = 'Solo se permiten imágenes JPEG, PNG o WEBP';
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      this.errorMessage = `El tamaño máximo permitido es ${maxSizeMB}MB`;
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result;
    reader.readAsDataURL(file);
    this.errorMessage = null;
  }

  clearImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.errorMessage = null;
  }

  onSubmit(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      this.errorMessage = 'Complete todos los campos requeridos';
      return;
    }

    if (!this.selectedFile) {
      this.errorMessage = 'Debe seleccionar una imagen';
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productoForm.value;

    const nuevoProducto: Omit<Producto, 'id'> = {
      nombre: formValue.nombre.trim(),
      descripcion: formValue.descripcion.trim(),
      precio: parseFloat(formValue.precio),
      stock: parseInt(formValue.stock, 10),
      descatalogado: formValue.descatalogado,
      categoria: { id: formValue.categoria } as Categoria,
      fechaAlta: new Date().toISOString()
    };

    this.productosService.createProducto(nuevoProducto).pipe(
      switchMap((productoCreado) => {
        return this.productosService.uploadImage(productoCreado.id, this.selectedFile!);
      })
    ).subscribe({
      next: (productoFinal) => {
        this.dialogRef.close(productoFinal);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.getErrorMessage(err);
        console.error(err);
      }
    });
  }

  private loadCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar categorías';
        console.error(err);
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 400) return 'Datos inválidos';
    if (err.status === 413) return 'Imagen demasiado grande';
    if (err.status === 415) return 'Formato de imagen no soportado';
    return 'Error al crear el producto';
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}