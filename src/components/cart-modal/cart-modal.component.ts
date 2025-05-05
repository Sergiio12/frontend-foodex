import { Component, EventEmitter, Output, HostListener, OnInit, OnDestroy, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { ProductosService } from '../../services/productos.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil, catchError, throwError, filter, map, distinctUntilChanged, take, shareReplay, finalize, tap, combineLatest } from 'rxjs';
import { ItemCarrito } from '../../model/ItemCarrito';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { isEqual } from 'lodash';
import { ApiResponseBody } from '../../model/ApiResponseBody';
import { CarritoResponse } from '../../payloads/CarritoResponse';

@Component({
  selector: 'app-cart-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './cart-modal.component.html',
  styleUrls: ['./cart-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartModalComponent implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();

  defaultImage = 'assets/default-product.png';
  combinedData$!: Observable<{
    cart: ApiResponseBody<CarritoResponse> | null;
    loading: boolean;
  }>;

  private destroy$ = new Subject<void>();

  constructor(
    public cartService: CartService,
    private productosService: ProductosService,
    private router: Router,
    public dialogRef: MatDialogRef<CartModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initializeCart();
    this.initializeCombinedData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateQuantity(productId: number, newQuantity: number): void {
    if (newQuantity < 0 || newQuantity === this.getCurrentQuantity(productId)) return;

    this.cartService.setLoading(true);
    
    this.cartService.modifyItem(productId, newQuantity).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.cartService.setLoading(false))
    ).subscribe();
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
    this.cartService.removeItem(productId).pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  trackByProductId(index: number, item: ItemCarrito): number {
    return item.producto.id + item.cantidad;
  }

  close(): void {
    this.dialogRef.close();
  }

  navigateToCheckout(): void {
    this.close();
    this.cartService.cart$.pipe(
      take(1),
      filter(res => !!res?.data),
      map(res => res!.data)
    ).subscribe(cartData => {
      this.router.navigate(['/checkout'], {
        state: { 
          cart: cartData,
          total: this.cartService.currentTotal 
        }
      });
    });
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

  private initializeCombinedData(): void {
    this.combinedData$ = combineLatest({
      cart: this.cartService.cart$.pipe(
        distinctUntilChanged((prev, curr) => isEqual(prev?.data.itemsCarrito, curr?.data.itemsCarrito))
      ),
      loading: this.cartService.isLoading$.pipe(
        distinctUntilChanged()
      )
    }).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private initializeCart(): void {
    this.cartService.getCart().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error inicializando carrito:', error);
        return throwError(() => new Error('No se pudo cargar el carrito.'));
      })
    ).subscribe();
  }

  private getCurrentQuantity(productId: number): number {
    const currentCart = this.cartService.cartSubject.value?.data?.itemsCarrito;
    return currentCart?.find(i => i.producto.id === productId)?.cantidad || 0;
  }
}