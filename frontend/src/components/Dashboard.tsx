import { useMemo, useState } from "react";
import { Precio, Producto, Taller } from "../types";

interface DashboardProps {
  talleres: Taller[];
  productos: Producto[];
  precios: Precio[];
  selectedTallerId: number | null;
  onSelectTaller?: (tallerId: number) => void;
}

const Dashboard = ({
  talleres,
  productos,
  precios,
  selectedTallerId,
  onSelectTaller,
}: DashboardProps) => {
  const [search, setSearch] = useState("");

  const productoMap = useMemo(
    () =>
      new Map(productos.map((producto) => [producto.id, producto] as const)),
    [productos]
  );

  const precioMap = useMemo(() => {
    const map = new Map<number, Precio>();

    precios.forEach((precio) => {
      const current = map.get(precio.producto_id);
      if (!current) {
        map.set(precio.producto_id, precio);
        return;
      }

      const currentDate = new Date(current.fecha_vigencia_desde).getTime();
      const candidateDate = new Date(precio.fecha_vigencia_desde).getTime();

      if (candidateDate > currentDate) {
        map.set(precio.producto_id, precio);
      }
    });

    return map;
  }, [precios]);

  const filteredTalleres = useMemo(() => {
    if (!search.trim()) {
      return talleres;
    }
    const term = search.toLowerCase();
    return talleres.filter((taller) => {
      const producto = productoMap.get(taller.producto_id);
      return (
        taller.grupo.toLowerCase().includes(term) ||
        taller.observaciones.toLowerCase().includes(term) ||
        producto?.nombre.toLowerCase().includes(term) ||
        producto?.codigo.toString().includes(term)
      );
    });
  }, [search, talleres, productoMap]);

  const resumenPorGrupo = useMemo(() => {
    const map = new Map<
      string,
      {
        totalPeso: number;
        totalRendimiento: number;
        cantidad: number;
        conRendimiento: number;
      }
    >();

    filteredTalleres.forEach((taller) => {
      const entry = map.get(taller.grupo) ?? {
        totalPeso: 0,
        totalRendimiento: 0,
        cantidad: 0,
        conRendimiento: 0,
      };
      entry.totalPeso += taller.peso_taller;
      if (typeof taller.rendimiento === "number") {
        entry.totalRendimiento += taller.rendimiento;
        entry.conRendimiento += 1;
      }
      entry.cantidad += 1;
      map.set(taller.grupo, entry);
    });

    return Array.from(map.entries()).map(([grupo, valores]) => ({
      grupo,
      totalPeso: valores.totalPeso,
      rendimientoPromedio:
        valores.conRendimiento > 0
          ? valores.totalRendimiento / valores.conRendimiento
          : null,
      cantidad: valores.cantidad,
    }));
  }, [filteredTalleres]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {resumenPorGrupo.map((grupo) => (
          <article
            key={grupo.grupo}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Grupo
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-800">
              {grupo.grupo.replace(/_/g, " ")}
            </h3>
            <dl className="mt-3 space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Registros</dt>
                <dd className="font-medium text-slate-800">{grupo.cantidad}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Peso total</dt>
                <dd className="font-medium text-slate-800">
                  {grupo.totalPeso.toFixed(2)} kg
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Rendimiento medio</dt>
                <dd className="font-medium text-slate-800">
                  {grupo.rendimientoPromedio
                    ? `${(grupo.rendimientoPromedio * 100).toFixed(2)}%`
                    : "Sin datos"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
        {resumenPorGrupo.length === 0 && (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No se encontraron registros para el filtro aplicado.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Detalle de talleres
          </h3>
          <input
            type="search"
            placeholder="Buscar por grupo, producto o código"
            className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Peso inicial</th>
                <th className="px-4 py-3">Peso taller</th>
                <th className="px-4 py-3">Rendimiento</th>
                <th className="px-4 py-3">Precio unitario</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
              {filteredTalleres.map((taller) => {
                const producto = productoMap.get(taller.producto_id);
                const precio = precioMap.get(taller.producto_id);
                const isSelected = selectedTallerId === taller.id;
                return (
                  <tr
                    key={taller.id}
                    className={
                      isSelected ? "bg-brand-50 text-slate-800" : "bg-white"
                    }
                  >
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {new Date(taller.fecha).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {producto?.nombre ?? "Producto desconocido"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Código {taller.codigo}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {taller.grupo.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      {taller.peso_inicial ? `${taller.peso_inicial} kg` : "—"}
                    </td>
                    <td className="px-4 py-3">{taller.peso_taller} kg</td>
                    <td className="px-4 py-3">
                      {typeof taller.rendimiento === "number"
                        ? `${(taller.rendimiento * 100).toFixed(2)}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {precio
                        ? new Intl.NumberFormat("es-CL", {
                            style: "currency",
                            currency: "CLP",
                          }).format(precio.precio_unitario)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {onSelectTaller && (
                        <button
                          type="button"
                          className={`rounded px-3 py-1 text-xs font-semibold shadow transition ${
                            isSelected
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-brand-100 hover:text-brand-700"
                          }`}
                          onClick={() => onSelectTaller(taller.id)}
                        >
                          {isSelected ? "Seleccionado" : "Ver detalle"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTalleres.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-slate-500"
                    colSpan={8}
                  >
                    No hay talleres que coincidan con tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
