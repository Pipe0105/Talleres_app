import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";

import PageHeader from "../../components/PageHeader";
import { BRANCH_LOCATIONS } from "../../data/branchLocations";
import { adminDeleteTallerGrupo, adminGetTallerHistorial } from "../../api/talleresApi";
import { TallerGrupoAdminResponse } from "../../types";

interface FiltersState {
  search: string;
  sede: string;
  especie: string;
  startDate: string;
  endDate: string;
  codigoItem: string;
}

const toInputDate = (date: Date): string => date.toISOString().slice(0, 10);

const startOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const endOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const getMaterialCodes = (taller: TallerGrupoAdminResponse): string[] =>
  taller.materiales
    .map((material) => material.codigo_principal?.trim())
    .filter((codigo): codigo is string => Boolean(codigo));

const getTotalSubcortes = (taller: TallerGrupoAdminResponse): number =>
  taller.materiales.reduce((total, material) => total + material.subcortes.length, 0);

const HistorialTalleres = () => {
  const [filters, setFilters] = useState<FiltersState>(() => ({
    search: "",
    sede: "",
    especie: "",
    startDate: toInputDate(startOfMonth()),
    endDate: toInputDate(endOfMonth()),
    codigoItem: "",
  }));
  const [talleres, setTalleres] = useState<TallerGrupoAdminResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TallerGrupoAdminResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteQueue, setDeleteQueue] = useState<TallerGrupoAdminResponse[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const loadHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetTallerHistorial({
        search: filters.search || undefined,
        sede: filters.sede || undefined,
        especie: filters.especie || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        codigoItem: filters.codigoItem || undefined,
      });
      setTalleres(data);
      setSelectedIds((prev) => prev.filter((id) => data.some((taller) => taller.id === id)));
      setSelected((prev) => {
        if (!data.length) return null;
        if (prev) {
          const match = data.find((item) => item.id === prev.id);
          if (match) return match;
        }
        return data[0];
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el historial de talleres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistorial();
  }, []);

  const resetFilters = () => {
    setFilters({
      search: "",
      sede: "",
      especie: "",
      startDate: toInputDate(startOfMonth()),
      endDate: toInputDate(endOfMonth()),
      codigoItem: "",
    });
  };

  const handleDelete = async () => {
    if (!deleteQueue.length) return;
    const idsToDelete = deleteQueue.map((item) => item.id);
    setSaving(true);
    setDeleteError(null);
    try {
      for (const target of deleteQueue) {
        await adminDeleteTallerGrupo(target.id);
      }
      setSuccessMessage(
        deleteQueue.length > 1
          ? "Talleres completos eliminados correctamente."
          : "Taller completo eliminado correctamente."
      );
      if (selected && idsToDelete.includes(selected.id)) {
        setSelected(null);
      }
      setSelectedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      await loadHistorial();
      setDeleteQueue([]);
    } catch (err) {
      console.error(err);
      setDeleteError(
        deleteQueue.length > 1
          ? "No se pudieron eliminar los talleres completos. Intenta nuevamente."
          : "No se pudo eliminar el taller completo. Intenta nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalTalleres = useMemo(() => talleres.length, [talleres]);

  return (
    <Stack spacing={3} className="animate-fade-up">
      <PageHeader
        title="Historial de talleres"
        description="Consulta o elimina talleres completos registrados. Filtra por fechas, sede o código para encontrar rápidamente la información."
        action={
          <Chip
            color="primary"
            icon={<HistoryEduIcon />}
            label={`${totalTalleres} talleres`}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        }
      />

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} variant="outlined">
          {successMessage}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Filtros"
          subheader="Ajusta los criterios para ver solo los talleres que necesitas"
          action={
            <Stack direction="row" spacing={1}>
              <Button variant="text" startIcon={<RefreshIcon />} onClick={resetFilters}>
                Limpiar
              </Button>
              <Button
                variant="contained"
                startIcon={<FilterAltIcon />}
                onClick={() => loadHistorial()}
                disabled={loading}
              >
                Aplicar filtros
              </Button>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Buscar"
                placeholder="Nombre, descripción o código"
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: event.target.value,
                  }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Código de item"
                placeholder="Ej. 1234"
                value={filters.codigoItem}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    codigoItem: event.target.value,
                  }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Sede"
                fullWidth
                value={filters.sede}
                onChange={(event) => setFilters((prev) => ({ ...prev, sede: event.target.value }))}
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ "aria-label": "Filtrar talleres por sede" }}
              >
                <option value="">Todas</option>
                {BRANCH_LOCATIONS.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Especie"
                fullWidth
                value={filters.especie}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    especie: event.target.value,
                  }))
                }
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ "aria-label": "Filtrar talleres por especie" }}
              >
                <option value="">Todas</option>
                <option value="res">Res</option>
                <option value="cerdo">Cerdo</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Desde"
                type="date"
                fullWidth
                value={filters.startDate}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ "aria-label": "Fecha inicial del historial" }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Hasta"
                type="date"
                fullWidth
                value={filters.endDate}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ "aria-label": "Fecha final del historial" }}
              />
            </Grid>
          </Grid>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Talleres registrados"
          subheader="Visualiza la lista completa y administra cada registro"
          action={
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              variant="outlined"
              disabled={!selectedIds.length}
              onClick={() => {
                const selectedTalleres = talleres.filter((taller) =>
                  selectedIds.includes(taller.id)
                );
                setDeleteError(null);
                setDeleteQueue(selectedTalleres);
              }}
            >
              Eliminar seleccionados
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <Box sx={{ position: "relative" }}>
            {loading && (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "rgba(255,255,255,0.6)",
                  zIndex: 1,
                }}
              >
                <CircularProgress size={28} />
              </Stack>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && selectedIds.length < talleres.length}
                      checked={!!talleres.length && selectedIds.length === talleres.length}
                      onChange={(event) => {
                        event.stopPropagation();
                        if (selectedIds.length === talleres.length) {
                          setSelectedIds([]);
                        } else {
                          setSelectedIds(talleres.map((taller) => taller.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Sede</TableCell>
                  <TableCell>Especie</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Materiales</TableCell>
                  <TableCell align="center">Subcortes</TableCell>
                  <TableCell>Creador</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {talleres.map((taller) => {
                  const materialCodes = getMaterialCodes(taller);
                  const totalSubcortes = getTotalSubcortes(taller);

                  return (
                    <TableRow
                      key={taller.id}
                      hover
                      selected={selected?.id === taller.id}
                      onClick={() => setSelected(taller)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(taller.id)}
                          onChange={(event) => {
                            event.stopPropagation();
                            setSelectedIds((prev) =>
                              prev.includes(taller.id)
                                ? prev.filter((id) => id !== taller.id)
                                : [...prev, taller.id]
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(taller.creado_en)}</TableCell>
                      <TableCell>{taller.nombre_taller}</TableCell>
                      <TableCell>{taller.sede || "—"}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {taller.especie || "—"}
                      </TableCell>
                      <TableCell>{taller.id}</TableCell>
                      <TableCell>
                        <Tooltip
                          title={
                            materialCodes.length
                              ? materialCodes.join(", ")
                              : "Sin códigos registrados"
                          }
                        >
                          <Chip
                            label={`${taller.materiales.length} materiales`}
                            size="small"
                            color="default"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${totalSubcortes} cortes`} size="small" color="default" />
                      </TableCell>
                      <TableCell>{taller.creado_por || "—"}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Ver detalle">
                            <IconButton
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelected(taller);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteQueue([taller]);
                                setDeleteError(null);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!talleres.length && !loading && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="text.secondary">
                        No hay talleres con los filtros aplicados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader
            title={selected.nombre_taller || "Taller sin nombre"}
            subheader={`Creado el ${formatDateTime(selected.creado_en)} · ${
              selected.especie || "Especie no indicada"
            } · ${selected.sede || "Sede no indicada"}`}
          />
          <Divider />
          <CardContent>
            <Stack spacing={2}>
              <Typography color="text.secondary">
                {selected.descripcion || "Sin descripción registrada."}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`${selected.materiales.length} materiales`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${getTotalSubcortes(selected)} cortes`}
                  color="primary"
                  variant="outlined"
                />
                {selected.creado_por && (
                  <Chip label={`Creador: ${selected.creado_por}`} variant="outlined" />
                )}
              </Stack>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Materiales del taller
                </Typography>
                <Stack spacing={2}>
                  {selected.materiales.map((material) => (
                    <Card key={material.id} variant="outlined">
                      <CardHeader
                        title={material.nombre_taller || material.codigo_principal || "Material"}
                        subheader={`Código: ${material.codigo_principal} · Peso inicial: ${
                          material.peso_inicial
                        } kg · Peso final: ${material.peso_final} kg`}
                      />
                      <Divider />
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Typography color="text.secondary">
                            {material.descripcion || "Sin descripción registrada."}
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Código</TableCell>
                                <TableCell>Peso</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {material.subcortes.map((subcorte) => (
                                <TableRow key={subcorte.id}>
                                  <TableCell>{subcorte.nombre_subcorte}</TableCell>
                                  <TableCell>{subcorte.codigo_producto}</TableCell>
                                  <TableCell>{subcorte.peso} kg</TableCell>
                                </TableRow>
                              ))}
                              {!material.subcortes.length && (
                                <TableRow>
                                  <TableCell colSpan={3} align="center">
                                    <Typography color="text.secondary">
                                      No hay subcortes registrados para este material.
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                  {!selected.materiales.length && (
                    <Alert severity="info">
                      No hay materiales registrados para este taller completo.
                    </Alert>
                  )}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
      <Dialog open={Boolean(deleteQueue.length)} onClose={() => setDeleteQueue([])}>
        <DialogTitle>
          Eliminar taller{deleteQueue.length > 1 ? "es completos" : " completo"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography>
              {deleteQueue.length > 1
                ? "¿Seguro que deseas eliminar los talleres completos seleccionados?"
                : `¿Seguro que deseas eliminar el taller completo "${deleteQueue[0]?.nombre_taller}"?`}
            </Typography>
            {deleteQueue.length > 1 && (
              <Stack spacing={0.5}>
                {deleteQueue.map((taller) => (
                  <Typography key={taller.id} variant="body2">
                    • {taller.nombre_taller || "Taller sin nombre"}
                  </Typography>
                ))}
              </Stack>
            )}
            {deleteError && <Alert severity="error">{deleteError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteQueue([])}>Cancelar</Button>
          <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={saving}>
            {saving ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default HistorialTalleres;
