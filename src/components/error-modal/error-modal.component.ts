import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [],
  templateUrl: './error-modal.component.html',
  styleUrl: './error-modal.component.css'
})
export class ErrorModalComponent {
  @Input() errorMessage: string = '';
  @Input() title: string = '¡Ups! Algo salió mal';
  @Output() retry = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onRetry() {
    this.retry.emit();
  }

  onClose() {
    this.close.emit();
  }
}