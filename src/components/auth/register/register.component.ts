import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { SignupRequest } from '../../../model/SignupRequest';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FaIconComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string | null = '';
  submitted = false;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  fieldErrors: { [key: string]: string } = {}; // Almacena errores específicos por campo

  faSpinner = faSpinner;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.mustMatch('password', 'confirmPassword') }
    );
  }

  // Getters para acceder a los controles del formulario
  get username() { return this.registerForm.get('username')!; }
  get email() { return this.registerForm.get('email')!; }
  get password() { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }

  // Alternar visibilidad de la contraseña
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Alternar visibilidad de la confirmación de contraseña
  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Cerrar el mensaje de error
  closeErrorMessage(): void {
    this.errorMessage = '';
    this.fieldErrors = {}; // Limpiar errores específicos al cerrar el mensaje
  }

  // Validador personalizado para confirmar que las contraseñas coincidan
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: AbstractControl) => {
      const control = formGroup.get(controlName);
      const matchingControl = formGroup.get(matchingControlName);

      if (!control || !matchingControl) return;

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }

      matchingControl.setErrors(control.value !== matchingControl.value ? { mustMatch: true } : null);
    };
  }

  hasError(field: string): boolean {
  return !!this.fieldErrors[field] || (this.submitted && (this.registerForm.get(field)?.invalid ?? false));
}

  // Obtener el mensaje de error para un campo específico
  getErrorMessage(field: string): string {
    if (this.fieldErrors[field]) {
      return this.fieldErrors[field]; // Devuelve el mensaje de error específico del campo
    }

    const control = this.registerForm.get(field);
    if (control?.errors?.['required']) {
      return 'Este campo es obligatorio.';
    } else if (control?.errors?.['email']) {
      return 'Debe ingresar un correo electrónico válido.';
    } else if (control?.errors?.['minlength']) {
      return `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    } else if (control?.errors?.['mustMatch']) {
      return 'Las contraseñas no coinciden.';
    }

    return '';
  }

  // Método que se ejecuta al enviar el formulario
  onSubmit(): void {
    this.submitted = true;

    // Verificar si el formulario es inválido
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.fieldErrors = {}; // Limpiar errores anteriores

    const registerData: SignupRequest = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.loading = false;

        // Si el registro es exitoso, redirige al usuario
        if (response.status === 'success') {
          this.router.navigate(['/login']);
        } else {
          // Si hay un mensaje de error general, lo mostramos
          this.errorMessage = response.message || 'Error en el registro. Contacta con un administrador.';
        }
      },
      error: (error) => {
        this.loading = false;

        // Si hay errores de validación específicos, los procesamos
        if (error.error?.errors) {
          error.error.errors.forEach((err: { field: string; message: string }) => {
            this.fieldErrors[err.field] = err.message; // Almacena el error por campo
          });
        }

        // Si hay un mensaje de error general, lo mostramos
        this.errorMessage = error.error?.message || 'Error de conexión con el servidor. Inténtalo más tarde o contacta con un administrador.';
      },
    });
  }
}