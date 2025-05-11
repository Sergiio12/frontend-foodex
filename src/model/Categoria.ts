import { ImagenOrigen } from "./ImagenOrigen";

export interface Categoria {
  id?: number;
  nombre: string;
  descripcion: string;
  imgUrl?: string;
  imgOrigen?: ImagenOrigen;
}