import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import PageHeader from "../../components/PageHeader";
import { getTallerActividad, getTallerActividadDetalle } from "../../api/talleresApi";
import { TallerActividadUsuario, TallerResponse } from "../../types";

const formatDateInput = (value: Date): string => value.toISOString().slice(0, 10);

const startOfWeek = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - distanceToMonday);
  return start;
};

const endOfWeek = (start: Date): Date => {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

const formatTableDay = (value: string): { label: string; helper: string } => {
  const parsed = new Date(value);
  const label = parsed.toLocaleDateString("es-ES", {
    weekday: "short",
  });
  const helper = parsed.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
  return { label, helper };
};

const buildDateRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const limit = new Date(`${end}T00:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(limit.getTime())) {
    return dates;
  }

  while (current <= limit) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const resolveDisplayName = (usuario: TallerActividadUsuario): string =>
  (usuario.full_name?.trim() || usuario.username).trim();

const resolveSede = (usuario: TallerActividadUsuario): string =>
  usuario.sede?.trim() || "Sede no registrada";

const formatFriendlyDate = (value: string | null): string => {
  if (!value) {
    return "";
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

interface DetalleDiaState {
  open: boolean;
  usuario: TallerActividadUsuario | null;
  fecha: string | null;
  talleres: TallerResponse[];
  loading: boolean;
  error: string | null;
}

const resolveActividadKey = (usuario: TallerActividadUsuario): string =>
  `${usuario.user_id}-${resolveSede(usuario)}`;

const SeguimientoTalleres = () => {
  const [startDate, setStartDate] = useState<string>(() => formatDateInput(startOfWeek()));
  const [endDate, setEndDate] = useState<string>(() => formatDateInput(endOfWeek(startOfWeek())));
  const [actividad, setActividad] = useState<TallerActividadUsuario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSedes, setSelectedSedes] = useState<string[]>([]);
  const [detalleDia, setDetalleDia] = useState<DetalleDiaState>({
    open: false,
    usuario: null,
    fecha: null,
    talleres: [],
    loading: false,
    error: null,
  });

  const displayedDates = useMemo(() => buildDateRange(startDate, endDate), [startDate, endDate]);

  const availableSedes = useMemo(() => {
    const sedes = new Set<string>();
    actividad.forEach((usuario) => {
      sedes.add(resolveSede(usuario));
    });
    return Array.from(sedes).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [actividad]);

  const filteredActividad = useMemo(() => {
    if (!selectedSedes.length) {
      return actividad;
    }
    return actividad.filter((usuario) => selectedSedes.includes(resolveSede(usuario)));
  }, [actividad, selectedSedes]);

  const loadActividad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTallerActividad({
        startDate,
        endDate,
      });
      setActividad(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la actividad de talleres.");
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate]);

  const resetToCurrentWeek = () => {
    const start = startOfWeek();
    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(endOfWeek(start)));
  };

  useEffect(() => {
    setSelectedSedes((prev) => prev.filter((sede) => availableSedes.includes(sede)));
  }, [availableSedes]);

  useEffect(() => {
    loadActividad();
  }, [loadActividad]);

  useEffect(() => {
    setDownloadError(null);
  }, [startDate, endDate]);

  const handleCellClick = async (
    usuario: TallerActividadUsuario,
    fecha: string,
    hasRegistro: boolean
  ) => {
    setDetalleDia({
      open: true,
      usuario,
      fecha,
      talleres: [],
      loading: hasRegistro,
      error: null,
    });

    if (!hasRegistro) {
      return;
    }

    try {
      const data = await getTallerActividadDetalle({
        userId: usuario.user_id,
        fecha,
      });
      setDetalleDia((prev) => ({ ...prev, talleres: data }));
    } catch (err) {
      console.error(err);
      setDetalleDia((prev) => ({
        ...prev,
        error: "No se pudieron cargar los talleres registrados para este día.",
      }));
    } finally {
      setDetalleDia((prev) => ({ ...prev, loading: false }));
    }
  };

  const closeDetalleDia = () => {
    setDetalleDia({
      open: false,
      usuario: null,
      fecha: null,
      talleres: [],
      loading: false,
      error: null,
    });
  };

  const renderTable = (tableSize: "small" | "medium" = "small") => {
    if (!displayedDates.length) {
      return (
        <Alert severity="info">
          Define un rango de fechas válido para visualizar la actividad.
        </Alert>
      );
    }

    return (
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Table size={tableSize} sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: { xs: 180, md: 220 }, fontSize: "1.2rem" }}>
                Sede
              </TableCell>
              {displayedDates.map((fecha) => {
                const { label, helper } = formatTableDay(fecha);
                return (
                  <TableCell key={fecha} align="center" sx={{ minWidth: 132 }}>
                    <Typography variant="subtitle1">{label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {helper}
                    </Typography>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredActividad.map((usuario) => (
              <TableRow key={resolveActividadKey(usuario)} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle1" color="text.primary">
                      {resolveSede(usuario)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {resolveDisplayName(usuario)}
                    </Typography>
                  </Stack>
                </TableCell>
                {displayedDates.map((fecha) => {
                  const actividadDia =
                    usuario.dias.find((dia) => dia.fecha === fecha) ??
                    ({ fecha, cantidad: 0 } as const);
                  const hasRegistro = actividadDia.cantidad > 0;
                  return (
                    <TableCell key={fecha} align="center">
                      <Box
                        role="button"
                        tabIndex={0}
                        aria-label={`Ver detalles de ${resolveSede(
                          usuario
                        )} el ${formatFriendlyDate(actividadDia.fecha)}`}
                        onClick={() => handleCellClick(usuario, fecha, hasRegistro)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleCellClick(usuario, fecha, hasRegistro);
                          }
                        }}
                        sx={(theme) => ({
                          bgcolor: hasRegistro ? "success.light" : "grey.100",
                          color: hasRegistro ? "success.contrastText" : "text.secondary",
                          borderRadius: 1,
                          px: { xs: 0.75, sm: 1 },
                          py: { xs: 0.75, sm: 1 },
                          border: `1px solid ${
                            hasRegistro ? theme.palette.success.main : theme.palette.grey[200]
                          }`,
                          cursor: "pointer",
                          transition: "transform 150ms ease, box-shadow 150ms ease",
                          boxShadow: hasRegistro ? "0 1px 6px rgba(0,0,0,0.12)" : undefined,
                          "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                          },
                          "&:focus-visible": {
                            outline: `3px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                            outlineOffset: 3,
                            boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
                          },
                        })}
                      >
                        <Typography variant="subtitle2" display="block">
                          {hasRegistro ? "Con taller" : "Sin registro"}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {hasRegistro ? `${actividadDia.cantidad} en el día` : "—"}
                        </Typography>
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {!filteredActividad.length && !loading && (
              <TableRow>
                <TableCell colSpan={displayedDates.length + 1} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay usuarios activos para mostrar en este rango.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={displayedDates.length + 1} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Cargando actividad…
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    );
  };

  const drawTableImage = (): string | null => {
    if (!displayedDates.length) {
      return null;
    }

    const cellWidth = 150;
    const leftColumnWidth = 260;
    const headerHeight = 72;
    const rowHeight = 64;
    const rowsCount = Math.max(filteredActividad.length, 1);
    const width = leftColumnWidth + displayedDates.length * cellWidth;
    const height = headerHeight + rowsCount * rowHeight;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;

    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, leftColumnWidth, headerHeight);
    ctx.fillStyle = "#111111";
    ctx.font = "bold 16px Inter, Arial, sans-serif";
    ctx.fillText("Sede", 16, headerHeight / 2 + 6);
    ctx.strokeRect(0, 0, leftColumnWidth, headerHeight);

    displayedDates.forEach((fecha, index) => {
      const x = leftColumnWidth + index * cellWidth;
      const { label, helper } = formatTableDay(fecha);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(x, 0, cellWidth, headerHeight);
      ctx.fillStyle = "#111111";
      ctx.font = "bold 14px Inter, Arial, sans-serif";
      ctx.fillText(label, x + 12, headerHeight / 2 - 4);
      ctx.fillStyle = "#555555";
      ctx.font = "12px Inter, Arial, sans-serif";
      ctx.fillText(helper, x + 12, headerHeight / 2 + 14);
      ctx.strokeRect(x, 0, cellWidth, headerHeight);
    });

    const rows =
      filteredActividad.length > 0
        ? filteredActividad
        : ([
            {
              user_id: -1,
              dias: [],
              full_name: "",
              username: "",
              sede: "",
            },
          ] as TallerActividadUsuario[]);

    rows.forEach((usuario, rowIndex) => {
      const y = headerHeight + rowIndex * rowHeight;
      ctx.fillStyle = rowIndex % 2 === 0 ? "#ffffff" : "#fafafa";
      ctx.fillRect(0, y, width, rowHeight);
      ctx.strokeRect(0, y, width, rowHeight);

      ctx.fillStyle = "#111111";
      ctx.font = "14px Inter, Arial, sans-serif";
      ctx.fillText(
        filteredActividad.length ? resolveSede(usuario) : "Sin usuarios activos",
        16,
        y + rowHeight / 2 + 5
      );

      displayedDates.forEach((fecha, columnIndex) => {
        const actividadDia =
          usuario.dias.find((dia) => dia.fecha === fecha) ?? ({ fecha, cantidad: 0 } as const);
        const hasRegistro = actividadDia.cantidad > 0;
        const x = leftColumnWidth + columnIndex * cellWidth;

        ctx.fillStyle = hasRegistro ? "#e8f5e9" : "#f5f5f5";
        ctx.fillRect(x, y, cellWidth, rowHeight);
        ctx.strokeRect(x, y, cellWidth, rowHeight);

        ctx.fillStyle = hasRegistro ? "#2e7d32" : "#616161";
        ctx.font = "13px Inter, Arial, sans-serif";
        ctx.fillText(hasRegistro ? "Con taller" : "Sin registro", x + 12, y + 26);
        ctx.font = "11px Inter, Arial, sans-serif";
        ctx.fillText(hasRegistro ? `${actividadDia.cantidad} en el día` : "—", x + 12, y + 44);
      });
    });

    return canvas.toDataURL("image/png");
  };

  const handleDownloadImage = () => {
    setDownloadError(null);
    const dataUrl = drawTableImage();

    if (!dataUrl) {
      setDownloadError(
        "No se pudo generar la imagen. Revisa el rango de fechas y vuelve a intentarlo."
      );
      return;
    }

    const link = document.createElement("a");
    link.download = `seguimiento-talleres-${startDate}_a_${endDate}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <Stack spacing={3} className="animate-fade-up">
      <PageHeader
        title="Seguimiento de talleres"
        description="Visualiza qué sedes registran talleres cada día y detecta rápidamente las que no tienen actividad."
      />

      <Card>
        <CardHeader
          title="Rango de fechas"
          subheader="Por defecto se muestra la semana en curso, pero puedes ajustar el periodo para validar otras fechas."
          action={
            <Button
              variant="outlined"
              startIcon={<EventRepeatIcon />}
              onClick={resetToCurrentWeek}
              disabled={loading}
            >
              Semana actual
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <Stack
            component="form"
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
            onSubmit={(event) => {
              event.preventDefault();
              loadActividad();
            }}
          >
            <TextField
              label="Desde"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ "aria-label": "Fecha de inicio del rango de seguimiento" }}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Hasta"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ "aria-label": "Fecha final del rango de seguimiento" }}
              sx={{ minWidth: 200 }}
            />
            <Button variant="contained" type="submit" disabled={loading || !displayedDates.length}>
              {loading ? "Cargando..." : "Aplicar filtro"}
            </Button>
          </Stack>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Registro por sede"
          subheader="Cada columna representa un día del rango seleccionado y cada fila una sede o usuario operador."
          action={
            <Button
              variant="outlined"
              startIcon={<ZoomOutMapIcon />}
              onClick={() => setIsModalOpen(true)}
              disabled={!displayedDates.length}
            >
              Ver más grande
            </Button>
          }
        />
        <CardContent>
          <Autocomplete
            multiple
            options={availableSedes}
            value={selectedSedes}
            onChange={(_, value) => setSelectedSedes(value)}
            disableCloseOnSelect
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filtrar por sedes"
                placeholder="Selecciona una o varias sedes"
                inputProps={{
                  ...params.inputProps,
                  "aria-label": "Filtrar por sedes a mostrar en la tabla",
                }}
                helperText="Si no seleccionas ninguna, se mostrarán todas las sedes."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key ?? option} label={option} size="small" {...tagProps} />;
              })
            }
            sx={{ maxWidth: 520, mb: 2 }}
            clearText="Limpiar"
            closeText="Cerrar"
            openText="Abrir"
            noOptionsText="No hay sedes disponibles"
          />
          {renderTable()}
          {downloadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {downloadError}
            </Alert>
          )}
        </CardContent>
      </Card>
      <Dialog fullWidth maxWidth="md" open={detalleDia.open} onClose={closeDetalleDia}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InsightsOutlinedIcon color="primary" />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {detalleDia.usuario
                ? `${resolveSede(detalleDia.usuario)} · ${resolveDisplayName(detalleDia.usuario)}`
                : ""}
            </Typography>
            <Typography variant="h6">
              Talleres del {formatFriendlyDate(detalleDia.fecha)}
            </Typography>
          </Box>
          <Button
            variant="text"
            color="inherit"
            startIcon={<CloseIcon />}
            onClick={closeDetalleDia}
          >
            Cerrar
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {detalleDia.loading && (
            <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 220 }}>
              <CircularProgress size={32} />
              <Typography color="text.secondary">Consultando talleres del día…</Typography>
            </Stack>
          )}
          {!detalleDia.loading && detalleDia.error && (
            <Alert severity="error">{detalleDia.error}</Alert>
          )}
          {!detalleDia.loading &&
            !detalleDia.error &&
            (detalleDia.talleres.length ? (
              <Stack spacing={2}>
                {detalleDia.talleres.map((taller) => {
                  const nombrePrincipal =
                    taller.nombre_taller || taller.codigo_principal || "Corte principal sin nombre";

                  return (
                    <Accordion key={taller.id} variant="outlined" disableGutters>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {nombrePrincipal}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Typography variant="caption" color="text.secondary">
                              Código principal: {taller.codigo_principal || "N/D"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Creado el {formatDateTime(taller.creado_en)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.5}>
                          <Typography color="text.secondary">
                            {taller.descripcion || "Sin descripción registrada."}
                          </Typography>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <Typography variant="body2">
                              <strong>Especie:</strong> {taller.especie}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Peso inicial:</strong> {taller.peso_inicial} kg
                            </Typography>
                            <Typography variant="body2">
                              <strong>Peso final:</strong> {taller.peso_final} kg
                            </Typography>
                            <Typography variant="body2">
                              <strong>Pérdida:</strong> {taller.porcentaje_perdida ?? "N/D"}%
                            </Typography>
                          </Stack>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Subcortes registrados
                            </Typography>
                            {taller.subcortes.length ? (
                              <List dense disablePadding>
                                {taller.subcortes.map((subcorte) => (
                                  <ListItem key={subcorte.id} disableGutters>
                                    <ListItemText
                                      primary={subcorte.nombre_subcorte}
                                      secondary={`Código: ${subcorte.codigo_producto} · Peso: ${subcorte.peso} kg`}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No se registraron subcortes en este taller.
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Stack>
            ) : (
              <Alert severity="info">
                No se registraron talleres para esta sede en la fecha seleccionada.
              </Alert>
            ))}
        </DialogContent>
      </Dialog>
      <Dialog fullWidth maxWidth="xl" open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InsightsOutlinedIcon color="primary" />
          <Box sx={{ flexGrow: 1 }}>Tabla de seguimiento ampliada</Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ overflow: "auto" }}>{renderTable("medium")}</Box>
        </DialogContent>
        <DialogContent>
          <DialogActions>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownloadImage}
              variant="contained"
              disabled={!displayedDates.length}
            >
              Descargar imagen
            </Button>
            <Button startIcon={<CloseIcon />} onClick={() => setIsModalOpen(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default SeguimientoTalleres;
