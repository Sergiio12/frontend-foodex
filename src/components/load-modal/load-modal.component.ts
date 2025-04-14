import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-modal',
  templateUrl: './load-modal.component.html',
  styleUrls: ['./load-modal.component.css']
})
export class LoadingModalComponent {
  @Input() message: string = 'Cargando...';
}
