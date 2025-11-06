export interface Producto {
  id: number;
  codigo: number;
  nombre: string;
  descripcion: string;
}

export interface Precio {
  id: number;
  producto_id: number;
  fecha_vigencia_desde: string;
  precio_unitario: number | null;
  impuestos_incluidos: boolean;
}

export interface Taller {
  id: number;
  producto_id: number;
  codigo: number;
  peso_inicial: number | null;
  peso_taller: number;
  rendimiento: number | null;
  observaciones: string;
  fecha: string;
  grupo: string;
  creado_por: string;
}

export type NewTaller = Omit<Taller, "id">;

export interface Archivo {
  id: number;
  taller_id: number;
  ruta: string;
  fecha_subida: string;
  creado_por: string;
  comentarios: string;
}
