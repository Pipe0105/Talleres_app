import { api } from "./talleresApi";
import { Archivo } from "../types";

export const getArchivos = async (taller_id: number): Promise<Archivo[]> =>
  (await api.get(`/archivos?taller_id=${taller_id}`)).data;
