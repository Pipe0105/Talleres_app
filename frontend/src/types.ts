export interface Item {
  id: number;
  nombre: string;
  detalle?: string | null;
  codigo_producto: string;
  referencia?: string | null;
  descripcion: string;
  precio: number | null;
  especie: string | null;
  lista_id?: number | null;
  location?: string | null;
  sede?: string | null;
  unidad?: string | null;
  fecha_vigencia: string | null;
  fecha_activacion?: string | null;
  fuente: string | null;
  file_hash?: string | null;
  ingested_at?: string | null;
  activo: boolean;
}

export interface ItemsPage {
  items: Item[];
  total: number;
  page: number;
  page_size: number;
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
  hashed_password: string;
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
  sede?: string;
  peso_inicial: number;
  peso_final: number;
  especie: string;
  item_principal_id?: number | null;
  codigo_principal: string;
  subcortes: TallerDetallePayload[];
}

export interface TallerDetalleResponse extends TallerDetallePayload {
  id: number;
  peso_normalizado?: number;
}

export interface TallerResponse {
  id: number;
  nombre_taller: string;
  descripcion?: string | null;
  sede?: string | null;
  peso_inicial: number;
  peso_final: number;
  porcentaje_perdida?: number | null;
  especie: string;
  item_principal_id?: number | null;
  codigo_principal: string;
  creado_en: string;
  subcortes: TallerDetalleResponse[];
}

export interface TallerAdminResponse extends TallerResponse {
  creado_por?: string | null;
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

export interface TallerListItem {
  id: number;
  nombre_taller: string;
  descripcion?: string | null;
  sede?: string | null;
  peso_inicial: number;
  peso_final: number;
  total_peso: number;
  especie: string;
  codigo_principal?: string | null;
  creado_en: string;
}

export interface TallerCalculoRow {
  nombre_corte: string;
  descripcion: string;
  item_code: string;
  peso: number;
  porcentaje_real: number;
  porcentaje_default: number;
  delta_pct: number;
  precio_venta: number;
  valor_estimado: number;
}

export interface InventarioItem {
  codigo_producto: string;
  descripcion: string;
  total_peso: number;
  sede: string | null;
  especie: string | null;
  entradas?: number;
  salidas_pendientes?: number;
  umbral_minimo?: number;
}

export interface InventarioMovimiento {
  id: number;
  sku: string;
  lote: string | null;
  tipo: string;
  cantidad: number;
  sede: string | null;
  descripcion: string | null;
  creado_en: string;
  creado_por_id: number | null;
  creado_por: string | null;
}

export interface InventarioMovimientoList {
  total: number;
  page: number;
  page_size: number;
  items: InventarioMovimiento[];
}
export interface InventarioMovimiento {
  id: number;
  sku: string;
  lote: string | null;
  tipo: string;
  cantidad: number;
  sede: string | null;
  descripcion: string | null;
  creado_en: string;
  creado_por_id: number | null;
  creado_por: string | null;
}

export interface InventarioMovimientoList {
  total: number;
  page: number;
  page_size: number;
  items: InventarioMovimiento[];
}

export interface DashboardMetric {
  value: number;
  trend: number | null;
}

export interface DashboardStats {
  talleres_activos: DashboardMetric;
  completados_hoy: DashboardMetric;
  inventario_bajo: DashboardMetric;
  usuarios_activos: DashboardMetric;
}
