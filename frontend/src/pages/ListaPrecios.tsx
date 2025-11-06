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
import { getPrecios, getProductos } from "../api/talleresApi";
import { Precio, Producto } from "../types";

type ListaPrecioRow = {
  id: number;
  codigo: number;
  nombre: string;
  descripcion: string;
  precioUnitario: number | null;
  fechaVigencia: string | null;
  impuestosIncluidos: boolean;
};

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const ListaPrecios = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [productosData, preciosData] = await Promise.all([
          getProductos(),
          getPrecios(),
        ]);

        if (!isMounted) return;

        setProductos(productosData);
        setPrecios(preciosData);
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
        return {
          id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precioUnitario,
          fechaVigencia,
          impuestosIncluidos: precio?.impuestos_incluidos ?? false,
        } satisfies ListaPrecioRow;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [precios, productos]);

  const filteredRows = useMemo(() => {
    const query = filter.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const codigo = String(row.codigo);
      const nombre = row.nombre.toLowerCase();
      const descripcion = row.descripcion.toLowerCase();

      return (
        codigo.includes(query) ||
        nombre.includes(query) ||
        descripcion.includes(query)
      );
    });
  }, [filter, rows]);

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
              <TableCell align="right">Precio unitario</TableCell>
              <TableCell>Vigente desde</TableCell>
              <TableCell>Impuestos</TableCell>
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

              return (
                <TableRow key={row.id} hover>
                  <TableCell>{row.codigo}</TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" color="text.primary">
                      {row.descripcion}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {precio}
                  </TableCell>
                  <TableCell>{fecha}</TableCell>
                  <TableCell>
                    {row.precioUnitario != null ? (
                      <Chip
                        size="small"
                        color={row.impuestosIncluidos ? "success" : "default"}
                        label={
                          row.impuestosIncluidos
                            ? "Impuestos incluidos"
                            : "Sin impuestos"
                        }
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
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
            onChange={(event) => setFilter(event.target.value)}
          />
          {renderContent()}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default ListaPrecios;
