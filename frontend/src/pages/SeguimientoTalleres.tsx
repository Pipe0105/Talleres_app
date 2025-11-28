import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";

import PageHeader from "../components/PageHeader";
import { getTallerActividad } from "../api/talleresApi";
import { TallerActividadUsuario } from "../types";

const formatDateInput = (value: Date): string =>
  value.toISOString().slice(0, 10);

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

const SeguimientoTalleres = () => {
  const [startDate, setStartDate] = useState<string>(() =>
    formatDateInput(startOfWeek())
  );
  const [endDate, setEndDate] = useState<string>(() =>
    formatDateInput(endOfWeek(startOfWeek()))
  );
  const [actividad, setActividad] = useState<TallerActividadUsuario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const displayedDates = useMemo(
    () => buildDateRange(startDate, endDate),
    [startDate, endDate]
  );

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
    loadActividad();
  }, [loadActividad]);

  return (
    <Stack spacing={3}>
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
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="Hasta"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="contained"
              type="submit"
              disabled={loading || !displayedDates.length}
            >
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
        />
        <CardContent>
          {!displayedDates.length ? (
            <Alert severity="info">
              Define un rango de fechas válido para visualizar la actividad.
            </Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200, fontSize: "1.4rem" }}>
                    Sede
                  </TableCell>
                  {displayedDates.map((fecha) => {
                    const { label, helper } = formatTableDay(fecha);
                    return (
                      <TableCell key={fecha} align="center">
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
                {actividad.map((usuario) => (
                  <TableRow key={usuario.user_id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" color="text.primary">
                          {resolveSede(usuario)}
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
                            sx={{
                              bgcolor: hasRegistro
                                ? "success.light"
                                : "grey.100",
                              color: hasRegistro
                                ? "success.contrastText"
                                : "text.secondary",
                              borderRadius: 1,
                              px: 1,
                              py: 0.75,
                              border: (theme) =>
                                `1px solid ${
                                  hasRegistro
                                    ? theme.palette.success.main
                                    : theme.palette.grey[200]
                                }`,
                            }}
                          >
                            <Typography variant="subtitle2" display="block">
                              {hasRegistro ? "Con taller" : "Sin registro"}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {hasRegistro
                                ? `${actividadDia.cantidad} en el día`
                                : "—"}
                            </Typography>
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {!actividad.length && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={displayedDates.length + 1}
                      align="center"
                    >
                      <Typography variant="body2" color="text.secondary">
                        No hay usuarios activos para mostrar en este rango.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={displayedDates.length + 1}
                      align="center"
                    >
                      <Typography variant="body2" color="text.secondary">
                        Cargando actividad…
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default SeguimientoTalleres;
