import { Component, HostListener, OnInit, OnDestroy, Inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CartModalComponent } from '../cart-modal/cart-modal.component'; 
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiResponseBody } from '../../model/ApiResponseBody';
import { CarritoResponse } from '../../payloads/CarritoResponse';
import { ItemCarrito } from '../../model/ItemCarrito';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [
    trigger('menuAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  username: string | null = null;
  isUserMenuOpen = false;
  isMobile = false;
  cartItems = 0;

  private subscriptions = new Subscription();

  constructor(
    public authService: AuthService,
    private cartService: CartService,
    private router: Router,
    @Inject(MatDialog) private dialog: MatDialog 
  ) {}

  ngOnInit(): void {
    this.checkViewport();
    this.setupAuthListener();
    this.setupCartListener();
    this.loadInitialCart();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkViewport();
    if (this.isMobile && this.isUserMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-container') && 
        !target.closest('.cart-container') &&
        !target.closest('.user-menu')) {
      this.isUserMenuOpen = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  closeModal(): void {
    const dialogRef = this.dialog.open(CartModalComponent);
    dialogRef.close();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  openCart(): void {
    if (this.isLoggedIn) {
      this.openCartModal(); 
    } else {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/cart' } 
      });
    }
  }

  logout(): void {
    this.subscriptions.add(
      this.cartService.clearCart().subscribe({
        complete: () => this.performLogout(),
        error: () => this.performLogout()
      })
    );
  }

  navigateToCatalogo(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/catalogo']);
    } else {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/catalogo' } 
      });
    }
  }

  navigateToAdministracion(): void {
    this.router.navigate(['/administracion']);
  }

  hasAdminRole(): boolean {
    return this.authService.hasRole('ROLE_ADMIN');
  }
  
  private checkViewport(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  private setupAuthListener(): void {
    this.subscriptions.add(
      this.authService.getAuthStatus().subscribe({
        next: (status) => this.handleAuthUpdate(status),
        error: (err) => this.handleAuthError(err)
      })
    );
  }

  private setupCartListener(): void {
    this.subscriptions.add(
      this.cartService.cart$.subscribe({
        next: (response: ApiResponseBody<CarritoResponse> | null) => {
          this.cartItems = response?.data?.itemsCarrito?.reduce(
            (total: number, item: ItemCarrito) => total + item.cantidad, 0
          ) || 0;
        },
        error: (err) => this.handleCartError(err)
      })
    );
  }

  private loadInitialCart(): void {
    if (this.authService.getToken()) {
      this.subscriptions.add(
        this.cartService.getCart().subscribe({
          error: (err) => this.handleCartError(err)
        })
      );
    }
  }

  private handleAuthUpdate(status: boolean): void {
    this.isLoggedIn = status;
    if (status) {
      this.username = this.authService.getUsername();
      this.loadCartData();
    } else {
      this.clearSession();
    }
  }

  private loadCartData(): void {
    this.subscriptions.add(
      this.cartService.getCart().subscribe({
        next: (response: ApiResponseBody<CarritoResponse>) => {
          if (response.data?.itemsCarrito) {
            this.cartItems = response.data.itemsCarrito.reduce(
              (total: number, item: ItemCarrito) => total + item.cantidad, 0
            );
          }
        },
        error: (err) => this.handleCartError(err)
      })
    );
  }

  private clearSession(): void {
    this.username = null;
    this.cartItems = 0;
    this.isUserMenuOpen = false;
  }

  private handleAuthError(error: any): void {
    console.error('Error de autenticación:', error);
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private handleCartError(error: any): void {
    console.error('Error del carrito:', error);
    if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
    this.cartItems = 0;
  }

  private openCartModal(): void {
    const dialogRef = this.dialog.open(CartModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'cart-modal-container',
      autoFocus: false
    });
  
    dialogRef.afterClosed().subscribe(result => {
      console.log('El modal se cerró con resultado:', result);
    });
  }

  private performLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
