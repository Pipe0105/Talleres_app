import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export const getTalleres = async () => (await api.get("/talleres")).data;
export const getProductos = async () => (await api.get("/productos")).data;
export const getArchivos = async (id: number) =>
  (await api.get(`/archivos?taller_id=${id}`)).data;
export const createTaller = async (data: any) =>
  (await api.post("/talleres", data)).data;
