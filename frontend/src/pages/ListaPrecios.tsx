import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { getPrecios, getProductos, getTalleres } from "../api/talleresApi";
import { Precio, Producto, Taller } from "../types";
import { safeStorage } from "../utils/storage";
import { sanitizeSearchQuery } from "../utils/security";
import PageSection from "../components/PageSection";

type ListaPrecioRow = {
  id: number;
  codigo: number;
  nombre: string;
  descripcion: string;
  precioUnitario: number | null;
  fechaVigencia: string | null;
  impuestosIncluidos: boolean;
  rendimientoPromedio: number | null;
  grupos: string[];
  observacionesDestacadas: string[];
  proximaActualizacion: string | null;
  vigenteHasta: string | null;
};

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const percentFormatter = new Intl.NumberFormat("es-CL", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const STORAGE_KEYS = {
  filter: "listaPrecios.filter",
} as const;

const calculateVigenteHasta = (fecha: string | null): string | null => {
  if (!fecha) {
    return null;
  }

  const base = new Date(fecha);
  if (Number.isNaN(base.getTime())) {
    return null;
  }

  const estimado = new Date(base);
  estimado.setMonth(estimado.getMonth() + 6);
  return estimado.toISOString();
};

const calculateProximaActualizacion = (
  vigenteDesde: string | null
): string | null => {
  const vigenteHasta = calculateVigenteHasta(vigenteDesde);

  if (!vigenteHasta) {
    return null;
  }

  const fecha = new Date(vigenteHasta);
  fecha.setDate(fecha.getDate() - 30);
  return fecha.toISOString();
};

const ListaPrecios = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [filter, setFilter] = useState(() =>
    sanitizeSearchQuery(safeStorage.getItem(STORAGE_KEYS.filter) ?? "")
  );

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [productosData, preciosData, talleresData] = await Promise.all([
          getProductos(),
          getPrecios(),
          getTalleres(),
        ]);

        if (!isMounted) return;

        setProductos(productosData);
        setPrecios(preciosData);
        setTalleres(talleresData);
        setError(null);
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
  }, []);

  const talleresPorProducto = useMemo(() => {
    const map = new Map<number, Taller[]>();

    talleres.forEach((taller) => {
      const productoId = taller.producto_id;

      if (!Number.isFinite(productoId)) {
        return;
      }

      const existentes = map.get(productoId);
      if (existentes) {
        existentes.push(taller);
      } else {
        map.set(productoId, [taller]);
      }
    });

    return map;
  }, [talleres]);

  const rows = useMemo<ListaPrecioRow[]>(() => {
    if (!productos.length) {
      return [];
    }

    const preciosPorProducto = new Map<number, Precio>();
    precios.forEach((precio) => {
      const productoId = precio.producto_id;

      if (!Number.isFinite(productoId) || preciosPorProducto.has(productoId)) {
        return;
      }
      preciosPorProducto.set(productoId, precio);
    });

    return productos
      .map((producto) => {
        const precio = preciosPorProducto.get(producto.id) ?? null;
        const precioUnitario =
          typeof precio?.precio_unitario === "number" &&
          Number.isFinite(precio.precio_unitario)
            ? precio.precio_unitario
            : null;
        const fechaVigencia =
          precio && precio.fecha_vigencia_desde.trim()
            ? precio.fecha_vigencia_desde
            : null;
        const talleresRelacionados = talleresPorProducto.get(producto.id) ?? [];
        const grupos = Array.from(
          new Set(
            talleresRelacionados
              .map((taller) => taller.grupo?.trim())
              .filter((grupo): grupo is string => !!grupo)
          )
        );
        const observacionesDestacadas = Array.from(
          new Set(
            talleresRelacionados
              .map((taller) => taller.observaciones?.trim())
              .filter((observacion): observacion is string => !!observacion)
          )
        ).slice(0, 3);
        const rendimientos = talleresRelacionados
          .map((taller) =>
            typeof taller.rendimiento === "number" &&
            Number.isFinite(taller.rendimiento)
              ? taller.rendimiento
              : null
          )
          .filter((valor): valor is number => valor != null);
        const rendimientoPromedio = rendimientos.length
          ? rendimientos.reduce((acc, valor) => acc + valor, 0) /
            rendimientos.length
          : null;
        return {
          id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precioUnitario,
          fechaVigencia,
          impuestosIncluidos: precio?.impuestos_incluidos ?? false,
          rendimientoPromedio,
          grupos,
          observacionesDestacadas,
          proximaActualizacion: calculateProximaActualizacion(fechaVigencia),
          vigenteHasta: calculateVigenteHasta(fechaVigencia),
        } satisfies ListaPrecioRow;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [precios, productos, talleresPorProducto]);

  const filteredRows = useMemo(() => {
    const query = filter.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const codigo = String(row.codigo);
      const nombre = row.nombre.toLowerCase();
      const descripcion = row.descripcion.toLowerCase();
      const grupos = row.grupos.join(" ").toLowerCase();
      const observaciones = row.observacionesDestacadas.join(" ").toLowerCase();

      return (
        codigo.includes(query) ||
        nombre.includes(query) ||
        descripcion.includes(query) ||
        grupos.includes(query) ||
        observaciones.includes(query)
      );
    });
  }, [filter, rows]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.filter, filter);
  }, [filter]);

  const handleFilterChange = (value: string) => {
    setFilter(sanitizeSearchQuery(value));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            Cargando lista de precios…
          </Typography>
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          <AlertTitle>Error al cargar</AlertTitle>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Alert>
      );
    }

    if (!rows.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No se encontraron productos para mostrar.
        </Typography>
      );
    }

    if (!filteredRows.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No se encontraron productos que coincidan con tu búsqueda.
        </Typography>
      );
    }

    return (
      <TableContainer sx={{ borderRadius: 3 }}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Rendimiento promedio</TableCell>
              <TableCell>Observaciones clave</TableCell>
              <TableCell align="right">Precio unitario</TableCell>
              <TableCell>Vigente desde</TableCell>
              <TableCell>Próxima actualización</TableCell>
              <TableCell>Vigente hasta</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row) => {
              const precio =
                row.precioUnitario != null
                  ? currencyFormatter.format(row.precioUnitario)
                  : "Sin precio";
              const fecha = row.fechaVigencia
                ? new Date(row.fechaVigencia).toLocaleDateString("es-CL")
                : "—";
              const rendimiento =
                row.rendimientoPromedio != null
                  ? percentFormatter.format(row.rendimientoPromedio)
                  : "Sin datos";
              const grupos = row.grupos.length
                ? row.grupos.join(", ")
                : "Sin grupo registrado";
              const observaciones = row.observacionesDestacadas.length
                ? row.observacionesDestacadas.join(" • ")
                : "Sin observaciones registradas";
              const proximaActualizacion = row.proximaActualizacion
                ? new Date(row.proximaActualizacion).toLocaleDateString("es-CL")
                : "—";
              const vigenteHasta = row.vigenteHasta
                ? new Date(row.vigenteHasta).toLocaleDateString("es-CL")
                : "—";

              return (
                <TableRow key={row.id} hover>
                  <TableCell>{row.codigo}</TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" color="text.primary">
                      {row.descripcion}
                    </Typography>
                  </TableCell>
                  <TableCell>{rendimiento}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" color="text.primary">
                      {observaciones}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {precio}
                  </TableCell>
                  <TableCell>{fecha}</TableCell>
                  <TableCell>{proximaActualizacion}</TableCell>
                  <TableCell>{vigenteHasta}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lista de Precios
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consulta la información de precios vigentes para cada producto. Esta
          vista se alimenta de la API (o el mock local) para mantener los datos
          organizados y listos para futuras integraciones comerciales.
        </Typography>
      </Paper>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6" component="h2">
              Productos y precios vigentes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Información proveniente del archivo <code>mock/db.json</code> en
              ausencia de la API real.
            </Typography>
          </div>
          <TextField
            fullWidth
            label="Buscar por código, producto o descripción"
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
          />
          {renderContent()}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default ListaPrecios;
