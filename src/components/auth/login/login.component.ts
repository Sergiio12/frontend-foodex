import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FaIconComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  encapsulation: ViewEncapsulation.None, // Desactiva la encapsulación para facilitar el estilo global
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
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
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  // Getters para acceder a los controles
  get username() {
    return this.loginForm.get('username')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      //this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      return;
    }

    this.loading = true;
    const loginData = this.loginForm.value;

    this.authService.authenticate(loginData).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data?.token) {
          localStorage.setItem('token', response.data.token);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'Error en la autenticación.';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en login', error);
        this.errorMessage = error.error?.message || 'Error de conexión con el servidor.';
        this.loading = false;
      },
    });
  }
}
