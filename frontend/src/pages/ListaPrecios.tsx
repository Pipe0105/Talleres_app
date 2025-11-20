import { useEffect, useMemo, useState } from "react";
import { Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import { getItems } from "../api/talleresApi";
import { Item } from "../types";
import { safeStorage } from "../utils/storage";
import { sanitizeSearchQuery } from "../utils/security";
import ListaPreciosTable from "../components/ListaPreciosTable";
import PageHeader from "../components/PageHeader";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
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
      const codigo = item.codigo_producto.toLowerCase();
      const descripcion = item.descripcion.toLowerCase();
      return codigo.includes(query) || descripcion.includes(query);
    });
  }, [filter, sortedItems]);

  // 👇 Aquí está el cambio clave: se especifica el tipo <Date | null>
  const lastUpdatedDate = useMemo<Date | null>(() => {
    let latest: Date | null = null;

    sortedItems.forEach((item) => {
      if (!item.fecha_vigencia) return;

      const parsed = new Date(item.fecha_vigencia);
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

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <PageHeader
          title="Lista de Precios"
          description="Consulta la información de precios vigentes directamente desde la base de datos oficial."
          action={
            <Chip
              color={lastUpdatedLabel ? "primary" : "default"}
              variant={lastUpdatedLabel ? "filled" : "outlined"}
              label={
                lastUpdatedLabel
                  ? `Actualizado al ${lastUpdatedLabel}`
                  : "Fecha de actualización no disponible"
              }
            />
          }
        />
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
          <ListaPreciosTable
            loading={loading}
            error={error}
            sortedItems={sortedItems}
            filteredItems={filteredItems}
            formatCurrency={(value) => currencyFormatter.format(Number(value))}
          />
        </Stack>
      </Paper>
    </Stack>
  );
};

export default ListaPrecios;
