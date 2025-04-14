import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-load-modal',
  imports: [],
  templateUrl: './load-modal.component.html',
  styleUrl: './load-modal.component.css'
})
export class LoadModalComponent {
  @Input() message : string = 'Cargando...';
}
