import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompraService } from '../../services/compras.service';
import { CompraDTO } from '../../model/CompraDTO';

@Component({
  selector: 'app-administracion',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './administracion.component.html',
  styleUrl: './administracion.component.css'
})
export class AdministracionComponent implements OnInit {
  compras: CompraDTO[] = [];
  errorMessage: string = '';

  constructor(private compraService: CompraService) {}

  ngOnInit(): void {
    this.cargarCompras();
  }

  private cargarCompras(): void {
    this.compraService.getAllCompras().subscribe({
      next: (data: CompraDTO[]) => {
        this.compras = data.sort((a, b) => 
          new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
        );
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar el historial de compras';
        console.error('Error:', err);
      }
    });
  }

}