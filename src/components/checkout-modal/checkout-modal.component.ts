import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompraRequestDTO } from '../../model/CompraRequestDTO';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout-modal.component.html',
  styleUrls: ['./checkout-modal.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CheckoutModalComponent {
  @Input() total: number | null = 0;
  @Output() confirmarCompra = new EventEmitter<CompraRequestDTO>();
  @Output() cerrar = new EventEmitter<void>();

  checkoutForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.checkoutForm = this.fb.group({
      direccion: this.fb.group({
        calle: ['', Validators.required],
        codPostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        bloque: ['', Validators.required],
        portal: ['', Validators.required],
        ciudad: ['', Validators.required],
        pais: ['', Validators.required]
      }),
      datosContacto: this.fb.group({
        telefono: ['', [Validators.required, Validators.pattern(/^[+]?[0-9]{9,12}$/)]],
        email: ['', [Validators.required, Validators.email]]
      }),
      comentario: ['']
    });
  }

  /**
   * Getter para acceder fácilmente al grupo de dirección
   */
  get direccion(): FormGroup {
    return this.checkoutForm.get('direccion') as FormGroup;
  }

  /**
   * Getter para acceder fácilmente al grupo de datos de contacto
   */
  get datosContacto(): FormGroup {
    return this.checkoutForm.get('datosContacto') as FormGroup;
  }

  /**
   * Envía los datos al padre si el formulario es válido y resetea el formulario
   */
  onSubmit(): void {
    if (this.checkoutForm.valid) {
      const compra: CompraRequestDTO = this.checkoutForm.value;
      this.confirmarCompra.emit(compra);
      this.checkoutForm.reset();
    }
  }

  /**
   * Emite el evento de cerrar modal
   */
  cerrarModal(): void {
    this.cerrar.emit();
    this.checkoutForm.reset();
  }
}
