export interface Item {
  id: number;
  nombre: string;
  detalle?: string | null;
  codigo_producto: string;
  descripcion: string;
  precio: number;
  especie: string;
  fecha_vigencia: string;
  fuente: string;
  activo: boolean;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_gerente: boolean;
  sede: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface TallerDetallePayload {
  codigo_producto: string;
  nombre_subcorte: string;
  peso: number;
  item_id?: number | null;
}

export interface CrearTallerPayload {
  nombre_taller: string;
  descripcion?: string;
  peso_inicial: number;
  peso_final: number;
  especie: string;
  item_principal_id?: number | null;
  codigo_principal: string;
  subcortes: TallerDetallePayload[];
}

export interface TallerDetalleResponse extends TallerDetallePayload {
  id: number;
}

export interface TallerResponse {
  id: number;
  nombre_taller: string;
  descripcion?: string | null;
  peso_inicial: number;
  peso_final: number;
  porcentaje_perdida?: number | null;
  especie: string;
  item_principal_id?: number | null;
  codigo_principal: string;
  creado_en: string;
  subcortes: TallerDetalleResponse[];
}

export interface TallerActividadDia {
  fecha: string;
  cantidad: number;
}

export interface TallerActividadUsuario {
  user_id: number;
  username: string;
  full_name: string | null;
  sede: string | null;
  dias: TallerActividadDia[];
}
