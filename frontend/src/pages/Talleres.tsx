import { useEffect, useMemo, useState } from "react";
import {
  createTaller,
  getPrecios,
  getProductos,
  getTalleres,
} from "../api/talleresApi";
import Dashboard from "../components/Dashboard";
import FileUploader from "../components/FileUploader";
import TallerForm from "../components/TallerForm";
import { NewTaller, Precio, Producto, Taller } from "../types";

const Talleres = () => {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [selectedTallerId, setSelectedTallerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [talleresData, productosData, preciosData] = await Promise.all([
          getTalleres(),
          getProductos(),
          getPrecios(),
        ]);

        if (!isMounted) return;

        setTalleres(talleresData);
        setProductos(productosData);
        setPrecios(preciosData);
        setError(null);
        setSelectedTallerId((current) => {
          if (current) {
            return talleresData.find((t) => t.id === current)?.id ?? null;
          }
          return talleresData[0]?.id ?? null;
        });
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible cargar los datos del mock API.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const selectedTaller = useMemo(
    () => talleres.find((taller) => taller.id === selectedTallerId) ?? null,
    [selectedTallerId, talleres]
  );

  const handleTallerCreated = async (payload: NewTaller) => {
    try {
      const nuevoTaller = await createTaller(payload);
      setTalleres((prev) =>
        [...prev, nuevoTaller].sort(
          (a, b) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
            b.id - a.id
        )
      );
      setSelectedTallerId(nuevoTaller.id);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo registrar el nuevo taller.");
    }
  };

  const handleRetry = () => {
    setError(null);
    setSelectedTallerId(null);
    setLoading(true);
    setRefreshToken((token) => token + 1);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Talleres registrados
                </h2>
                <p className="text-sm text-slate-500">
                  Información proveniente del archivo <code>mock/db.json</code>.
                </p>
              </div>
            </div>
            {loading ? (
              <p className="mt-6 animate-pulse text-sm text-slate-500">
                Cargando datos del servidor mock…
              </p>
            ) : error ? (
              <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p>{error}</p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center rounded bg-rose-600 px-3 py-2 text-white shadow hover:bg-rose-500"
                  onClick={handleRetry}
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <Dashboard
                talleres={talleres}
                productos={productos}
                precios={precios}
                selectedTallerId={selectedTallerId}
                onSelectTaller={setSelectedTallerId}
              />
            )}
          </div>
        </div>
        <div className="w-full max-w-md">
          <TallerForm productos={productos} onCreated={handleTallerCreated} />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">
          Archivos asociados
        </h3>
        <p className="text-sm text-slate-500">
          Visualiza documentos o imágenes ligados al taller seleccionado. El
          formulario de subida se comporta de manera local para fines de
          prototipado.
        </p>
        <div className="mt-4">
          <FileUploader taller={selectedTaller} />
        </div>
      </div>
    </section>
  );
};

export default Talleres;
