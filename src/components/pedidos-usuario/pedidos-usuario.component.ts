import { Component, OnInit } from '@angular/core';
import { CompraService } from '../../services/compras.service';
import { AuthService } from '../../services/auth.service';
import { CompraDTO } from '../../model/CompraDTO';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pedidos-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pedidos-usuario.component.html',
  styleUrls: ['./pedidos-usuario.component.css']
})
export class PedidosUsuarioComponent implements OnInit {
  compras: CompraDTO[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private compraService: CompraService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  getStatusClass(estado: string): string {
    switch(estado?.toUpperCase()) {
      case 'PAGADA': return 'status-completed';
      case 'PENDIENTE': return 'status-pending';
      case 'CANCELADA': return 'status-cancelled';
      default: return 'status-unknown';
    }
}

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private cargarPedidos(): void {
    const token = this.authService.getToken();
    
    if (!token) {
      this.errorMessage = 'No hay token de autenticación';
      this.isLoading = false;
      return;
    }

    if (!this.authService.isValidToken(token)) {
      this.errorMessage = 'Token inválido o expirado';
      this.isLoading = false;
      return;
    }

    const username = this.extraerUsernameDelToken(token);
    
    if (!username) {
      this.errorMessage = 'No se pudo obtener el usuario';
      this.isLoading = false;
      return;
    }

    this.compraService.getComprasByUsuario(username).subscribe({
      next: (compras) => {
        this.compras = compras;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cargar los pedidos';
        this.isLoading = false;
      },
      complete: () => this.isLoading = false
    });
  }

  private extraerUsernameDelToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Ajusta según la estructura real de tu token
      return payload.username || payload.sub || null;
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  }

}