import axios, { type InternalAxiosRequestConfig } from "axios";

import mockDbUrl from "../../mock/db.json?url";
import {
  Archivo,
  NewTaller,
  Precio,
  PriceListItem,
  Producto,
  Taller,
} from "../types";
const normalizeBaseUrl = (rawUrl: string): string => rawUrl.replace(/\/$/, "");

const resolveBaseUrl = (): string => {
  const envBaseUrl = import.meta.env.VITE_API_URL;
  if (typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0) {
    return normalizeBaseUrl(envBaseUrl.trim());
  }

  if (typeof window !== "undefined") {
    return `${normalizeBaseUrl(window.location.origin)}/api`;
  }

  return "http://localhost:8000/api";
};

export const api = axios.create({
  baseURL: resolveBaseUrl(),
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof config.url === "string" && config.url.startsWith("/")) {
    config.url = config.url.replace(/^\/+/, "");
  }
  return config;
});

type MockDb = {
  talleres: Taller[];
  productos: Producto[];
  precios: Precio[];
  archivos: Archivo[];
};

let mockDbCache: MockDb | null = null;

export const loadMockDb = async (): Promise<MockDb> => {
  if (!mockDbCache) {
    const response = await fetch(mockDbUrl);

    if (!response.ok) {
      throw new Error(
        `No se pudo cargar el archivo mock: ${response.status} ${response.statusText}`
      );
    }

    mockDbCache = (await response.json()) as MockDb;
  }

  return mockDbCache;
};

const withMockFallback = async <T>(
  request: () => Promise<T>,
  resolver: (mock: MockDb) => T
): Promise<T> => {
  try {
    return await request();
  } catch (error) {
    console.warn("Fallo la petición a la API, utilizando mock local.", error);
    const mockDb = await loadMockDb();
    return resolver(mockDb);
  }
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }

    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed !== 0;
    }

    return false;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return false;
};

const mapPreciosResponse = (data: unknown): Precio[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = toNumberOrNull(record.id);
      const productoId = toNumberOrNull(record.producto_id);

      if (id == null || productoId == null) {
        return null;
      }

      return {
        id,
        producto_id: productoId,
        fecha_vigencia_desde:
          typeof record.fecha_vigencia_desde === "string"
            ? record.fecha_vigencia_desde
            : "",
        precio_unitario: toNumberOrNull(record.precio_unitario),
        impuestos_incluidos: toBoolean(record.impuestos_incluidos),
      } satisfies Precio;
    })
    .filter((precio): precio is Precio => precio !== null);
};

const mapItemsResponse = (data: unknown): PriceListItem[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const rawId = record.id;
      const normalizedId =
        typeof rawId === "string"
          ? rawId.trim()
          : typeof rawId === "number"
          ? String(rawId)
          : null;

      if (!normalizedId) {
        return null;
      }

      const itemCode =
        typeof record.item_code === "string"
          ? record.item_code.trim()
          : record.item_code != null
          ? String(record.item_code)
          : "";
      const descripcion =
        typeof record.descripcion === "string" ? record.descripcion.trim() : "";
      const actualizadoEn =
        typeof record.actualizado_en === "string"
          ? record.actualizado_en
          : null;

      return {
        id: normalizedId,
        item_code: itemCode || normalizedId,
        descripcion: descripcion || itemCode || normalizedId,
        precio_venta: toNumberOrNull(record.precio_venta),
        actualizado_en: actualizadoEn,
      } satisfies PriceListItem;
    })
    .filter((item): item is PriceListItem => item !== null);
};

const buildPriceListFromMock = (db: MockDb): PriceListItem[] => {
  const preciosPorProducto = new Map<number, Precio>();

  db.precios.forEach((precio) => {
    if (
      precio &&
      typeof precio === "object" &&
      typeof precio.producto_id === "number"
    ) {
      preciosPorProducto.set(precio.producto_id, precio);
    }
  });

  return db.productos.map((producto) => {
    const precioRelacionado = preciosPorProducto.get(producto.id) ?? null;
    const precioUnitario = precioRelacionado
      ? toNumberOrNull(precioRelacionado.precio_unitario)
      : null;

    return {
      id: String(producto.id),
      item_code: String(producto.codigo ?? producto.id),
      descripcion:
        producto.nombre?.trim() ||
        producto.descripcion?.trim() ||
        String(producto.codigo ?? producto.id),
      precio_venta: precioUnitario,
      actualizado_en:
        typeof precioRelacionado?.fecha_vigencia_desde === "string"
          ? precioRelacionado.fecha_vigencia_desde
          : null,
    } satisfies PriceListItem;
  });
};

export const getTalleres = async (): Promise<Taller[]> =>
  withMockFallback(
    () => api.get("/talleres").then((res) => res.data),
    (db) => db.talleres
  );

export const getProductos = async (): Promise<Producto[]> =>
  withMockFallback(
    () => api.get<Producto[]>("/productos").then(({ data }) => data),
    (db) => db.productos
  );

export const getPrecios = async (): Promise<Precio[]> =>
  withMockFallback(
    () =>
      api
        .get<Precio[]>("/precios")
        .then(({ data }) => mapPreciosResponse(data)),
    (db) => mapPreciosResponse(db.precios)
  );
export const getItems = async (): Promise<PriceListItem[]> =>
  withMockFallback(
    async () => {
      const items = await api
        .get("/items")
        .then(({ data }) => mapItemsResponse(data));

      if (items.length > 0) {
        return items;
      }

      const mockDb = await loadMockDb();
      return buildPriceListFromMock(mockDb);
    },
    (db) => buildPriceListFromMock(db)
  );

export const createTaller = async (data: NewTaller): Promise<Taller> =>
  withMockFallback(
    () =>
      api.post<Taller>("/talleres", data).then(({ data: created }) => created),
    (db) => {
      const nextId =
        db.talleres.reduce((max, taller) => Math.max(max, taller.id), 0) + 1;
      const nuevoTaller: Taller = { id: nextId, ...data };
      db.talleres = [...db.talleres, nuevoTaller];
      return nuevoTaller;
    }
  );
