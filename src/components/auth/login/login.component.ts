import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FaIconComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnDestroy {
  faSpinner = faSpinner;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  notification: { type: 'success' | 'error'; message: string } | null = null;

  private readonly TOKEN_KEY = 'authToken';
  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required]],
    });
  }

  get username() {
    return this.loginForm.get('username')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  clearNotification(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
    this.notification = null;
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.clearNotification();

    try {
      const response = await lastValueFrom(
        this.authService.authenticate(this.loginForm.value)
      );
      
      localStorage.setItem(this.TOKEN_KEY, response.data.token);
      
      this.showNotification('success', 'Inicio de sesión exitoso. Redirigiendo...');
      await this.delay(1500);
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.showNotification(
        'error',
        error.message || 'Error inesperado. Por favor intenta nuevamente.'
      );
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.clearNotification();
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}