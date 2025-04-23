import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Producto } from '../../model/Producto';
import { ImagenOrigen } from '../../model/ImagenOrigen';

@Component({
  selector: 'app-edit-producto-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-producto-modal.component.html',
  styleUrls: ['./edit-producto-modal.component.css']
})
export class EditProductoModalComponent {
  editForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  errorMessage: string | null = null;
  isSubmitting = false;

  private originalNombre: string;
  private originalDesc: string;
  private originalPrecio: number;
  private originalStock: number;
  private originalDescatalogado: boolean;
  private originalImageUrl?: string;
  private originalImgOrigen?: ImagenOrigen;

  constructor(
    public dialogRef: MatDialogRef<EditProductoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto },
    private fb: FormBuilder
  ) {
    console.log('[EditProductoModal] Producto recibido:', data.producto);
    // Inicializar valores originales
    this.originalNombre = data.producto.nombre.trim();
    this.originalDesc = data.producto.descripcion.trim();
    this.originalPrecio = data.producto.precio;
    this.originalStock = data.producto.stock;
    this.originalDescatalogado = data.producto.descatalogado;
    this.originalImageUrl = data.producto.imgUrl;
    this.originalImgOrigen = data.producto.imgOrigen;

    // Inicializar formulario
    this.editForm = this.fb.group({
      nombre: [
        this.originalNombre,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50)
        ]
      ],
      descripcion: [
        this.originalDesc,
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(255)
        ]
      ],
      precio: [
        this.originalPrecio,
        [
          Validators.required,
          Validators.min(0.01),
          Validators.max(10000)
        ]
      ],
      stock: [
        this.originalStock,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(100000)
        ]
      ],
      descatalogado: [this.originalDescatalogado]
    });

    // Configurar preview inicial
    this.previewUrl = this.originalImageUrl || null;
  }

  get hasChanges(): boolean {
    const currentValues = this.editForm.value;
    const numericChanges = 
      currentValues.precio !== this.originalPrecio ||
      currentValues.stock !== this.originalStock;
      
    const stringChanges = 
      currentValues.nombre.trim() !== this.originalNombre ||
      currentValues.descripcion.trim() !== this.originalDesc;

    const statusChange = 
      currentValues.descatalogado !== this.originalDescatalogado;

    return numericChanges || stringChanges || statusChange || !!this.selectedFile;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Validar tipo y tamaño
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

    // Leer y mostrar preview
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result;
    reader.readAsDataURL(file);
    this.errorMessage = null;
  }

  clearImage(): void {
    this.selectedFile = null;
    this.previewUrl = this.originalImageUrl || null;
    this.errorMessage = null;
  }

  saveChanges(): void {
    if (!this.hasChanges) {
      this.errorMessage = 'No se detectaron cambios para guardar';
      return;
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.errorMessage = 'Por favor complete todos los campos requeridos';
      return;
    }

    const formValue = this.editForm.value;
    const updatedProduct: Producto & { imageFile?: File } = {
      ...this.data.producto,
      nombre: formValue.nombre.trim(),
      descripcion: formValue.descripcion.trim(),
      precio: parseFloat(formValue.precio.toFixed(2)),
      stock: Math.floor(formValue.stock),
      descatalogado: formValue.descatalogado,
      imgUrl: this.selectedFile ? undefined : this.originalImageUrl,
      ...(this.selectedFile && { imageFile: this.selectedFile })
    };

    this.dialogRef.close(updatedProduct);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getError(controlName: string): string | null {
    const control = this.editForm.get(controlName);
    
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

    return 'Error desconocido';
  }
}