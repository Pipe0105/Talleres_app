import axios from "axios";
import mockDbUrl from "../../mock/db.json?url";
import { Archivo, NewTaller, Precio, Producto, Taller } from "../types";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
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

export const getTalleres = async (): Promise<Taller[]> =>
  withMockFallback(
    () => api.get("/talleres").then((res) => res.data),
    (db) => db.talleres
  );

export const getProductos = async (): Promise<Producto[]> =>
  withMockFallback(
    () => api.get("/productos").then((res) => res.data),
    (db) => db.productos
  );

export const getPrecios = async (): Promise<Precio[]> =>
  withMockFallback(
    () => api.get("/precios").then((res) => res.data),
    (db) => db.precios
  );

export const createTaller = async (data: NewTaller): Promise<Taller> =>
  withMockFallback(
    () => api.post("/talleres", data).then((res) => res.data),
    (db) => {
      const nextId =
        db.talleres.reduce((max, taller) => Math.max(max, taller.id), 0) + 1;
      const nuevoTaller: Taller = { id: nextId, ...data };
      db.talleres = [...db.talleres, nuevoTaller];
      return nuevoTaller;
    }
  );
