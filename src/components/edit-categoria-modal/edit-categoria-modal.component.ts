import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Categoria } from '../../model/Categoria';

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
  previewUrl?: string | ArrayBuffer | null;
  errorMessage: string | null = null;
  isSubmitting = false;

  private originalName: string;
  private originalDesc: string;
  private originalImageUrl?: string;

  constructor(
    public dialogRef: MatDialogRef<EditCategoriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria: Categoria },
    private fb: FormBuilder
  ) {
    this.originalName     = data.categoria.nombre.trim();
    this.originalDesc     = data.categoria.descripcion.trim();
    this.originalImageUrl = data.categoria.imgUrl;

    this.editForm = this.fb.group({
      nombre: [
        this.originalName,
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)]
      ],
      descripcion: [
        this.originalDesc,
        [Validators.required, Validators.minLength(10), Validators.maxLength(255)]
      ]
    });

    this.previewUrl = this.originalImageUrl;
  }

  /**  
   * true si nombre, descripción o fichero difieren del original  
   * (ambos campos comparados con trim() para ignorar espacios)  
   */
  get hasChanges(): boolean {
    const nombreActual = (this.editForm.get('nombre')?.value || '').trim();
    const descActual   = (this.editForm.get('descripcion')?.value || '').trim();

    const nameChanged  = nombreActual !== this.originalName;
    const descChanged  = descActual   !== this.originalDesc;
    const fileChanged  = this.selectedFile != null;

    return nameChanged || descChanged || fileChanged;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      this.errorMessage = 'Formato de archivo no válido';
      return;
    }
    if (file.size > maxSize) {
      this.errorMessage = 'El archivo no puede superar 2MB';
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
    this.previewUrl = this.originalImageUrl;
    this.errorMessage = null;
  }

  saveChanges(): void {
    if (!this.hasChanges) {
      this.errorMessage = 'No hay cambios que guardar';
      return;
    }

    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) {
      this.errorMessage = 'Complete los campos requeridos';
      return;
    }

    const nombreFinal = (this.editForm.get('nombre')?.value || '').trim();
    const descFinal   = (this.editForm.get('descripcion')?.value || '').trim();

    // Si hay fichero nuevo, el backend gestionará la subida y la URL;
    // si no, mantenemos la URL original
    const finalImageUrl = this.selectedFile ? undefined : this.originalImageUrl;

    const categoriaActualizada: Categoria & { imageFile?: File } = {
      ...this.data.categoria,
      nombre: nombreFinal,
      descripcion: descFinal,
      imgUrl: finalImageUrl!,
      ...(this.selectedFile && { imageFile: this.selectedFile })
    };

    this.dialogRef.close(categoriaActualizada);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getError(controlName: string): string | null {
    const control = this.editForm.get(controlName);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('required'))  return 'Este campo es requerido';
    if (control.hasError('minlength')) return `Mínimo ${control.errors!['minlength'].requiredLength} caracteres`;
    if (control.hasError('maxlength')) return `Máximo ${control.errors!['maxlength'].requiredLength} caracteres`;
    return null;
  }
}
