import { Component, EventEmitter, Output, HostListener, OnInit, OnDestroy, Inject, ChangeDetectionStrategy } from '@angular/core';
import { ProductosService } from '../../services/productos.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil, catchError, throwError, filter, map, distinctUntilChanged, take, shareReplay, tap, combineLatest } from 'rxjs';
import { ItemCarrito } from '../../model/ItemCarrito';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ApiResponseBody } from '../../model/ApiResponseBody';
import { CarritoResponse } from '../../payloads/CarritoResponse';
import { CartService } from '../../services/cart.service';
import { CompraService } from '../../services/compras.service';
import { CheckoutModalComponent } from '../checkout-modal/checkout-modal.component';
import { CompraRequestDTO } from '../../model/CompraRequestDTO';

@Component({
  selector: 'app-cart-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, CheckoutModalComponent],
  templateUrl: './cart-modal.component.html',
  styleUrls: ['./cart-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartModalComponent implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();

  showCheckout = false;
  checkoutLoading = false;
  checkoutError: string | null = null;

  defaultImage = 'assets/default-product.png';
  cart$!: Observable<ApiResponseBody<CarritoResponse> | null>;

  private destroy$ = new Subject<void>();

  constructor(
    public cartService: CartService,
    public compraService: CompraService,
    private productosService: ProductosService,
    private router: Router,
    public dialogRef: MatDialogRef<CartModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initializeCart();
    this.cart$ = this.cartService.cart$;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  iniciarCheckout(): void {
    this.showCheckout = true;
  }

  updateQuantity(productId: number, newQuantity: number): void {
    if (newQuantity < 0 || newQuantity === this.getCurrentQuantity(productId)) return;

    this.cartService.modifyItem(productId, newQuantity)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  getProductImage(item: ItemCarrito): string {
    if (!item?.producto?.imgUrl) return this.defaultImage;
    try {
      return this.productosService.buildImageUrl(
        item.producto.imgUrl,
        item.producto.imgOrigen
      );
    } catch (error) {
      console.error('Error generando URL de imagen:', error);
      return this.defaultImage;
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes(this.defaultImage)) {
      img.src = this.defaultImage;
      img.classList.add('error-image');
    }
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error eliminando ítem:', error);
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  trackByProductId(index: number, item: ItemCarrito): number {
    return item.producto.id!;
  }

  close(): void {
    this.dialogRef.close();
  }

  navigateToCheckout(): void {
    this.close();
    this.cartService.cart$
      .pipe(
        take(1),
        filter(res => !!res?.data),
        map(res => res!.data)
      )
      .subscribe(cartData => {
        this.router.navigate(['/checkout'], {
          state: {
            cart: cartData,
            total: this.cartService.currentTotal
          }
        });
      });
  }

  finalizarCompra(datos: CompraRequestDTO): void {
    this.checkoutLoading = true;
    this.checkoutError = null;

    this.compraService.realizarCompra(datos).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.showCheckout = false;
        this.close();
      },
      error: (err) => {
        this.checkoutError = err.message;
        this.checkoutLoading = false;
      },
      complete: () => this.checkoutLoading = false
    });
  }

  cerrarCheckout(): void {
    this.showCheckout = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.close();
  }

  onBackgroundClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cart-modal-overlay')) {
      this.close();
    }
  }

  private initializeCart(): void {
    this.cartService.getCart()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error inicializando carrito:', error);
          return throwError(() => new Error('No se pudo cargar el carrito.'));
        })
      )
      .subscribe();
  }

  private getCurrentQuantity(productId: number): number {
    const currentCart = this.cartService['cartSubject'].value?.data?.itemsCarrito;
    return currentCart?.find(i => i.producto.id === productId)?.cantidad || 0;
  }
}
