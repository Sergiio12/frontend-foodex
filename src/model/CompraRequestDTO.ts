import { Direccion } from './Direccion';
import { DatosContacto } from './DatosContacto';

export interface CompraRequestDTO {
  comentario?: string;
  direccion: Direccion;
  datosContacto: DatosContacto;
}