import { Producto } from "./Producto.js";
import { ItemCarritoId } from "./ItemCarritoId.js";

export interface ItemCarrito {
    id: ItemCarritoId;
    cantidad: number;
    producto: Producto;
  }