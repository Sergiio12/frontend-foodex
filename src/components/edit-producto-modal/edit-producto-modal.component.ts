import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Producto } from '../../model/Producto';

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
  previewUrl?: string | ArrayBuffer | null = null;
  errorMessage: string | null = null;
  isSubmitting = false;

  private originalValores: {
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    descatalogado: boolean;
    imgUrl?: string;
  };

  constructor(
    public dialogRef: MatDialogRef<EditProductoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto },
    private fb: FormBuilder,
  ) {
    this.originalValores = {
      nombre: data.producto.nombre.trim(),
      descripcion: data.producto.descripcion.trim(),
      precio: data.producto.precio,
      stock: data.producto.stock,
      descatalogado: data.producto.descatalogado,
      imgUrl: data.producto.imgUrl
    };

    this.editForm = this.fb.group({
      nombre: [
        this.originalValores.nombre,
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)]
      ],
      descripcion: [
        this.originalValores.descripcion,
        [Validators.required, Validators.minLength(10), Validators.maxLength(255)]
      ],
      precio: [
        this.originalValores.precio,
        [Validators.required, Validators.min(0.01), Validators.max(10000)]
      ],
      stock: [
        this.originalValores.stock,
        [Validators.required, Validators.min(0), Validators.max(100000)]
      ],
      descatalogado: [this.originalValores.descatalogado]
    });

    this.previewUrl = this.originalValores.imgUrl;
  }

  get hasChanges(): boolean {
    const formValores = this.editForm.value;
    
    const cambiosTexto = 
      formValores.nombre.trim() !== this.originalValores.nombre ||
      formValores.descripcion.trim() !== this.originalValores.descripcion;

    const cambiosNumericos = 
      formValores.precio !== this.originalValores.precio ||
      formValores.stock !== this.originalValores.stock;

    const cambiosEstado = 
      formValores.descatalogado !== this.originalValores.descatalogado;

    return cambiosTexto || cambiosNumericos || cambiosEstado || !!this.selectedFile;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const maxTamanoMB = 2;

    if (!tiposPermitidos.includes(file.type)) {
      this.errorMessage = 'Formato de imagen no válido (JPEG, PNG, WEBP)';
      return;
    }

    if (file.size > maxTamanoMB * 1024 * 1024) {
      this.errorMessage = `El tamaño máximo permitido es ${maxTamanoMB}MB`;
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
      this.errorMessage = null;
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.selectedFile = null;
    this.previewUrl = this.originalValores.imgUrl;
    this.errorMessage = null;
  }

  saveChanges(): void {
    if (!this.hasChanges) {
      this.errorMessage = 'No hay cambios que guardar';
      return;
    }

    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) {
      this.errorMessage = 'Complete los campos requeridos correctamente';
      return;
    }

    const formValores = this.editForm.value;
    const finalImageUrl = this.selectedFile ? undefined : this.originalValores.imgUrl;

    const productoActualizado: Producto & { imageFile?: File } = {
      ...this.data.producto,
      nombre: formValores.nombre.trim(),
      descripcion: formValores.descripcion.trim(),
      precio: this.parsearPrecio(formValores.precio),
      stock: Math.floor(formValores.stock),
      descatalogado: formValores.descatalogado,
      imgUrl: finalImageUrl,
      ...(this.selectedFile && { imageFile: this.selectedFile })
    };

    this.dialogRef.close(productoActualizado);
  }

  private parsearPrecio(valor: any): number {
    return parseFloat(valor.toString().replace(',', '.')) || 0;
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

    return null;
  }
}