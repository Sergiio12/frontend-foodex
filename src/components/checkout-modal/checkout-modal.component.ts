import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompraRequestDTO } from '../../model/CompraRequestDTO';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout-modal.component.html',
  styleUrls: ['./checkout-modal.component.css']
})
export class CheckoutModalComponent {
  @Input() total: number | null = 0;
  @Output() confirmarCompra = new EventEmitter<CompraRequestDTO>();
  @Output() cerrar = new EventEmitter<void>();

  checkoutForm!: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.checkoutForm = this.fb.group({
      direccion: this.fb.group({
        calle: ['', [Validators.required, Validators.maxLength(50)]],
        codPostal: ['', [  
          Validators.required,
          Validators.pattern(/^\d{5}$/),
          Validators.maxLength(10)
        ]],
        bloque: ['', [Validators.required, Validators.maxLength(5)]],
        portal: ['', [Validators.required, Validators.maxLength(5)]],
        provincia: ['', [Validators.maxLength(25)]] 
      }),
      datosContacto: this.fb.group({
        telefono: ['', [  
          Validators.required,
          Validators.pattern(/^[+]?[0-9]{9,12}$/),
          Validators.maxLength(15)
        ]],
        email: ['', [Validators.email, Validators.maxLength(50)]]
      }),
      comentario: ['', [Validators.maxLength(250)]]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.checkoutForm.valid) {
      const compraData: CompraRequestDTO = {
        comentario: this.checkoutForm.value.comentario,
        direccion: {
          calle: this.direccion.value.calle,
          codPostal: this.direccion.value.codPostal,
          bloque: this.direccion.value.bloque,
          portal: this.direccion.value.portal,
          provincia: this.direccion.value.provincia 
        },
        datosContacto: {
          telefono: this.datosContacto.value.telefono,
          email: this.datosContacto.value.email
        }
      };
      
      this.confirmarCompra.emit(compraData);
      this.cerrarModal();
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
    this.checkoutForm.reset();
  }

  // Helper para mostrar errores de validación
  getValidationMessage(control: any): string {
    if (control?.errors?.required) {
      return 'Campo requerido';
    }
    if (control?.errors?.pattern) {
      return 'Formato inválido';
    }
    if (control?.errors?.maxlength) {
      return `Máximo ${control.errors?.maxlength.requiredLength} caracteres`;
    }
    if (control?.errors?.email) {
      return 'Email inválido';
    }
    return '';
  }

  // Getters para acceder a los controles del formulario
  get direccion() { return this.checkoutForm.get('direccion') as FormGroup; }
  get datosContacto() { return this.checkoutForm.get('datosContacto') as FormGroup; }
  
  get calle() { return this.direccion.get('calle'); }
  get codPostal() { return this.direccion.get('codPostal'); }
  get bloque() { return this.direccion.get('bloque'); }
  get portal() { return this.direccion.get('portal'); }
  get provincia() { return this.direccion.get('provincia'); }

  get telefono() { return this.datosContacto.get('telefono'); }
  get email() { return this.datosContacto.get('email'); }

  get comentario() { return this.checkoutForm.get('comentario'); }

  private resetForm(): void {
    this.submitted = false;
    
    this.checkoutForm.reset({ 
      direccion: {
        provincia: null 
      },
      datosContacto: {
        email: null
      }
    });

    Object.keys(this.checkoutForm.controls).forEach(groupName => {
      const group = this.checkoutForm.get(groupName) as FormGroup;
      
      Object.keys(group.controls).forEach(controlName => {
        const control = group.get(controlName);
        control?.setErrors(null);
        control?.markAsPristine();
        control?.markAsUntouched();
      });
    });

    this.checkoutForm.updateValueAndValidity();
  }

}