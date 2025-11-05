import axios from "axios";
import { NewTaller, Precio, Producto, Taller } from "../types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
});

export const getTalleres = async (): Promise<Taller[]> =>
  (await api.get("/talleres")).data;

export const getProductos = async (): Promise<Producto[]> =>
  (await api.get("/productos")).data;

export const getPrecios = async (): Promise<Precio[]> =>
  (await api.get("/precios")).data;

export const createTaller = async (data: NewTaller): Promise<Taller> =>
  (await api.post("/talleres", data)).data;
