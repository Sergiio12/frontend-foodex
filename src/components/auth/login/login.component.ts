import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { AlertController } from '@ionic/angular';
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
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  errorMessage: string | null = null;

  // Iconos
  faSpinner = faSpinner;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
    });
  }

  // Validación personalizada de contraseña
  private passwordStrengthValidator(control: AbstractControl) {
    const value = control.value;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    
    return !(hasUpperCase && hasLowerCase && hasNumber) 
      ? { passwordStrength: true } 
      : null;
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

  // Método para mostrar los mensajes de error en tiempo real
  get usernameErrorMessage(): string {
    if (this.username.hasError('required')) {
      return 'El nombre de usuario es requerido';
    } else if (this.username.hasError('minlength')) {
      return 'El nombre de usuario debe tener al menos 4 caracteres';
    }
    return '';
  }

  get passwordErrorMessage(): string {
    if (this.password.hasError('required')) {
      return 'La contraseña es requerida';
    } else if (this.password.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres';
    } else if (this.password.hasError('passwordStrength')) {
      return 'La contraseña debe contener mayúsculas, minúsculas y números';
    }
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.loading = true;

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

      await this.showAlert('success', '¡Autenticación exitosa!');
      this.router.navigate(['/dashboard']);
      
    } catch (error) {
      await this.showAlert('error', this.errorMessage || 'Error desconocido');
    }
  }

  private markAllAsTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  private async showAlert(type: 'success' | 'error', message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: type === 'success' ? '¡Éxito!' : 'Error',
      message,
      buttons: ['OK'],
      cssClass: `custom-alert ${type}-alert`,
      translucent: true,
    });
    
    await alert.present();
  }

  private handleAuthenticationError(error: any): void {
    const errorMessage = typeof error === 'object' ? error.message : error;
    this.errorMessage = errorMessage || 'Error de conexión. Verifica tu internet e intenta nuevamente.';
    throw error;
  }
}
