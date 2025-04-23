import { Categoria } from './Categoria';
import { ImagenOrigen } from './ImagenOrigen';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  descatalogado: boolean;
  fechaAlta: Date | string;
  imgUrl?: string;
  imgOrigen?: ImagenOrigen;
  categoria: Categoria;
}