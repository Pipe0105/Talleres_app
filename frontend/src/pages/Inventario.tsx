import { useEffect, useMemo, useState } from "react";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";

import { getInventario } from "../api/talleresApi";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { BRANCH_LOCATIONS } from "../data/branchLocations";
import { InventarioItem } from "../types";

const weightFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const normalizeBranch = (raw: string | null | undefined) => {
  if (!raw) return null;
  return BRANCH_LOCATIONS.find((branch) => branch.toLowerCase() === raw.toLowerCase()) ?? null;
};

const Inventario = () => {
  const { user } = useAuth();

  const [selectedBranch, setSelectedBranch] = useState<string>("todas");
  const [selectedSpecies, setSelectedSpecies] = useState<"todas" | "res" | "cerdo">("todas");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const branch = normalizeBranch(user?.sede ?? null);
    if (branch) {
      setSelectedBranch(branch);
    }
  }, [user?.sede]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let isMounted = true;

    const fetchInventario = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getInventario({
          sede: selectedBranch === "todas" ? undefined : selectedBranch,
          search: debouncedSearch || undefined,
          especie: selectedSpecies === "todas" ? undefined : selectedSpecies,
        });

        if (isMounted) {
          setInventario(data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No se pudo cargar el inventario. Intenta nuevamente más tarde.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchInventario();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedBranch, selectedSpecies]);

  const totalKg = useMemo(
    () =>
      inventario.reduce(
        (acc, item) => acc + (typeof item.total_peso === "number" ? item.total_peso : 0),
        0
      ),
    [inventario]
  );

  const [orderBy, setOrderBy] = useState<keyof InventarioItem>("total_peso");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const sortedInventory = useMemo(() => {
    const comparator = (a: InventarioItem, b: InventarioItem) => {
      const valueA = a[orderBy] ?? "";
      const valueB = b[orderBy] ?? "";

      if (typeof valueA === "number" && typeof valueB === "number") {
        return order === "asc" ? valueA - valueB : valueB - valueA;
      }

      return order === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    };

    return [...inventario].sort(comparator);
  }, [inventario, order, orderBy]);

  const paginatedInventory = useMemo(
    () => sortedInventory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedInventory, page, rowsPerPage]
  );

  const handleRequestSort = (property: keyof InventarioItem) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (page > 0 && page * rowsPerPage >= sortedInventory.length) {
      setPage(Math.max(0, Math.ceil(sortedInventory.length / rowsPerPage) - 1));
    }
  }, [page, rowsPerPage, sortedInventory.length]);

  const selectedLabel = selectedBranch === "todas" ? "todas las sedes" : selectedBranch;
  const selectedSpeciesLabel = selectedSpecies === "todas" ? "todas las especies" : selectedSpecies;

  const clearFilters = () => {
    setSelectedBranch("todas");
    setSelectedSpecies("todas");
    setSearch("");
  };

  return (
    <Stack spacing={3} className="animate-fade-up">
      <Paper
        sx={(theme) => ({
          p: {
            xs: theme.spacing(theme.space.sectionPadding.xs),
            md: theme.spacing(theme.space.sectionPadding.md),
          },
        })}
      >
        <PageHeader
          title="Inventario por sede"
          description="Consulta rápidamente cuánto inventario en KG se ha producido por cada producto a partir de los talleres registrados."
          action={
            <Chip
              color="secondary"
              icon={<Inventory2OutlinedIcon />}
              label={`Vista: ${selectedLabel}`}
            />
          }
        />
      </Paper>

      <Paper
        sx={(theme) => ({
          p: {
            xs: theme.spacing(theme.space.sectionPadding.xs),
            md: theme.spacing(theme.space.sectionPadding.md),
          },
        })}
      >
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="branch-filter-label">Sede</InputLabel>
              <Select
                labelId="branch-filter-label"
                value={selectedBranch}
                label="Sede"
                onChange={(event) => setSelectedBranch(event.target.value)}
                inputProps={{ "aria-label": "Filtrar inventario por sede" }}
              >
                <MenuItem value="todas">Todas las sedes</MenuItem>
                {BRANCH_LOCATIONS.map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="species-filter-label">Especie</InputLabel>
              <Select
                labelId="species-filter-label"
                value={selectedSpecies}
                label="Especie"
                onChange={(event) =>
                  setSelectedSpecies(event.target.value as typeof selectedSpecies)
                }
                inputProps={{ "aria-label": "Filtrar inventario por especie" }}
              >
                <MenuItem value="todas">Todas las especies</MenuItem>
                <MenuItem value="res">Res</MenuItem>
                <MenuItem value="cerdo">Cerdo</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Buscar por código o producto"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej: Flank, 3022, posta..."
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Productos en listado
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {inventario.length}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Inventario total (KG)
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {weightFormatter.format(totalKg)}
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          <Divider />

          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Filtros activos:
            </Typography>
            <Chip
              color="primary"
              label={`Sede: ${selectedLabel}`}
              onDelete={selectedBranch !== "todas" ? () => setSelectedBranch("todas") : undefined}
              variant={selectedBranch === "todas" ? "outlined" : "filled"}
            />
            <Chip
              color="secondary"
              label={`Especie: ${selectedSpeciesLabel}`}
              onDelete={selectedSpecies !== "todas" ? () => setSelectedSpecies("todas") : undefined}
              variant={selectedSpecies === "todas" ? "outlined" : "filled"}
            />
            {debouncedSearch && (
              <Chip
                color="default"
                label={`Búsqueda: ${debouncedSearch}`}
                onDelete={() => setSearch("")}
                variant="filled"
              />
            )}
            <Chip
              label="Limpiar filtros"
              onClick={clearFilters}
              variant="outlined"
              sx={{ ml: { xs: 0, md: "auto" } }}
            />
          </Stack>

          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Paper
              variant="outlined"
              sx={(theme) => ({
                borderRadius: 3,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
              })}
            >
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sortDirection={orderBy === "codigo_producto" ? order : false}>
                        <TableSortLabel
                          active={orderBy === "codigo_producto"}
                          direction={orderBy === "codigo_producto" ? order : "asc"}
                          onClick={() => handleRequestSort("codigo_producto")}
                        >
                          Código
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell sortDirection={orderBy === "especie" ? order : false}>
                        <TableSortLabel
                          active={orderBy === "especie"}
                          direction={orderBy === "especie" ? order : "asc"}
                          onClick={() => handleRequestSort("especie")}
                        >
                          Especie
                        </TableSortLabel>
                      </TableCell>
                      <TableCell
                        align="right"
                        sortDirection={orderBy === "total_peso" ? order : false}
                      >
                        <TableSortLabel
                          active={orderBy === "total_peso"}
                          direction={orderBy === "total_peso" ? order : "desc"}
                          onClick={() => handleRequestSort("total_peso")}
                        >
                          Inventario (KG)
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sortDirection={orderBy === "sede" ? order : false}>
                        <TableSortLabel
                          active={orderBy === "sede"}
                          direction={orderBy === "sede" ? order : "asc"}
                          onClick={() => handleRequestSort("sede")}
                        >
                          Sede
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedInventory.map((item) => (
                      <TableRow key={`${item.codigo_producto}-${item.sede ?? "todas"}`} hover>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {item.codigo_producto || "Sin código"}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.descripcion || "Sin descripción"}</TableCell>
                        <TableCell>{item.especie || "—"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {weightFormatter.format(item.total_peso)}
                        </TableCell>
                        <TableCell>{item.sede ?? "Sin sede"}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && sortedInventory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">
                            No hay movimientos de inventario para esta vista.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={sortedInventory.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
                labelRowsPerPage="Filas por página"
              />

              {loading && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ py: 3 }}
                >
                  <CircularProgress size={24} />
                  <Typography>Cargando inventario...</Typography>
                </Stack>
              )}
            </Paper>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default Inventario;
