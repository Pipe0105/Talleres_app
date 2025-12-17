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
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

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
  return (
    BRANCH_LOCATIONS.find(
      (branch) => branch.toLowerCase() === raw.toLowerCase()
    ) ?? null
  );
};

const Inventario = () => {
  const { user } = useAuth();

  const [selectedBranch, setSelectedBranch] = useState<string>("todas");
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
        });

        if (isMounted) {
          setInventario(data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            "No se pudo cargar el inventario. Intenta nuevamente más tarde."
          );
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
  }, [debouncedSearch, selectedBranch]);

  const totalKg = useMemo(
    () =>
      inventario.reduce(
        (acc, item) =>
          acc + (typeof item.total_peso === "number" ? item.total_peso : 0),
        0
      ),
    [inventario]
  );

  const sortedInventory = useMemo(
    () => [...inventario].sort((a, b) => b.total_peso - a.total_peso),
    [inventario]
  );

  const selectedLabel =
    selectedBranch === "todas" ? "todas las sedes" : selectedBranch;

  return (
    <Stack spacing={3} className="animate-fade-up">
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
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

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="branch-filter-label">Sede</InputLabel>
              <Select
                labelId="branch-filter-label"
                value={selectedBranch}
                label="Sede"
                onChange={(event) => setSelectedBranch(event.target.value)}
              >
                <MenuItem value="todas">Todas las sedes</MenuItem>
                {BRANCH_LOCATIONS.map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
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

          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Box sx={{ position: "relative" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Especie</TableCell>
                    <TableCell align="right">Inventario (KG)</TableCell>
                    <TableCell>Sede</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedInventory.map((item) => (
                    <TableRow
                      key={`${item.codigo_producto}-${item.sede ?? "todas"}`}
                    >
                      <TableCell>
                        <Typography fontWeight={600}>
                          {item.codigo_producto || "Sin código"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.descripcion || "Sin descripción"}
                      </TableCell>
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

              {loading && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ py: 4 }}
                >
                  <CircularProgress size={24} />
                  <Typography>Cargando inventario...</Typography>
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default Inventario;
