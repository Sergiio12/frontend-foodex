import { Component, EventEmitter, Output, HostListener, OnInit, OnDestroy, Inject } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { ProductosService } from '../../services/productos.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil, catchError, throwError, filter, map, distinctUntilChanged, take } from 'rxjs';
import { ItemCarrito } from '../../model/ItemCarrito';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-cart-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './cart-modal.component.html',
  styleUrls: ['./cart-modal.component.css']
})
export class CartModalComponent implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();
  defaultImage = 'assets/default-product.png';
  private destroy$ = new Subject<void>();

  // Observables
  cartItems$!: Observable<ItemCarrito[]>;
  totalPrice$!: Observable<number>;
  uniqueItemsCount$!: Observable<number>;

  constructor(
    public cartService: CartService,
    private productosService: ProductosService,
    private router: Router,
    public dialogRef: MatDialogRef<CartModalComponent>, // Correcto aquí
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initializeCart();
    this.setupCartObservables();
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

  private setupCartObservables(): void {
    this.totalPrice$ = this.cartService.totalPrice$;
    this.uniqueItemsCount$ = this.cartService.uniqueItemsCount$;
    
    this.cartItems$ = this.cartService.cart$.pipe(
      filter(response => !!response?.data?.itemsCarrito),
      map(response => response!.data.itemsCarrito),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(curr)
      )
    );
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

  updateQuantity(productId: number, newQuantity: number): void {
    if (newQuantity < 1) return;

    this.cartService.updateItem({
      productoId: productId,
      cantidad: newQuantity
    }).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error actualizando cantidad:', error);
        return throwError(() => new Error('No se pudo actualizar la cantidad.'));
      })
    ).subscribe();
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error eliminando producto:', error);
        return throwError(() => new Error('No se pudo eliminar el producto.'));
      })
    ).subscribe();
  }

  trackByProductId(index: number, item: ItemCarrito): number {
    return item.producto.id;
  }

  close(): void {
    this.dialogRef.close();
  }

  navigateToCheckout(): void {
    this.close();
    
    this.cartService.cart$.pipe(
      take(1),
      map(response => response?.data),
      filter(Boolean)
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}