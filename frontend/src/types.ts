export interface Item {
  id: string;
  item_code: string;
  descripcion: string;
  precio_venta: number;
  actualizado_en: string;
}

export interface corte {
  id: string;
  item_id: string;
  nombre_corte: string;
  porcentaje_default: number;
}

export interface TallerListItem {
  id: string;
  nombre_taller: string;
  descripcion: string | null;
  total_peso: number;
  detalles_count: number;
}

export interface TallerDetalleInput {
  item_id: string;
  corte_id: string;
  peso: number;
}

export interface CrearTallerPayload {
  nombre_taller: string;
  descripcion?: string | null;
  detalles: TallerDetalleInput[];
}

export interface TallerCreado {
  id: string;
  nombre_taller: string;
  descripcion: string | null;
}

export interface TallerCalculoRow {
  taller_id: string;
  nombre_corte: string;
  item_code: string;
  descripcion: string;
  precio_venta: number;
  peso: number;
  peso_total: number;
  porcentaje_default: number;
  porcentaje_real: number;
  delta_pct: number;
  valor_estimado: number;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  creado_en: string;
  actualizado_en: string;
}
