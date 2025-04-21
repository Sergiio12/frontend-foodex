import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Categoria } from '../../model/Categoria';
import { ReactiveFormsModule } from '@angular/forms';

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

  constructor(
    public dialogRef: MatDialogRef<EditCategoriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria: Categoria },
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      nombre: [
        data.categoria.nombre, 
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)]
      ],
      descripcion: [
        data.categoria.descripcion, 
        [Validators.required, Validators.minLength(10), Validators.maxLength(255)]
      ],
      imagenUrl: [data.categoria.imgUrl]
    }, { validators: this.imageValidator() });

    this.previewUrl = data.categoria.imgUrl;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
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
      this.editForm.patchValue({ imagenUrl: '' });
      this.errorMessage = null;
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.selectedFile = null;
    this.previewUrl = this.data.categoria.imgUrl;
    this.editForm.patchValue({ imagenUrl: this.data.categoria.imgUrl });
    this.errorMessage = null;
  }

  saveChanges(): void {
    this.editForm.markAllAsTouched();
  
    if (!this.selectedFile && !this.editForm.value.imagenUrl) {
      this.errorMessage = 'Debe proporcionar una imagen o URL';
      return;
    }
  
    if (this.editForm.invalid) {
      this.errorMessage = 'Complete los campos requeridos';
      return;
    }
  
    const categoriaActualizada = {
      ...this.data.categoria,
      ...this.editForm.value,
      imageFile: this.selectedFile 
    };
  
    this.dialogRef.close(categoriaActualizada);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getError(controlName: string): string | null {
    const control = this.editForm.get(controlName);
    
    if (!control?.errors || !control.touched) return null;

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    
    if (control.hasError('maxlength')) {
      return `Máximo ${control.errors?.['maxlength'].requiredLength} caracteres`;
    }
    
    return null;
  }

  private imageValidator() {
    return (control: FormGroup) => {
      const file = this.selectedFile;
      const url = control.get('imagenUrl')?.value;

      if (!file && !url) {
        control.get('imagenUrl')?.setErrors({ required: true });
        return { required: true };
      }
      return null;
    };
  }

}
