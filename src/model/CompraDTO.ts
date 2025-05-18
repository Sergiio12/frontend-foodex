import { UsuarioDTO } from "./UsuarioDTO";
import { EstadoCompra } from "./EstadoCompra";

export interface CompraDTO {
  id: number;
  usuarioDTO: UsuarioDTO;
  estadoCompra: EstadoCompra;
  fechaHora: Date;
  monto: number;
}