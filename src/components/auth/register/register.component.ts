import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { lastValueFrom } from 'rxjs';
import { SignupRequest } from '../../../payloads/SignupRequest';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FaIconComponent,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnDestroy {
  faSpinner = faSpinner;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  registerForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  notification: { type: 'success' | 'error'; message: string } | null = null;

  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Actualizar el formulario con los campos necesarios para SignupRequest
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(4)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        name: ['', [Validators.required]], 
        firstname: ['', [Validators.required]],
        lastname: ['', [Validators.required]], 
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  get name() { return this.registerForm.get('name')!; }
  get username() { return this.registerForm.get('username')!; }
  get firstname() { return this.registerForm.get('firstname')!; }
  get lastname() { return this.registerForm.get('lastname')!; }
  get password() { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }
  get email() { return this.registerForm.get('email')!; }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  clearNotification(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
    this.notification = null;
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.clearNotification();

    try {
      const signupData: SignupRequest = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        name: this.registerForm.value.name,
        firstname: this.registerForm.value.firstname,
        lastname: this.registerForm.value.lastname
      };

      const response = await lastValueFrom(
        this.authService.register(signupData)
      );

      this.showNotification('success', '¡Registro exitoso! Redirigiendo...');
      await this.delay(1500);
      this.router.navigate(['/login']);
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

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  private markAllAsTouched(): void {
    Object.values(this.registerForm.controls).forEach((control) => {
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}