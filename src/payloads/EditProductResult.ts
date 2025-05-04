import { Producto } from "../model/Producto";

export interface EditProductoResult {
    producto: Producto;
    imageFile?: File;
  }