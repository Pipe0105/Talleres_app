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
