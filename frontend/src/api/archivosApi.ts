import { api, loadMockDb } from "./talleresApi";
import { Archivo } from "../types";

export const getArchivos = async (taller_id: number): Promise<Archivo[]> => {
  try {
    return (await api.get(`/archivos?taller_id=${taller_id}`)).data;
  } catch (error) {
    console.warn(
      "Fallo la petición de archivos a la API, utilizando mock local.",
      error
    );
    const mockDb = await loadMockDb();
    return mockDb.archivos.filter((archivo) => archivo.taller_id === taller_id);
  }
};
