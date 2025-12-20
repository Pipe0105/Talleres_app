import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close, Download, ZoomOutMap } from "@mui/icons-material";
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
  sort: "listaPrecios.sort",
  species: "listaPrecios.species",
  branch: "listaPrecios.branch",
} as const;

const ListaPrecios = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(() =>
    sanitizeSearchQuery(safeStorage.getItem(STORAGE_KEYS.filter) ?? "")
  );
  const [sortOrder, setSortOrder] = useState<"descripcion" | "precio-asc" | "precio-desc">(
    (safeStorage.getItem(STORAGE_KEYS.sort) as
      | "descripcion"
      | "precio-asc"
      | "precio-desc"
      | null) ?? "descripcion"
  );
  const [species, setSpecies] = useState<"todas" | "res" | "cerdo">(
    (safeStorage.getItem(STORAGE_KEYS.species) as "todas" | "res" | "cerdo" | null) ?? "todas"
  );
  const [branch, setBranch] = useState<string>(safeStorage.getItem(STORAGE_KEYS.branch) ?? "todas");
  const [previewOpen, setPreviewOpen] = useState(false);

  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("md"));

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

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.sort, sortOrder);
  }, [sortOrder]);
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.species, species);
  }, [species]);
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.branch, branch);
  }, [branch]);

  const availableBranches = useMemo(() => {
    const branches = new Set<string>();

    items.forEach((item) => {
      const sede = item.sede ?? item.location;
      if (sede) {
        branches.add(sede);
      }
    });

    return Array.from(branches).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = filter.trim().toLowerCase();
    const normalizedSpecies = species.toLowerCase();

    const normalizePrice = (value: number | null, direction: "asc" | "desc") => {
      if (value == null) {
        return direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      }

      return Number(value);
    };

    const matchesQuery = (item: Item) => {
      if (!query) return true;
      const codigo = (item.codigo_producto ?? "").toLowerCase();
      const descripcion = (item.descripcion ?? "").toLowerCase();
      const sede = (item.sede ?? item.location ?? "").toLowerCase();
      return codigo.includes(query) || descripcion.includes(query) || sede.includes(query);
    };

    const matchesSpecies = (item: Item) => {
      if (normalizedSpecies === "todas") return true;
      const itemSpecies = (item.especie ?? "").toLowerCase();
      return itemSpecies === normalizedSpecies;
    };

    const matchesBranch = (item: Item) => {
      if (branch === "todas") return true;

      const itemBranch = (item.sede ?? item.location ?? "").toLowerCase();
      return itemBranch === branch.toLowerCase();
    };

    const sortByOrder = (a: Item, b: Item) => {
      if (sortOrder === "precio-asc") {
        return normalizePrice(a.precio, "asc") - normalizePrice(b.precio, "asc");
      }
      if (sortOrder === "precio-desc") {
        return normalizePrice(b.precio, "desc") - normalizePrice(a.precio, "desc");
      }

      return (a.descripcion ?? "").localeCompare(b.descripcion ?? "", "es", {
        sensitivity: "base",
      });
    };

    return [...items]
      .filter((item) => matchesQuery(item) && matchesSpecies(item) && matchesBranch(item))
      .sort(sortByOrder);
  }, [branch, filter, items, sortOrder, species]);

  // 👇 Aquí está el cambio clave: se especifica el tipo <Date | null>
  const lastUpdatedDate = useMemo<Date | null>(() => {
    let latest: Date | null = null;

    items.forEach((item) => {
      if (!item.ingested_at) return;

      const parsed = new Date(item.ingested_at);
      if (Number.isNaN(parsed.getTime())) return;

      if (!latest || parsed.getTime() > latest.getTime()) {
        latest = parsed;
      }
    });

    return latest;
  }, [items]);

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

  const handleDownload = () => {
    if (!filteredItems.length) return;

    const escapeCsvValue = (value: string | number | null) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      ["Código", "Producto", "Lista", "Sede", "Especie", "Precio (COP)", "Fecha de vigencia"],
      ...filteredItems.map((item) => [
        item.codigo_producto,
        item.descripcion,
        item.lista_id ?? "",
        item.sede ?? item.location ?? "",
        item.especie ?? "",
        item.precio == null ? "" : currencyFormatter.format(Number(item.precio)),
        item.fecha_vigencia,
      ]),
    ];

    const csvContent = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `lista_precios_${new Date().toISOString().slice(0, 10)}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={3} className="animate-fade-up">
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
              Los datos provienen de la API en línea y se actualizan cada vez que cambia la lista en
              la base de datos.
            </Typography>
          </div>
          <TextField
            fullWidth
            label="Buscar por código o producto"
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<ZoomOutMap />}
              onClick={() => setPreviewOpen(true)}
              disabled={!filteredItems.length}
            >
              Previsualizacion Ampliada
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownload}
              disabled={!filteredItems.length}
            >
              {" "}
              Descargar lista de precios
            </Button>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="sort-order-label">Ordenar por</InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                label="Ordenar por"
                onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
                inputProps={{ "aria-label": "Ordenar lista de precios" }}
              >
                <MenuItem value="descripcion">Nombre (A-Z)</MenuItem>
                <MenuItem value="precio-asc">Precio de menor a mayor</MenuItem>
                <MenuItem value="precio-desc">Precio de mayor a menor</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="species-filter-label">Especie</InputLabel>
              <Select
                labelId="species-filter-label"
                value={species}
                label="Especie"
                onChange={(event) => setSpecies(event.target.value as typeof species)}
                inputProps={{ "aria-label": "Filtrar precios por especie" }}
              >
                <MenuItem value="todas">Todas</MenuItem>
                <MenuItem value="res">Res</MenuItem>
                <MenuItem value="cerdo">Cerdo</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="branch-filter-label">Sede</InputLabel>
              <Select
                labelId="branch-filter-label"
                value={branch}
                label="Sede"
                onChange={(event) => setBranch(event.target.value)}
                inputProps={{ "aria-label": "Filtrar precios por sede" }}
              >
                <MenuItem value="todas">Todas</MenuItem>
                {availableBranches.map((branchName) => (
                  <MenuItem key={branchName} value={branchName}>
                    {branchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <ListaPreciosTable
            loading={loading}
            error={error}
            items={items}
            visibleItems={filteredItems}
            formatCurrency={(value) => currencyFormatter.format(Number(value))}
          />
        </Stack>
      </Paper>
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullScreen={fullScreenDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ZoomOutMap fontSize="small" />
            <Typography component="span" variant="h6">
              Previsualización Ampliada de la Lista de Precios
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <ListaPreciosTable
            loading={loading}
            error={error}
            items={items}
            visibleItems={filteredItems}
            formatCurrency={(value) => currencyFormatter.format(Number(value))}
          />
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Close />} onClick={() => setPreviewOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default ListaPrecios;
