import { DatosContacto } from './DatosContacto';
import { Direccion } from './Direccion';

export interface UsuarioDTO {
  id?: number;
  nombre: string;
  apellido1: string;
  apellido2: string;
  datosContacto: DatosContacto;
  direccion: Direccion;
}