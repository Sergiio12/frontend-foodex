import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoriasService } from '../../services/categorias.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Categoria } from '../../model/Categoria';
import { switchMap } from 'rxjs';
import { ImagenOrigen } from '../../model/ImagenOrigen';

@Component({
  selector: 'app-create-categoria-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './create-categoria-modal.component.html',
  styleUrls: ['./create-categoria-modal.component.css']
})
export class CreateCategoriaModalComponent implements OnInit {
  categoriaForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  errorMessage: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private categoriasService: CategoriasService,
    public dialogRef: MatDialogRef<CreateCategoriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]]
    });
  }

  ngOnInit(): void {}

  getError(controlName: string): string | null {
    const control = this.categoriaForm.get(controlName);
    
    if (!control?.touched || !control.errors) return null;

    if (control.hasError('required')) return 'Campo obligatorio';
    if (control.hasError('minlength')) 
      return `Mín. ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.hasError('maxlength')) 
      return `Máx. ${control.errors['maxlength'].requiredLength} caracteres`;

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
    if (this.categoriaForm.invalid || !this.selectedFile) {
        this.categoriaForm.markAllAsTouched();
        this.errorMessage = !this.selectedFile 
            ? 'Debe seleccionar una imagen' 
            : 'Complete todos los campos requeridos';
        return;
    }

    this.isSubmitting = true;
    const formValue = this.categoriaForm.value;

    const nuevaCategoria: Categoria = {
        nombre: formValue.nombre.trim(),
        descripcion: formValue.descripcion.trim(),
        imgOrigen: ImagenOrigen.UPLOAD 
    };

    this.categoriasService.createCategoria(nuevaCategoria).pipe(
        switchMap((categoriaCreada) => {
            // Verificar que categoriaCreada tiene un id válido
            if (!categoriaCreada.id) {
                throw new Error('La categoría creada no tiene un ID válido');
            }
            return this.categoriasService.uploadImage(categoriaCreada.id, this.selectedFile!);
        })
    ).subscribe({
        next: (categoriaFinal) => {
            this.dialogRef.close(categoriaFinal);
        },
        error: (err) => {
            this.isSubmitting = false;
            this.errorMessage = this.getErrorMessage(err);
            console.error('Error al crear categoría:', err);
        }
    }); 
  }

  private getErrorMessage(err: any): string {
    if (err.status === 400) return 'Datos inválidos';
    if (err.status === 413) return 'Imagen demasiado grande';
    if (err.status === 415) return 'Formato de imagen no soportado';
    return 'Error al crear la categoría';
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}