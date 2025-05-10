import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Categoria } from '../../model/Categoria';
import { CategoriasService } from '../../services/categorias.service';

@Component({
  selector: 'app-edit-categoria-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-categoria-modal.component.html',
  styleUrls: ['./edit-categoria-modal.component.css']
})
export class EditCategoriaModalComponent {
  editForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  errorMessage: string | null = null;
  isSubmitting = false;

  private originalValores: {
    nombre: string;
    descripcion: string;
    imgUrl?: string;
  };

  constructor(
    public dialogRef: MatDialogRef<EditCategoriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria: Categoria },
    private fb: FormBuilder,
    private categoriasService: CategoriasService
  ) {
    this.originalValores = {
      nombre: data.categoria.nombre.trim(),
      descripcion: data.categoria.descripcion.trim(),
      imgUrl: data.categoria.imgUrl
    };

    this.editForm = this.fb.group({
      nombre: [
        this.originalValores.nombre,
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)]
      ],
      descripcion: [
        this.originalValores.descripcion,
        [Validators.required, Validators.minLength(10), Validators.maxLength(255)]
      ]
    });

    this.previewUrl = this.categoriasService.buildImageUrl(
      this.originalValores.imgUrl,
      this.data.categoria.imgOrigen
    );
  }

  get hasChanges(): boolean {
    const formValores = this.editForm.value;
    
    const cambiosTexto = 
      formValores.nombre.trim() !== this.originalValores.nombre ||
      formValores.descripcion.trim() !== this.originalValores.descripcion;

    return cambiosTexto || !!this.selectedFile;
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
    this.previewUrl = this.categoriasService.buildImageUrl(
      this.originalValores.imgUrl,
      this.data.categoria.imgOrigen
    );
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

    const categoriaActualizada: Categoria & { imageFile?: File } = {
      ...this.data.categoria,
      nombre: formValores.nombre.trim(),
      descripcion: formValores.descripcion.trim(),
      imgUrl: finalImageUrl,
      ...(this.selectedFile && { imageFile: this.selectedFile })
    };

    this.dialogRef.close(categoriaActualizada);
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

    return null;
  }
}