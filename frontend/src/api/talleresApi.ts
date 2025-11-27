import axios, { type InternalAxiosRequestConfig } from "axios";

import {
  AuthToken,
  corte,
  CrearTallerPayload,
  Item,
  TallerCalculoRow,
  TallerCreado,
  TallerListItem,
  UserProfile,
} from "../types";
import { safeStorage } from "../utils/storage";
import { Description } from "@mui/icons-material";

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
  if (
    typeof envBackendOrigin === "string" &&
    envBackendOrigin.trim().length > 0
  ) {
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
  toStringOr(
    raw?.nombre ?? raw?.detalle ?? raw?.descripcion ?? raw?.descripcion_item,
    ""
  );

const mapItem = (raw: any): Item => {
  const nombre = resolveItemNombre(raw);

  return {
    id: toNumber(raw?.id, 0),
    codigo_producto: toStringOr(raw?.codigo_producto, ""),
    descripcion: nombre,
    nombre,
    detalle: raw?.detalle ?? null,
    precio: toNumber(raw?.precio, 0),
    especie: toStringOr(raw?.especie, ""),
    fecha_vigencia: toStringOr(raw?.fecha_vigencia, ""),
    fuente: toStringOr(raw?.fuente, ""),
    activo: toBoolean(raw?.activo, true),
  };
};

const mapCorte = (raw: any): corte => ({
  id: toStringOr(raw?.id, ""),
  item_id: toStringOr(raw?.item_id, ""),
  nombre_corte: toStringOr(raw?.nombre_corte, ""),
  porcentaje_default: toNumber(raw?.porcentaje_default),
});

const mapTaller = (raw: any): TallerListItem => ({
  id: toStringOr(raw?.id, ""),
  nombre_taller: toStringOr(raw?.nombre_taller, ""),
  descripcion: raw?.descripcion ?? null,
  total_peso: toNumber(raw?.total_peso),
  detalles_count: Math.max(0, Math.trunc(toNumber(raw?.detalles_count, 0))),
});

const mapCalculo = (raw: any): TallerCalculoRow => ({
  taller_id: toStringOr(raw?.taller_id, ""),
  nombre_corte: toStringOr(raw?.nombre_corte, ""),
  item_code: toStringOr(raw?.item_code, ""),
  descripcion: toStringOr(raw?.descripcion, ""),
  precio_venta: toNumber(raw?.precio_venta),
  peso: toNumber(raw?.peso),
  peso_total: toNumber(raw?.peso_total),
  porcentaje_default: toNumber(raw?.porcentaje_default),
  porcentaje_real: toNumber(raw?.porcentaje_real),
  delta_pct: toNumber(raw?.delta_pct),
  valor_estimado: toNumber(raw?.valor_estimado),
});

const mapUser = (raw: any): UserProfile => ({
  id: toStringOr(raw?.id, ""),
  username: toStringOr(raw?.username, ""),
  email: raw?.email ?? null,
  full_name: raw?.full_name ?? null,
  is_active: toBoolean(raw?.is_active, true),
  is_admin: toBoolean(raw?.is_admin, false),
  creado_en: toStringOr(raw?.creado_en, new Date().toISOString()),
  actualizado_en: toStringOr(raw?.actualizado_en, new Date().toISOString()),
});

export const login = async (
  username: string,
  password: string
): Promise<AuthToken> => {
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

export const getItems = async (): Promise<Item[]> => {
  const { data } = await api.get<unknown[]>("/items");
  return (Array.isArray(data) ? data : []).map(mapItem);
};

export interface CreateCortePayload {
  item_id: string;
  nombre_corte: string;
  porcentaje_default: number;
}

export const createCorte = async (
  payload: CreateCortePayload
): Promise<corte> => {
  const { data } = await api.post("/cortes", payload);
  return mapCorte(data);
};

export const getCortesPorItem = async (itemId: string): Promise<corte[]> => {
  const { data } = await api.get<unknown[]>(`/cortes/por-item/${itemId}`);
  return (Array.isArray(data) ? data : []).map(mapCorte);
};

export const createTaller = async (
  payload: CrearTallerPayload
): Promise<TallerCreado> => {
  const { data } = await api.post<TallerCreado>("/talleres", payload);
  return {
    id: toStringOr((data as any)?.id, ""),
    nombre_taller: toStringOr((data as any)?.nombre_taller, ""),
    descripcion: (data as any)?.descripcion ?? null,
  };
};

export const getTalleres = async (): Promise<TallerListItem[]> => {
  const { data } = await api.get<unknown[]>("/talleres");
  return (Array.isArray(data) ? data : []).map(mapTaller);
};

export const getTallerCalculo = async (
  tallerId: string
): Promise<TallerCalculoRow[]> => {
  const { data } = await api.get<unknown[]>(`/talleres/${tallerId}/calculo`);
  return (Array.isArray(data) ? data : []).map(mapCalculo);
};

export interface AdminCreateUserPayload extends RegisterUserPayload {
  is_admin?: boolean;
  is_active?: boolean;
}

export const adminCreateUser = async (
  payload: AdminCreateUserPayload
): Promise<UserProfile> => {
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
