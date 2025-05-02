import { ItemCarrito } from "../model/ItemCarrito";

export interface CarritoResponse {
    itemsCarrito: ItemCarrito[];
    total: number;
  }