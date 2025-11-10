import axios, { type InternalAxiosRequestConfig } from "axios";

import mockDbUrl from "../../mock/db.json?url";
import { Archivo, NewTaller, Precio, Producto, Taller } from "../types";

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
