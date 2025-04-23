import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkViewport();
    this.setupAuthListener();
    this.setupCartListener();
    this.loadInitialCart();
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
      this.cartService.getCartItemsCount().subscribe({
        next: (count) => this.cartItems = count,
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

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  openCart(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/cart']);
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

  private performLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
}
