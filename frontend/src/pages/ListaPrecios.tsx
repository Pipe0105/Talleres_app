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
  ListItemIcon,
  ListItemText,
  MenuItem,
  Menu,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close, Download, ZoomOutMap } from "@mui/icons-material";
import { exportItems, getItems } from "../api/talleresApi";
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
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    let isMounted = true;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await getItems({
          q: filter,
          species: species === "todas" ? undefined : species,
          branch: branch === "todas" ? undefined : branch,
          sort: sortOrder,
          page,
          page_size: pageSize,
        });

        if (!isMounted) return;

        setItems(response.items);
        setTotalItems(response.total);
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
  }, [branch, filter, page, pageSize, sortOrder, species]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.filter, filter);
    setPage(1);
  }, [filter]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.sort, sortOrder);
    setPage(1);
  }, [sortOrder]);
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.species, species);
    setPage(1);
  }, [species]);
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.branch, branch);
    setPage(1);
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

  const visibleItems = items;

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

  const buildCsv = (rows: Array<Array<string | number | null>>) => {
    const escapeCsvValue = (value: string | number | null) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  };

  const createCsvRows = (data: Item[]) => [
    ["Código", "Producto", "Lista", "Sede", "Especie", "Precio (COP)", "Fecha de vigencia"],
    ...data.map((item) => [
      item.codigo_producto,
      item.descripcion,
      item.lista_id ?? "",
      item.sede ?? item.location ?? "",
      item.especie ?? "",
      item.precio == null ? "" : currencyFormatter.format(Number(item.precio)),
      item.fecha_vigencia,
    ]),
  ];

  const downloadCsv = (rows: Array<Array<string | number | null>>) => {
    const csvContent = buildCsv(rows);

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

  const handleExportVisible = () => {
    if (!visibleItems.length) return;
    downloadCsv(createCsvRows(visibleItems));
  };

  const handleExportAll = async () => {
    try {
      setExporting(true);
      const response = await exportItems({
        q: filter,
        species: species === "todas" ? undefined : species,
        branch: branch === "todas" ? undefined : branch,
        sort: sortOrder,
      });
      downloadCsv(createCsvRows(response));
    } catch (err) {
      console.error(err);
      setError("No fue posible exportar la lista completa de precios.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchor(null);
  };

  const handleExportOption = (mode: "visible" | "all") => {
    handleExportMenuClose();
    if (mode === "visible") {
      handleExportVisible();
    } else {
      void handleExportAll();
    }
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
              disabled={!visibleItems.length}
            >
              Previsualizacion Ampliada
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportMenuOpen}
              disabled={!visibleItems.length || exporting}
            >
              {" "}
              Descargar lista de precios
            </Button>
            <Menu
              anchorEl={exportAnchor}
              open={Boolean(exportAnchor)}
              onClose={handleExportMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={() => handleExportOption("visible")}>
                <ListItemIcon>
                  <Download fontSize="small" />
                </ListItemIcon>
                <ListItemText>Exportar página visible</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportOption("all")}>
                <ListItemIcon>
                  <Download fontSize="small" />
                </ListItemIcon>
                <ListItemText>Exportar toda la lista</ListItemText>
              </MenuItem>
            </Menu>
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
            visibleItems={visibleItems}
            totalItems={totalItems}
            page={page}
            pageSize={pageSize}
            onPageChange={(nextPage) => setPage(nextPage)}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
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
            visibleItems={visibleItems}
            totalItems={totalItems}
            page={page}
            pageSize={pageSize}
            onPageChange={(nextPage) => setPage(nextPage)}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
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
