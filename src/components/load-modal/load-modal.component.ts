import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-loading-modal',
  templateUrl: './load-modal.component.html',
  styleUrls: ['./load-modal.component.css']
})
export class LoadingModalComponent implements OnInit, OnDestroy {
  private scrollY = 0;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.scrollY = window.scrollY || window.pageYOffset;
    this.renderer.setStyle(document.body, 'position', 'fixed');
    this.renderer.setStyle(document.body, 'top', `-${this.scrollY}px`);
    this.renderer.setStyle(document.body, 'left', '0');
    this.renderer.setStyle(document.body, 'right', '0');
    this.renderer.setStyle(document.body, 'width', '100%');
  }

  ngOnDestroy(): void {
    this.renderer.removeStyle(document.body, 'position');
    this.renderer.removeStyle(document.body, 'top');
    this.renderer.removeStyle(document.body, 'left');
    this.renderer.removeStyle(document.body, 'right');
    this.renderer.removeStyle(document.body, 'width');
    window.scrollTo(0, this.scrollY);
  }
}
