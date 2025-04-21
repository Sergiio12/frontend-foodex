import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [],
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.css']
})
export class ErrorModalComponent implements OnInit, OnDestroy {
  @Input() errorMessage: string = '';
  @Input() title: string = '¡Ups! Algo salió mal';
  @Output() retry = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  ngOnInit(): void {
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }

  ngOnDestroy(): void {
    document.body.style.position = '';
    document.body.style.width = '';
  }

  onRetry() {
    this.retry.emit();
  }

  onClose() {
    this.close.emit();
  }
}
