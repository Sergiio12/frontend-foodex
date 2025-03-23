import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { catchError, finalize, lastValueFrom } from 'rxjs';

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
  notification: { type: 'success' | 'error'; message: string } | null = null;
  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;

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

      localStorage.setItem('access_token', response.accessToken);
      this.showNotification('success', '¡Bienvenido! Redirigiendo...');
      await this.delay(1500);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.showNotification('error', error.message || 'Error inesperado. Por favor intenta nuevamente.');
    } finally {
      this.loading = false;
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ngOnDestroy(): void {
    this.clearNotification();
  }
}