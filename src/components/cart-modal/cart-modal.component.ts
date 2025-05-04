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
  private destroy$ = new Subject<void>();

  // Observables
  cartItems$!: Observable<ItemCarrito[]>;
  totalPrice$!: Observable<number>;
  uniqueItemsCount$!: Observable<number>;
  combinedData$!: Observable<{ // Declaración corregida
    cart: ApiResponseBody<CarritoResponse> | null;
    loading: boolean;
    total: number;
  }>;

  constructor(
    public cartService: CartService,
    private productosService: ProductosService,
    private router: Router,
    public dialogRef: MatDialogRef<CartModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initializeCart();
    this.setupCartObservables();
    this.initializeCombinedData(); 
  }

  private initializeCombinedData(): void {
    this.combinedData$ = combineLatest({
      cart: this.cartService.cart$,
      loading: this.cartService.isLoading$,
      total: this.cartService.totalPrice$
    }).pipe(
      tap(data => console.log('[CartModal] Actualización combinedData:', data.cart?.data?.itemsCarrito)),
      distinctUntilChanged((prev, curr) => {
        // Corregir nombre de variable para evitar conflicto con la función isEqual
        const areEqual = prev.loading === curr.loading &&
          isEqual(prev.cart?.data?.itemsCarrito, curr.cart?.data?.itemsCarrito);
        
        console.log('[CartModal] ¿Datos iguales?:', areEqual);
        return areEqual;
      })
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

  private setupCartObservables(): void {
    this.cartItems$ = this.cartService.cart$.pipe(
      map(response => response?.data?.itemsCarrito || []),
      distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
      shareReplay(1)
    );
  }

  updateQuantity(productId: number, newQuantity: number): void {
    console.log('[CartModal] Actualizando cantidad. Producto:', productId, 'Nueva cantidad:', newQuantity);
    
    if (newQuantity < 0) return;
  
    console.log('[CartModal] Bloqueando UI...');
    this.cartService.setLoading(true);
    
    this.cartService.modifyItem(productId, newQuantity).pipe(
      tap(() => console.log('[CartModal] Actualización exitosa')),
      catchError(error => {
        console.error('[CartModal] Error en actualización:', error);
        console.log('[CartModal] Forzando recarga del carrito...');
        this.cartService.getCart().pipe(take(1)).subscribe();
        return throwError(() => error);
      }),
      finalize(() => {
        console.log('[CartModal] Finalizando actualización');
        this.cartService.setLoading(false);
      })
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
    console.log('[CartModal] Iniciando eliminación de producto:', productId);
    
    this.cartService.removeItem(productId).pipe(
      tap(() => console.log('[CartModal] Eliminación HTTP completada')),
      catchError(error => {
        console.error('[CartModal] Error en eliminación:', error);
        return throwError(() => error);
      }),
      finalize(() => console.log('[CartModal] Proceso de eliminación finalizado')),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  trackByProductId(index: number, item: ItemCarrito): number {
    console.log('[CartModal] TrackBy ID:', item.producto.id);
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
