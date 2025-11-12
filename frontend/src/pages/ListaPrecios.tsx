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
import { getItems } from "../api/talleresApi";
import { Item } from "../types";
import { safeStorage } from "../utils/storage";
import { sanitizeSearchQuery } from "../utils/security";

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const STORAGE_KEYS = {
  filter: "listaPrecios.filter",
} as const;

const ListaPrecios = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(() =>
    sanitizeSearchQuery(safeStorage.getItem(STORAGE_KEYS.filter) ?? "")
  );

  useEffect(() => {
    let isMounted = true;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await getItems();

        if (!isMounted) return;

        setItems(response);
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible cargar los datos desde la API de precios.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchItems();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.filter, filter);
  }, [filter]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.descripcion.localeCompare(b.descripcion, "es", {
          sensitivity: "base",
        })
      ),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = filter.trim().toLowerCase();

    if (!query) {
      return sortedItems;
    }

    return sortedItems.filter((item) => {
      const codigo = item.item_code.toLowerCase();
      const descripcion = item.descripcion.toLowerCase();
      return codigo.includes(query) || descripcion.includes(query);
    });
  }, [filter, sortedItems]);

  // 👇 Aquí está el cambio clave: se especifica el tipo <Date | null>
  const lastUpdatedDate = useMemo<Date | null>(() => {
    let latest: Date | null = null;

    sortedItems.forEach((item) => {
      if (!item.actualizado_en) return;

      const parsed = new Date(item.actualizado_en);
      if (Number.isNaN(parsed.getTime())) return;

      if (!latest || parsed.getTime() > latest.getTime()) {
        latest = parsed;
      }
    });

    return latest;
  }, [sortedItems]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedDate) {
      return null;
    }

    return lastUpdatedDate.toLocaleString("es-CO", {
      dateStyle: "long",
      timeStyle: "short",
    });
  }, [lastUpdatedDate]);

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

    if (!sortedItems.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No se encontraron productos para mostrar.
        </Typography>
      );
    }

    if (!filteredItems.length) {
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
              <TableCell width="20%">Código</TableCell>
              <TableCell width="55%">Producto</TableCell>
              <TableCell align="right" width="25%">
                Precio unitario
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => {
              const precio = currencyFormatter.format(item.precio_venta);

              return (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {item.item_code}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.primary">
                      {item.descripcion}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {precio}
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
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <div>
              <Typography variant="h4" component="h1" gutterBottom>
                Lista de Precios
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Consulta la información de precios vigentes directamente desde
                la base de datos oficial.
              </Typography>
            </div>
            <Chip
              color={lastUpdatedLabel ? "primary" : "default"}
              variant={lastUpdatedLabel ? "filled" : "outlined"}
              label={
                lastUpdatedLabel
                  ? `Actualizado al ${lastUpdatedLabel}`
                  : "Fecha de actualización no disponible"
              }
            />
          </Stack>
        </Stack>
      </Paper>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6" component="h2">
              Productos y precios vigentes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Los datos provienen de la API en línea y se actualizan cada vez
              que cambia la lista en la base de datos.
            </Typography>
          </div>
          <TextField
            fullWidth
            label="Buscar por código o producto"
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
