import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { catchError, finalize, throwError, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FaIconComponent,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  notification: { type: 'success' | 'error', message: string } | null = null;
  private notificationTimeout: any;

  // Iconos
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
      password: ['', [
        Validators.required,
      ]],
    });
  }

  // Getters para acceder fácilmente a los controles
  get username() {
    return this.loginForm.get('username')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }
  
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markAllAsTouched();
      this.showNotification('error', 'Por favor completa todos los campos requeridos');
      return;
    }

    this.loading = true;
    this.clearNotification();

    try {
      const response = await lastValueFrom(
        this.authService.authenticate(this.loginForm.value).pipe(
          catchError(error => {
            this.handleAuthenticationError(error);
            return throwError(() => error);
          }),
          finalize(() => this.loading = false)
        )
      );

      this.showNotification('success', '¡Bienvenido! Redirigiendo...');
      setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      
    } catch (error: any) {
      const errorMessage = error.error?.message || 
                          error.message || 
                          'Error desconocido. Por favor intenta nuevamente.';
      this.showNotification('error', errorMessage);
    }
  }

  private markAllAsTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  private showNotification(type: 'success' | 'error', message: string): void {
    this.clearNotification();
    this.notification = { type, message };
    this.notificationTimeout = setTimeout(() => {
      this.notification = null;
    }, 4000);
  }

  clearNotification(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
    this.notification = null;
  }

  private handleAuthenticationError(error: any): void {
    let errorMessage = 'Error de autenticación';
    
    if (error.status === 401) {
      errorMessage = 'Usuario o contraseña incorrectos';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifica tu internet';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    throw throwError(() => ({
      message: errorMessage,
      error: error
    }));
  }

  ngOnDestroy(): void {
    this.clearNotification();
  }
}