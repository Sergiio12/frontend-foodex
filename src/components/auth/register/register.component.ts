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

  get username() { return this.registerForm.get('username')!; }
  get email() { return this.registerForm.get('email')!; }
  get password() { return this.registerForm.get('password')!; }
  get confirmPassword() { return this.registerForm.get('confirmPassword')!; }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  closeErrorMessage() {
    this.errorMessage = '';
  }

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

  onSubmit(): void {
    this.submitted = true;
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = null;

    const registerData: SignupRequest = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success') {
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = response.message || 'Error en el registro. Contacta con un administrador.';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error de conexión con el servidor. Inténtalo más tarde o contacta con un administrador.';
      },
    });
  }
}
