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
  item_id: string;
  fecha: string;
  unidad_base: string;
  observaciones: string | null;
}

export interface TallerDetalleInput {
  corte_id: string;
  peso: number;
}

export interface CrearTallerPayload {
  item_id: string;
  unidad_base?: string;
  observaciones?: string | null;
  detalles: TallerDetalleInput[];
}

export interface TallerCreado {
  id: string;
  item_id: string;
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
  creado_en: string;
}
