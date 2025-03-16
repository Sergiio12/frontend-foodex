import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { SignupRequest } from '../../../model/SignupRequest'; // Importa el modelo SignupRequest

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

  // Iconos de FontAwesome
  faSpinner = faSpinner;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    });
  }

  // Getters para acceder a los controles
  get username() {
    return this.registerForm.get('username')!;
  }

  get email() {
    return this.registerForm.get('email')!;
  }

  get password() {
    return this.registerForm.get('password')!;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  closeErrorMessage() {
    this.errorMessage = ''; // Esto ocultará el mensaje de error
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;

    // Verifica si el formulario es inválido
    if (this.registerForm.invalid) {
      return; // Detiene el envío si el formulario es inválido
    }

    this.loading = true; // Activa el estado de "cargando"

    // Obtiene los datos del formulario y los mapea al modelo SignupRequest
    const registerData: SignupRequest = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    };

    // Llama al servicio de autenticación para registrar al usuario
    this.authService.register(registerData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          // Redirige al usuario a la página de login después del registro
          this.router.navigate(['/login']);
        } else {
          // Muestra un mensaje de error si el registro falla
          this.errorMessage = response.message || 'Error en el registro. Contacta con un administrador.';
        }
        this.loading = false; // Desactiva el estado de "cargando"
      },
      error: (error) => {
        // Muestra un mensaje de error si hay un problema de conexión
        this.errorMessage = error.error?.message || 'Error de conexión con el servidor. Inténtalo más tarde o contacta con un administrador.';
        this.loading = false; // Desactiva el estado de "cargando"
      },
    });
  }
}