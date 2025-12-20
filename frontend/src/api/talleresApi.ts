import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  AuthToken,
  CrearTallerPayload,
  Item,
  InventarioItem,
  TallerActividadUsuario,
  TallerAdminResponse,
  TallerCalculoRow,
  TallerListItem,
  TallerResponse,
  UserProfile,
} from "../types";
import { safeStorage } from "../utils/storage";
const TOKEN_STORAGE_KEY = "talleres.authToken";

const normalizeBaseUrl = (rawUrl: string): string => rawUrl.replace(/\/+$/, "");

const ensureApiPrefix = (rawUrl: string): string => {
  const normalized = normalizeBaseUrl(rawUrl);
  if (/\/api($|\/)/.test(normalized)) {
    return normalized;
  }
  return `${normalized}/api`;
};

const resolveBaseUrl = (): string => {
  const envBaseUrl = import.meta.env.VITE_API_URL;
  if (typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0) {
    return ensureApiPrefix(envBaseUrl.trim());
  }

  const envBackendOrigin = import.meta.env.VITE_BACKEND_ORIGIN;
  if (typeof envBackendOrigin === "string" && envBackendOrigin.trim().length > 0) {
    return ensureApiPrefix(envBackendOrigin.trim());
  }

  if (typeof window !== "undefined") {
    return ensureApiPrefix(window.location.origin);
  }

  return "http://localhost:8000/api";
};

export const api = axios.create({
  baseURL: resolveBaseUrl(),
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRefresh?: boolean;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return fallback;
    }

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return fallback;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }
  return fallback;
};

const toStringOr = (value: unknown, fallback: string): string => {
  if (typeof value === "string") {
    return value;
  }
  if (value == null) {
    return fallback;
  }
  return String(value);
};

let inMemoryToken: string | null = safeStorage.getItem(TOKEN_STORAGE_KEY);
let refreshPromise: Promise<AuthToken> | null = null;

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  if (token) {
    safeStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    safeStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const logout = () => {
  setAuthToken(null);
};

export const getAuthToken = (): string | null => inMemoryToken;

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof config.url === "string" && config.url.startsWith("/")) {
    config.url = config.url.replace(/^\/+/, "");
  }

  const token = getAuthToken();
  if (token) {
    const headers = config.headers ?? {};
    if (typeof (headers as any).set === "function") {
      (headers as any).set("Authorization", `Bearer ${token}`);
    } else {
      (headers as Record<string, unknown>).Authorization = `Bearer ${token}`;
    }

    config.headers = headers;
  }

  return config;
});

const resolveItemNombre = (raw: any): string =>
  toStringOr(raw?.nombre ?? raw?.detalle ?? raw?.descripcion ?? raw?.descripcion_item, "");

const DEFAULT_CATEGORY = "corte";
const ALLOWED_CATEGORIES = ["corte", "subproducto", "merma", "otro"];

const normalizeCategory = (raw: any): string => {
  const category = toStringOr(raw, DEFAULT_CATEGORY).toLowerCase().trim();
  return ALLOWED_CATEGORIES.includes(category) ? category : DEFAULT_CATEGORY;
};

const mapItem = (raw: any): Item => {
  const nombre = resolveItemNombre(raw);
  const precio = raw?.precio == null ? null : toNumber(raw?.precio, 0);
  const referencia = raw?.referencia ?? raw?.codigo_producto ?? null;
  const codigoProducto = toStringOr(referencia ?? "", "");
  const especie = raw?.especie ? toStringOr(raw.especie, "") : null;

  return {
    id: toNumber(raw?.id, 0),
    codigo_producto: codigoProducto,
    referencia,
    descripcion: nombre,
    nombre,
    detalle: raw?.detalle ?? null,
    precio,
    especie,
    lista_id: raw?.lista_id ?? null,
    location: raw?.location ?? null,
    sede: raw?.sede ?? raw?.location ?? null,
    unidad: raw?.unidad ?? null,
    fecha_vigencia: raw?.fecha_vigencia ? toStringOr(raw.fecha_vigencia, "") : null,
    fecha_activacion: raw?.fecha_activacion ? toStringOr(raw.fecha_activacion, "") : null,
    fuente: raw?.fuente ?? raw?.source_file ?? null,
    file_hash: raw?.file_hash ?? null,
    ingested_at: raw?.ingested_at ? toStringOr(raw.ingested_at, "") : null,
    activo: toBoolean(raw?.activo, true),
  };
};

const mapInventarioItem = (raw: any): InventarioItem => ({
  codigo_producto: toStringOr(raw?.codigo_producto, ""),
  descripcion: toStringOr(raw?.descripcion, ""),
  total_peso: toNumber(raw?.total_peso, 0),
  sede: raw?.sede ?? null,
  especie: raw?.especie ?? null,
  entradas: toNumber(raw?.entradas, 0),
  salidas_pendientes: toNumber(raw?.salidas_pendientes, 0),
  umbral_minimo: raw?.umbral_minimo == null ? undefined : toNumber(raw?.umbral_minimo, 0),
});

const mapUser = (raw: any): UserProfile => ({
  id: toStringOr(raw?.id, ""),
  username: toStringOr(raw?.username, ""),
  email: raw?.email ?? null,
  full_name: raw?.full_name ?? null,
  is_active: toBoolean(raw?.is_active, true),
  is_admin: toBoolean(raw?.is_admin, false),
  is_gerente: toBoolean(raw?.is_gerente, false),
  sede: raw?.sede ?? null,
  creado_en: toStringOr(raw?.creado_en, new Date().toISOString()),
  actualizado_en: toStringOr(raw?.actualizado_en, new Date().toISOString()),
});

const mapTaller = (raw: any): TallerResponse => ({
  id: toNumber(raw?.id, 0),
  nombre_taller: toStringOr(raw?.nombre_taller, ""),
  descripcion: raw?.descripcion ?? null,
  sede: raw?.sede ?? null,
  peso_inicial: toNumber(raw?.peso_inicial, 0),
  peso_final: toNumber(raw?.peso_final, 0),
  porcentaje_perdida: raw?.porcentaje_perdida ? toNumber(raw?.porcentaje_perdida, 0) : null,
  especie: toStringOr(raw?.especie, ""),
  item_principal_id: raw?.item_principal_id ?? null,
  codigo_principal: toStringOr(raw?.codigo_principal, ""),
  creado_en: toStringOr(raw?.creado_en, new Date().toISOString()),
  subcortes: Array.isArray(raw?.subcortes)
    ? raw.subcortes.map((det: any) => ({
        id: toNumber(det?.id, 0),
        codigo_producto: toStringOr(det?.codigo_producto, ""),
        nombre_subcorte: toStringOr(det?.nombre_subcorte, ""),
        peso: toNumber(det?.peso, 0),
        item_id: det?.item_id ?? null,
        categoria: normalizeCategory(det?.categoria),
        peso_normalizado: toNumber(det?.peso_normalizado ?? det?.pesoNormalizado ?? det?.peso, 0),
      }))
    : [],
});

const mapTallerAdmin = (raw: any): TallerAdminResponse => ({
  ...mapTaller(raw),
  creado_por: raw?.creado_por ?? raw?.creadoPor ?? raw?.creador ?? raw?.creado_por_nombre ?? null,
});

const mapTallerActividadUsuario = (raw: any): TallerActividadUsuario => ({
  user_id: toNumber(raw?.user_id, 0),
  username: toStringOr(raw?.username, ""),
  full_name: raw?.full_name ?? null,
  sede: raw?.sede ?? null,
  dias: Array.isArray(raw?.dias)
    ? raw.dias
        .map((dia: any) => ({
          fecha: toStringOr(dia?.fecha, ""),
          cantidad: toNumber(dia?.cantidad, 0),
        }))
        .filter((dia: any) => dia.fecha)
    : [],
});

const mapTallerListItem = (raw: any): TallerListItem => {
  const sede = typeof raw?.sede === "string" ? raw.sede.trim() || null : null;

  return {
    id: toNumber(raw?.id, 0),
    nombre_taller: toStringOr(raw?.nombre_taller, ""),
    descripcion: raw?.descripcion ?? null,
    sede,
    peso_inicial: toNumber(raw?.peso_inicial, 0),
    peso_final: toNumber(raw?.peso_final, 0),
    total_peso: toNumber(raw?.total_peso, 0),
    especie: toStringOr(raw?.especie, ""),
    codigo_principal: raw?.codigo_principal ?? null,
    creado_en: toStringOr(raw?.creado_en, new Date().toISOString()),
  };
};

const mapTallerCalculoRow = (raw: any): TallerCalculoRow => ({
  nombre_corte: toStringOr(raw?.nombre_corte, ""),
  descripcion: toStringOr(raw?.descripcion, ""),
  item_code: toStringOr(raw?.item_code, ""),
  peso: toNumber(raw?.peso, 0),
  porcentaje_real: toNumber(raw?.porcentaje_real, 0),
  porcentaje_default: toNumber(raw?.porcentaje_default, 0),
  delta_pct: toNumber(raw?.delta_pct, 0),
  precio_venta: toNumber(raw?.precio_venta, 0),
  valor_estimado: toNumber(raw?.valor_estimado, 0),
});

export const login = async (username: string, password: string): Promise<AuthToken> => {
  const payload = new URLSearchParams();
  payload.set("grant_type", "password");
  payload.set("username", username);
  payload.set("password", password);
  payload.set("scope", "");
  payload.set("client_id", "");
  payload.set("client_secret", "");

  const { data } = await api.post<AuthToken>("/auth/token", payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  setAuthToken(data.access_token);
  return data;
};

export const refreshToken = async (): Promise<AuthToken> => {
  const { data } = await api.post<AuthToken>("/auth/refresh", undefined, {
    _skipAuthRefresh: true,
  } as RetriableRequestConfig);
  setAuthToken(data.access_token);
  return data;
};

export interface RegisterUserPayload {
  username: string;
  email?: string;
  password: string;
  full_name?: string;
}

export const register = async (payload: RegisterUserPayload) => {
  await api.post("/auth/register", payload);
};

export const getCurrentUser = async (): Promise<UserProfile> => {
  const { data } = await api.get<unknown>("/auth/me");
  return mapUser(data);
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      originalRequest &&
      !originalRequest._skipAuthRefresh &&
      (status === 401 || status === 403) &&
      !originalRequest._retry
    ) {
      const token = getAuthToken();
      if (!token) {
        logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        refreshPromise = refreshPromise ?? refreshToken();
        const newToken = await refreshPromise;
        refreshPromise = null;

        const headers = originalRequest.headers ?? {};
        if (typeof (headers as any).set === "function") {
          (headers as any).set("Authorization", `Bearer ${newToken.access_token}`);
        } else {
          (headers as Record<string, unknown>).Authorization = `Bearer ${newToken.access_token}`;
        }
        originalRequest.headers = headers;

        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const createTaller = async (payload: CrearTallerPayload): Promise<TallerResponse> => {
  const { data } = await api.post<unknown>("/talleres", payload);
  return mapTaller(data);
};

export const getItems = async (): Promise<Item[]> => {
  const { data } = await api.get<unknown[]>("/items");
  return (Array.isArray(data) ? data : []).map(mapItem);
};

export interface GetInventarioParams {
  sede?: string;
  search?: string;
  especie?: string;
}

export const getInventario = async (
  params: GetInventarioParams = {}
): Promise<InventarioItem[]> => {
  const { data } = await api.get<unknown[]>("/inventario", {
    params: {
      sede: params.sede || undefined,
      search: params.search || undefined,
      especie: params.especie || undefined,
    },
  });

  return (Array.isArray(data) ? data : []).map(mapInventarioItem);
};

export interface AdminCreateUserPayload extends RegisterUserPayload {
  is_admin?: boolean;
  is_active?: boolean;
  is_gerente?: boolean;
  sede?: string;
}

export const adminCreateUser = async (payload: AdminCreateUserPayload): Promise<UserProfile> => {
  const { data } = await api.post<unknown>("/users", payload);
  return mapUser(data);
};

export const adminGetUsers = async (): Promise<UserProfile[]> => {
  const { data } = await api.get<unknown>("/users");
  return (Array.isArray(data) ? data : []).map(mapUser);
};

export interface AdminUpdateUserPayload {
  username?: string;
  email?: string;
  full_name?: string;
  password?: string;
  is_active?: boolean;
  is_admin?: boolean;
  is_gerente?: boolean;
  sede?: string;
}

export const adminUpdateUser = async (
  userId: string,
  payload: AdminUpdateUserPayload
): Promise<UserProfile> => {
  const { data } = await api.patch<unknown>(`/users/${userId}`, payload);
  return mapUser(data);
};

export const adminDeleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};

export interface GetTallerHistorialParams {
  search?: string;
  sede?: string;
  especie?: string;
  startDate?: string;
  endDate?: string;
  codigoItem?: string;
}

export const adminGetTallerHistorial = async (
  params: GetTallerHistorialParams = {}
): Promise<TallerAdminResponse[]> => {
  const { data } = await api.get<unknown[]>("/talleres/historial", {
    params: {
      search: params.search || undefined,
      sede: params.sede || undefined,
      especie: params.especie || undefined,
      start_date: params.startDate || undefined,
      end_date: params.endDate || undefined,
      codigo_item: params.codigoItem || undefined,
    },
  });

  return (Array.isArray(data) ? data : []).map(mapTallerAdmin);
};

export const adminGetTaller = async (tallerId: string | number): Promise<TallerAdminResponse> => {
  const { data } = await api.get<unknown>(`/talleres/${tallerId}`);
  return mapTallerAdmin(data);
};

export const adminUpdateTaller = async (
  tallerId: string | number,
  payload: CrearTallerPayload
): Promise<TallerAdminResponse> => {
  const { data } = await api.put<unknown>(`/talleres/${tallerId}`, payload);
  return mapTallerAdmin(data);
};

export const adminDeleteTaller = async (tallerId: string | number): Promise<void> => {
  await api.delete(`/talleres/${tallerId}`);
};

export interface GetTallerActividadParams {
  startDate: string;
  endDate: string;
}

export const getTallerActividad = async (
  params: GetTallerActividadParams
): Promise<TallerActividadUsuario[]> => {
  const { data } = await api.get<unknown[]>("/talleres/actividad", {
    params,
  });

  return (Array.isArray(data) ? data : []).map(mapTallerActividadUsuario);
};

export const getTallerActividadDetalle = async (params: {
  userId: number;
  fecha: string;
}): Promise<TallerResponse[]> => {
  const { data } = await api.get<unknown[]>("/talleres/actividad/detalle", {
    params,
  });

  return (Array.isArray(data) ? data : []).map(mapTaller);
};

export const getTalleres = async (): Promise<TallerListItem[]> => {
  const { data } = await api.get<unknown[]>("/talleres");
  return (Array.isArray(data) ? data : []).map(mapTallerListItem);
};

export const getTallerCalculo = async (tallerId: string | number): Promise<TallerCalculoRow[]> => {
  const { data } = await api.get<unknown[]>(`/talleres/${tallerId}/calculo`);
  return (Array.isArray(data) ? data : []).map(mapTallerCalculoRow);
};
