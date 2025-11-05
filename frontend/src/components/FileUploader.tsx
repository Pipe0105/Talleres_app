import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getArchivos } from "../api/archivosApi";
import { Archivo, Taller } from "../types";

interface FileUploaderProps {
  taller: Taller | null;
}

interface LocalArchivo extends Archivo {
  localUrl?: string;
  esSimulado?: boolean;
}

const FileUploader = ({ taller }: FileUploaderProps) => {
  const [archivos, setArchivos] = useState<LocalArchivo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [comentarios, setComentarios] = useState("");
  const [creadoPor, setCreadoPor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const localUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchArchivos = async () => {
      if (!taller) {
        setArchivos([]);
        setError(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setArchivos([]);
        const data = await getArchivos(taller.id);
        if (isMounted) {
          setArchivos(data);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible obtener los archivos para este taller.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchArchivos();

    return () => {
      isMounted = false;
    };
  }, [taller?.id]);

  useEffect(() => {
    return () => {
      localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taller) {
      setError("Selecciona un taller para asociar archivos.");
      return;
    }
    if (!file) {
      setError("Debes elegir un archivo a subir.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    localUrlsRef.current.push(localUrl);
    const nuevoArchivo: LocalArchivo = {
      id: Date.now(),
      taller_id: taller.id,
      ruta: file.name,
      fecha_subida: new Date().toISOString(),
      creado_por: creadoPor || "operario-demo",
      comentarios: comentarios || "Archivo cargado de manera local",
      localUrl,
      esSimulado: true,
    };

    setArchivos((prev) => [...prev, nuevoArchivo]);
    setFile(null);
    setComentarios("");
    setCreadoPor("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const archivosOrdenados = useMemo(
    () =>
      [...archivos].sort(
        (a, b) =>
          new Date(b.fecha_subida).getTime() -
          new Date(a.fecha_subida).getTime()
      ),
    [archivos]
  );

  if (!taller) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Selecciona un taller en la tabla para visualizar y simular cargas de
        archivos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-inner"
      >
        <h4 className="text-sm font-semibold text-slate-700">
          Subir archivo (simulado)
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          Esta acción solo actualiza el estado local de la interfaz para fines
          de prototipado.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-xs font-medium text-slate-600"
              htmlFor="archivo"
            >
              Archivo
            </label>
            <input
              id="archivo"
              type="file"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-400"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-xs font-medium text-slate-600"
              htmlFor="creadoPor"
            >
              Operario
            </label>
            <input
              id="creadoPor"
              type="text"
              placeholder="Ej. operario-demo"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-400"
              value={creadoPor}
              onChange={(event) => setCreadoPor(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label
            className="text-xs font-medium text-slate-600"
            htmlFor="comentarios"
          >
            Comentarios
          </label>
          <textarea
            id="comentarios"
            rows={2}
            placeholder="Detalle o contexto del archivo"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-400"
            value={comentarios}
            onChange={(event) => setComentarios(event.target.value)}
          />
        </div>
        {error && (
          <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-500"
          >
            Simular subida
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h4 className="text-sm font-semibold text-slate-700">
            Archivos de {taller.observaciones}
          </h4>
          {loading && (
            <p className="mt-1 text-xs text-slate-500">
              Cargando archivos desde el mock…
            </p>
          )}
        </div>
        <ul className="divide-y divide-slate-200 text-sm text-slate-600">
          {archivosOrdenados.map((archivo) => (
            <li
              key={archivo.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-800">{archivo.ruta}</p>
                <p className="text-xs text-slate-500">
                  Subido el{" "}
                  {new Date(archivo.fecha_subida).toLocaleString("es-CL")}
                  {archivo.esSimulado && " · Simulado"}
                </p>
                <p className="text-xs text-slate-500">
                  {archivo.creado_por} — {archivo.comentarios}
                </p>
              </div>
              {archivo.localUrl && (
                <a
                  href={archivo.localUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded border border-brand-200 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  Ver archivo
                </a>
              )}
            </li>
          ))}
          {archivosOrdenados.length === 0 && (
            <li className="px-4 py-6 text-center text-xs text-slate-500">
              Este taller aún no tiene archivos asociados.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FileUploader;
