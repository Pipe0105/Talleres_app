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
  Autocomplete,
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
import {
  adminDeleteTaller,
  adminGetTallerHistorial,
  adminUpdateTaller,
} from "../../api/talleresApi";
import { CrearTallerPayload, TallerAdminResponse } from "../../types";
import { TALLER_MATERIALES } from "../../data/talleres";

interface EditableSubcorte {
  id?: number;
  codigo_producto: string;
  nombre_subcorte: string;
  peso: string;
  item_id?: number | null;
}

interface EditFormState {
  id: number;
  nombre_taller: string;
  descripcion: string;
  sede: string;
  especie: string;
  peso_inicial: string;
  peso_final: string;
  codigo_principal: string;
  item_principal_id?: number | null;
  subcortes: EditableSubcorte[];
}

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

const parseNumber = (value: string): number => {
  const normalized = value.replace(/,/g, ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9_.-]*$/i;

const HistorialTalleres = () => {
  const [filters, setFilters] = useState<FiltersState>(() => ({
    search: "",
    sede: "",
    especie: "",
    startDate: toInputDate(startOfMonth()),
    endDate: toInputDate(endOfMonth()),
    codigoItem: "",
  }));
  const [talleres, setTalleres] = useState<TallerAdminResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TallerAdminResponse | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteQueue, setDeleteQueue] = useState<TallerAdminResponse[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const materialSeleccionado = useMemo(() => {
    if (!editForm) return null;
    return (
      TALLER_MATERIALES.find(
        (material) =>
          material.codigo === editForm.codigo_principal.trim() &&
          material.especie === editForm.especie
      ) ?? null
    );
  }, [editForm?.codigo_principal, editForm?.especie]);

  const subcortesDisponibles = useMemo(
    () => materialSeleccionado?.subcortes ?? [],
    [materialSeleccionado]
  );

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

  const handleOpenEdit = (taller: TallerAdminResponse) => {
    setEditError(null);
    setEditForm({
      id: taller.id,
      nombre_taller: taller.nombre_taller,
      descripcion: taller.descripcion ?? "",
      sede: taller.sede ?? "",
      especie: taller.especie,
      peso_inicial: String(taller.peso_inicial ?? ""),
      peso_final: String(taller.peso_final ?? ""),
      codigo_principal: taller.codigo_principal,
      item_principal_id: taller.item_principal_id ?? undefined,
      subcortes: taller.subcortes.map((detalle) => ({
        id: detalle.id,
        codigo_producto: detalle.codigo_producto,
        nombre_subcorte: detalle.nombre_subcorte,
        peso: String(detalle.peso ?? detalle.peso_normalizado ?? ""),
        item_id: detalle.item_id ?? undefined,
      })),
    });
  };

  const handleChangeSubcorte = (index: number, key: keyof EditableSubcorte, value: string) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const updated = [...prev.subcortes];
      const nextSubcorte = { ...updated[index], [key]: value } as EditableSubcorte;

      updated[index] = nextSubcorte;
      return { ...prev, subcortes: updated };
    });
  };

  const addSubcorte = () => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            subcortes: [
              ...prev.subcortes,
              {
                id: Date.now(),
                codigo_producto: "",
                nombre_subcorte: "",
                peso: "",
              },
            ],
          }
        : prev
    );
  };

  const removeSubcorte = (index: number) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const updated = prev.subcortes.filter((_, i) => i !== index);
      return { ...prev, subcortes: updated };
    });
  };

  const handleSave = async () => {
    if (!editForm) return;

    const pesoInicial = parseNumber(editForm.peso_inicial);
    const pesoFinal = parseNumber(editForm.peso_final);

    if (Number.isNaN(pesoInicial) || Number.isNaN(pesoFinal)) {
      setEditError("Revisa los pesos. Deben ser números válidos.");
      return;
    }
    if (!editForm.codigo_principal.trim()) {
      setEditError("El SKU principal es obligatorio.");
      return;
    }

    if (!SKU_PATTERN.test(editForm.codigo_principal.trim())) {
      setEditError(
        "El SKU principal solo puede contener letras, números, guiones o guiones bajos."
      );
      return;
    }

    if (!editForm.subcortes.length) {
      setEditError("Debes registrar al menos un subcorte con su SKU.");
      return;
    }

    const subcortesPayload: CrearTallerPayload["subcortes"] = [];
    const seenSkus = new Set<string>();

    for (const detalle of editForm.subcortes) {
      const codigo = detalle.codigo_producto.trim();
      const pesoDetalle = parseNumber(detalle.peso);
      if (!codigo || !SKU_PATTERN.test(codigo)) {
        setEditError(
          "Cada subcorte debe tener un SKU válido (letras, números, guiones o guiones bajos)."
        );
        return;
      }

      if (seenSkus.has(codigo.toUpperCase())) {
        setEditError("Los SKU de los subcortes deben ser únicos.");
        return;
      }
      seenSkus.add(codigo.toUpperCase());

      if (codigo.toUpperCase() === editForm.codigo_principal.trim().toUpperCase()) {
        setEditError("El SKU principal no puede repetirse en los subcortes.");
        return;
      }

      if (Number.isNaN(pesoDetalle)) {
        setEditError("Hay subcortes con peso inválido.");
        return;
      }
      if (pesoDetalle < 0) {
        setEditError("Los pesos no pueden ser negativos.");
        return;
      }
      subcortesPayload.push({
        codigo_producto: codigo,
        nombre_subcorte: detalle.nombre_subcorte.trim() || codigo,
        peso: pesoDetalle,
        item_id: detalle.item_id ?? undefined,
      });
    }

    const payload: CrearTallerPayload = {
      nombre_taller: editForm.nombre_taller.trim() || "Taller sin nombre",
      descripcion: editForm.descripcion.trim() || undefined,
      sede: editForm.sede || undefined,
      peso_inicial: pesoInicial,
      peso_final: pesoFinal,
      especie: editForm.especie,
      item_principal_id: editForm.item_principal_id ?? undefined,
      codigo_principal: editForm.codigo_principal.trim(),
      subcortes: subcortesPayload,
    };

    setSaving(true);
    setEditError(null);
    try {
      const updated = await adminUpdateTaller(editForm.id, payload);
      setSuccessMessage("Taller actualizado correctamente.");
      setEditForm(null);
      setSelected(updated);
      await loadHistorial();
    } catch (err) {
      console.error(err);
      setEditError("No se pudo actualizar el taller. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteQueue.length) return;
    const idsToDelete = deleteQueue.map((item) => item.id);
    setSaving(true);
    setDeleteError(null);
    try {
      for (const target of deleteQueue) {
        await adminDeleteTaller(target.id);
      }
      setSuccessMessage(
        deleteQueue.length > 1
          ? "Talleres eliminados correctamente."
          : "Taller eliminado correctamente."
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
          ? "No se pudieron eliminar los talleres. Intenta nuevamente."
          : "No se pudo eliminar el taller. Intenta nuevamente."
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
        description="Consulta, edita o elimina los talleres registrados. Filtra por fechas, sede o código para encontrar rápidamente la información."
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
                  <TableCell align="center">Subcortes</TableCell>
                  <TableCell>Creador</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {talleres.map((taller) => (
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
                    <TableCell sx={{ textTransform: "capitalize" }}>{taller.especie}</TableCell>
                    <TableCell>{taller.codigo_principal}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${taller.subcortes.length} cortes`}
                        size="small"
                        color="default"
                      />
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
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenEdit(taller);
                            }}
                          >
                            <EditIcon fontSize="small" />
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
                ))}
                {!talleres.length && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
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
              selected.especie
            } · ${selected.sede || "Sede no indicada"}`}
            action={
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => handleOpenEdit(selected)}
              >
                Editar registro
              </Button>
            }
          />
          <Divider />
          <CardContent>
            <Stack spacing={2}>
              <Typography color="text.secondary">
                {selected.descripcion || "Sin descripción registrada."}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Peso inicial
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        {selected.peso_inicial} kg
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Peso final
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        {selected.peso_final} kg
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Código principal
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        {selected.codigo_principal}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Subcortes
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
                    {selected.subcortes.map((subcorte) => (
                      <TableRow key={subcorte.id}>
                        <TableCell>{subcorte.nombre_subcorte}</TableCell>
                        <TableCell>{subcorte.codigo_producto}</TableCell>
                        <TableCell>{subcorte.peso} kg</TableCell>
                      </TableRow>
                    ))}
                    {!selected.subcortes.length && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography color="text.secondary">
                            No hay subcortes registrados para este taller.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(editForm)} onClose={() => setEditForm(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HistoryEduIcon color="primary" />
          Editar taller
        </DialogTitle>
        <DialogContent dividers>
          {editForm && (
            <Stack spacing={2}>
              {editError && <Alert severity="error">{editError}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nombre"
                    fullWidth
                    value={editForm.nombre_taller}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, nombre_taller: event.target.value } : prev
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Descripción"
                    fullWidth
                    value={editForm.descripcion}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, descripcion: event.target.value } : prev
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Sede"
                    fullWidth
                    value={editForm.sede}
                    onChange={(event) =>
                      setEditForm((prev) => (prev ? { ...prev, sede: event.target.value } : prev))
                    }
                    SelectProps={{ native: true }}
                  >
                    <option value="">Sin sede</option>
                    {BRANCH_LOCATIONS.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Especie"
                    fullWidth
                    value={editForm.especie}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, especie: event.target.value } : prev
                      )
                    }
                    SelectProps={{ native: true }}
                  >
                    <option value="res">Res</option>
                    <option value="cerdo">Cerdo</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Código principal"
                    fullWidth
                    value={editForm.codigo_principal}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, codigo_principal: event.target.value } : prev
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Peso inicial (kg)"
                    type="number"
                    fullWidth
                    value={editForm.peso_inicial}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, peso_inicial: event.target.value } : prev
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Peso final (kg)"
                    type="number"
                    fullWidth
                    value={editForm.peso_final}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, peso_final: event.target.value } : prev
                      )
                    }
                  />
                </Grid>
              </Grid>

              <Divider />

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">Subcortes</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addSubcorte}
                  variant="outlined"
                  size="small"
                >
                  Agregar
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {materialSeleccionado
                  ? `Opciones basadas en ${materialSeleccionado.nombre} (${materialSeleccionado.codigo}).`
                  : "Ingresa un código principal válido para ver subcortes sugeridos o escribe el nombre manualmente."}
              </Typography>

              <Grid container spacing={2}>
                {editForm.subcortes.map((subcorte, index) => (
                  <Grid item xs={12} key={subcorte.id ?? index}>
                    <Stack spacing={1}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                        <Autocomplete
                          freeSolo
                          fullWidth
                          options={subcortesDisponibles.map((opcion) => opcion.nombre)}
                          value={subcorte.nombre_subcorte || ""}
                          onInputChange={(_, inputValue) =>
                            handleChangeSubcorte(index, "nombre_subcorte", inputValue)
                          }
                          onChange={(_, newValue) => {
                            const nombreSeleccionado = newValue ?? "";
                            handleChangeSubcorte(index, "nombre_subcorte", nombreSeleccionado);

                            const coincidencia = subcortesDisponibles.find(
                              (opcion) => opcion.nombre === newValue
                            );
                            if (!nombreSeleccionado) {
                              handleChangeSubcorte(index, "codigo_producto", "");
                            } else if (coincidencia) {
                              handleChangeSubcorte(index, "codigo_producto", coincidencia.codigo);
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Nombre"
                              placeholder={
                                subcortesDisponibles.length
                                  ? "Selecciona un subcorte"
                                  : "Nombre del subcorte"
                              }
                              fullWidth
                            />
                          )}
                        />
                        <TextField
                          label="Código"
                          value={subcorte.codigo_producto}
                          onChange={(event) =>
                            handleChangeSubcorte(index, "codigo_producto", event.target.value)
                          }
                          fullWidth
                        />
                      </Stack>

                      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                        <TextField
                          label="Peso reportado"
                          type="number"
                          value={subcorte.peso}
                          onChange={(event) =>
                            handleChangeSubcorte(index, "peso", event.target.value)
                          }
                          fullWidth
                          helperText="Usa el valor original de la medición."
                        />
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton
                          aria-label="Eliminar subcorte"
                          color="error"
                          onClick={() => removeSubcorte(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Grid>
                ))}
                {!editForm.subcortes.length && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Añade al menos un subcorte para registrar el taller.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditForm(null)}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteQueue.length)} onClose={() => setDeleteQueue([])}>
        <DialogTitle>Eliminar taller{deleteQueue.length > 1 ? "es" : ""}</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography>
              {deleteQueue.length > 1
                ? "¿Seguro que deseas eliminar los talleres seleccionados?"
                : `¿Seguro que deseas eliminar el taller "${deleteQueue[0]?.nombre_taller}"?`}
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
