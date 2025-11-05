import { FormEvent, useMemo, useState } from "react";
import { NewTaller, Producto } from "../types";

interface TallerFormProps {
  productos: Producto[];
  onCreated: (nuevoTaller: NewTaller) => Promise<void>;
}

const initialState = {
  productoId: "",
  fecha: "",
  pesoInicial: "",
  pesoTaller: "",
  grupo: "",
  observaciones: "",
  creadoPor: "",
};

const TallerForm = ({ productos, onCreated }: TallerFormProps) => {
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const productosOptions = useMemo(
    () =>
      productos.map((producto) => ({
        value: producto.id.toString(),
        label: `${producto.nombre} · ${producto.codigo}`,
      })),
    [productos]
  );

  const isDisabled = submitting || productos.length === 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.productoId || !formState.fecha || !formState.pesoTaller) {
      setError("Producto, fecha y peso del taller son obligatorios.");
      return;
    }

    const producto = productos.find(
      (item) => item.id === Number(formState.productoId)
    );

    if (!producto) {
      setError("El producto seleccionado no es válido.");
      return;
    }

    const pesoInicial = formState.pesoInicial
      ? Number.parseFloat(formState.pesoInicial)
      : null;
    const pesoTaller = Number.parseFloat(formState.pesoTaller);

    if (Number.isNaN(pesoTaller)) {
      setError("Debes ingresar un peso de taller numérico.");
      return;
    }

    const rendimiento =
      pesoInicial && pesoInicial > 0
        ? Number((pesoTaller / pesoInicial).toFixed(6))
        : null;

    const nuevoTaller: NewTaller = {
      producto_id: producto.id,
      codigo: producto.codigo,
      fecha: formState.fecha,
      grupo: formState.grupo || `${producto.nombre.replace(/\s+/g, "_")}_Group`,
      observaciones:
        formState.observaciones || `Taller generado para ${producto.nombre}`,
      peso_inicial: pesoInicial,
      peso_taller: Number(pesoTaller.toFixed(3)),
      rendimiento,
      creado_por: formState.creadoPor || "operario-demo",
    };

    try {
      setSubmitting(true);
      setError(null);
      await onCreated(nuevoTaller);
      setFormState(initialState);
      setSuccessMessage("Taller creado en el mock correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al crear el taller.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Nuevo taller</h3>
      <p className="mt-1 text-sm text-slate-500">
        Completa el formulario para simular el registro de un nuevo taller en el
        json-server.
      </p>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="producto"
          >
            Producto
          </label>
          <select
            id="producto"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400"
            value={formState.productoId}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                productoId: event.target.value,
              }))
            }
            required
            disabled={isDisabled}
          >
            <option value="">Selecciona un producto…</option>
            {productosOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="fecha"
            >
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400"
              value={formState.fecha}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  fecha: event.target.value,
                }))
              }
              required
              disabled={isDisabled}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="grupo"
            >
              Grupo
            </label>
            <input
              id="grupo"
              type="text"
              placeholder="Ej. Ampolleta_Group"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400"
              value={formState.grupo}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  grupo: event.target.value,
                }))
              }
              disabled={isDisabled}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="pesoInicial"
            >
              Peso inicial (kg)
            </label>
            <input
              id="pesoInicial"
              type="number"
              min="0"
              step="0.001"
              placeholder="Ej. 35.2"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400"
              value={formState.pesoInicial}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  pesoInicial: event.target.value,
                }))
              }
              disabled={isDisabled}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="pesoTaller"
            >
              Peso taller (kg)
            </label>
            <input
              id="pesoTaller"
              type="number"
              min="0"
              step="0.001"
              placeholder="Ej. 31.8"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400"
              value={formState.pesoTaller}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  pesoTaller: event.target.value,
                }))
              }
              required
              disabled={isDisabled}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="observaciones"
          >
            Observaciones
          </label>
          <textarea
            id="observaciones"
            rows={3}
            placeholder="Notas relevantes del taller"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400"
            value={formState.observaciones}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                observaciones: event.target.value,
              }))
            }
            disabled={isDisabled}
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="creadoPor"
          >
            Operario
          </label>
          <input
            id="creadoPor"
            type="text"
            placeholder="Ej. operario1"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400"
            value={formState.creadoPor}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                creadoPor: event.target.value,
              }))
            }
            disabled={isDisabled}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isDisabled}
        >
          {submitting
            ? "Guardando…"
            : productos.length === 0
            ? "Cargando productos…"
            : "Registrar taller"}
        </button>
        {productos.length === 0 && (
          <p className="text-center text-xs text-slate-500">
            Espera a que cargue el listado de productos para habilitar el
            formulario.
          </p>
        )}
      </form>
    </aside>
  );
};

export default TallerForm;
