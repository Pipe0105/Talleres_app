import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
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
import { useEffect, useMemo, useState } from "react";

import {
  createTaller,
  getCortesPorItem,
  getItems,
  getTallerCalculo,
  getTalleres,
} from "../api/talleresApi";
import PageHeader from "../components/PageHeader";
import {
  CrearTallerPayload,
  Item,
  TallerCalculoRow,
  TallerListItem,
  corte,
} from "../types";

const numberFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const TalleresDesposte = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [cortes, setCortes] = useState<corte[]>([]);
  const [pesos, setPesos] = useState<Record<string, number>>({});
  const [calculo, setCalculo] = useState<TallerCalculoRow[]>([]);

  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingCortes, setLoadingCortes] = useState(false);
  const [loadingCalculo, setLoadingCalculo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => String(item.id) === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        setLoadingItems(true);
        const [itemsResponse, talleresResponse] = await Promise.all([
          getItems(),
          getTalleres(),
        ]);

        if (!isMounted) return;

        setItems(itemsResponse);
        setTalleres(talleresResponse);
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No se pudieron cargar los materiales y talleres.");
        }
      } finally {
        if (isMounted) {
          setLoadingItems(false);
        }
      }
    };

    void fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedItemId) {
      setCortes([]);
      setPesos({});
      return;
    }

    let isMounted = true;

    const fetchCortes = async () => {
      try {
        setLoadingCortes(true);
        const response = await getCortesPorItem(selectedItemId);
        if (!isMounted) return;

        setCortes(response);
        setPesos((prev) => {
          const next: Record<string, number> = {};
          response.forEach((corte) => {
            const existing = prev[corte.id];
            next[corte.id] = typeof existing === "number" ? existing : 0;
          });
          return next;
        });
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            "No se pudieron cargar los cortes para el material seleccionado."
          );
          setCortes([]);
          setPesos({});
        }
      } finally {
        if (isMounted) {
          setLoadingCortes(false);
        }
      }
    };

    void fetchCortes();

    return () => {
      isMounted = false;
    };
  }, [selectedItemId]);

  const handlePesoChange = (corteId: string, value: string) => {
    const parsed = Number(value);
    setPesos((prev) => ({
      ...prev,
      [corteId]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const totalPeso = useMemo(
    () => cortes.reduce((sum, corte) => sum + (pesos[corte.id] ?? 0), 0),
    [cortes, pesos]
  );

  const handleSubmit = async () => {
    if (!selectedItem) {
      setError("Selecciona un material antes de guardar el taller.");
      return;
    }

    const cortesPayload: CrearTallerPayload["cortes"] = cortes.map((corte) => ({
      item_id: selectedItem.id,
      corte_id: corte.id,
      peso: pesos[corte.id] ?? 0,
    }));

    const payload: CrearTallerPayload = {
      nombre_taller: selectedItem.descripcion || selectedItem.nombre,
      descripcion: selectedItem.descripcion,
      cortes: cortesPayload,
    };

    try {
      setSubmitting(true);
      const created = await createTaller(payload);
      setSuccess(`Taller "${created.nombre_taller}" registrado correctamente.`);
      setError(null);
      setCalculo([]);

      const [talleresResponse, calculoResponse] = await Promise.all([
        getTalleres(),
        getTallerCalculo(created.id),
      ]);

      setTalleres(talleresResponse);
      setCalculo(calculoResponse);
    } catch (err) {
      console.error(err);
      setError("No se pudo registrar el taller. Inténtalo nuevamente.");
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCalculo = async (tallerId: string) => {
    try {
      setLoadingCalculo(true);
      const calculoResponse = await getTallerCalculo(tallerId);
      setCalculo(calculoResponse);
      setSuccess(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el cálculo del taller seleccionado.");
    } finally {
      setLoadingCalculo(false);
    }
  };

  return (
    <Stack spacing={3} className="animate-fade-up">
      <PageHeader
        title="Talleres de desposte"
        description="Registra los pesos reales de cada corte partiendo de un material base y consulta los rendimientos y valores estimados."
      />

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader
              title="Registrar taller"
              subheader="Selecciona un material de la lista oficial, carga los pesos reales de cada corte y guarda el taller."
            />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                <FormControl fullWidth disabled={loadingItems || submitting}>
                  <InputLabel id="material-select-label">Material</InputLabel>
                  <Select
                    labelId="material-select-label"
                    label="Material"
                    value={selectedItemId}
                    onChange={(event) => setSelectedItemId(event.target.value)}
                  >
                    {items.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)}>
                        <Stack spacing={0.25}>
                          <Typography fontWeight={700}>
                            {item.descripcion}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Código: {item.codigo_producto} · Especie:{" "}
                            {item.especie}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedItem && (
                  <Alert severity="info">
                    {selectedItem.descripcion} — Código{" "}
                    {selectedItem.codigo_producto}
                  </Alert>
                )}

                <Divider />

                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      Cortes configurados
                    </Typography>
                    {loadingCortes && <CircularProgress size={24} />}
                  </Stack>

                  {!selectedItemId && (
                    <Alert severity="warning">
                      Selecciona un material para cargar sus cortes
                      configurados.
                    </Alert>
                  )}

                  {selectedItemId && !loadingCortes && cortes.length === 0 && (
                    <Alert severity="warning">
                      No se encontraron cortes configurados para este material.
                    </Alert>
                  )}

                  {cortes.length > 0 && (
                    <Box sx={{ overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Nombre del corte</TableCell>
                            <TableCell align="right">% default</TableCell>
                            <TableCell align="right">Peso (kg)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cortes.map((corte) => (
                            <TableRow key={corte.id}>
                              <TableCell>
                                <Typography fontWeight={700}>
                                  {corte.nombre_corte}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {numberFormatter.format(
                                  corte.porcentaje_default
                                )}
                                %
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 160 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  inputProps={{ min: 0, step: 0.1 }}
                                  value={pesos[corte.id] ?? ""}
                                  onChange={(event) =>
                                    handlePesoChange(
                                      corte.id,
                                      event.target.value
                                    )
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}

                  <Stack direction="row" justifyContent="flex-end">
                    <Typography fontWeight={700}>
                      Peso total: {numberFormatter.format(totalPeso)} kg
                    </Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    disabled={!selectedItemId || submitting}
                    onClick={() => {
                      setPesos({});
                      setCalculo([]);
                    }}
                  >
                    Limpiar pesos
                  </Button>
                  <Button
                    variant="contained"
                    disabled={
                      !selectedItemId || cortes.length === 0 || submitting
                    }
                    onClick={handleSubmit}
                  >
                    {submitting ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Guardar taller"
                    )}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            <Card>
              <CardHeader
                title="Talleres registrados"
                subheader="Consulta rápidamente los talleres creados y sus pesos totales."
              />
              <Divider />
              <CardContent>
                {loadingItems ? (
                  <Stack alignItems="center" py={4}>
                    <CircularProgress />
                  </Stack>
                ) : talleres.length === 0 ? (
                  <Alert severity="info">
                    Aún no hay talleres registrados.
                  </Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {talleres.map((taller) => (
                      <Box
                        key={taller.id}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          p: 1.5,
                        }}
                      >
                        <Typography fontWeight={700}>
                          {taller.nombre_taller}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {taller.descripcion}
                        </Typography>
                        <Stack direction="row" spacing={2} mt={0.5}>
                          <Typography variant="body2">
                            Peso total:{" "}
                            {numberFormatter.format(taller.total_peso)} kg
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Detalles: {taller.detalles_count}
                          </Typography>
                        </Stack>
                        <Button
                          size="small"
                          sx={{ mt: 1 }}
                          disabled={loadingCalculo}
                          onClick={() => handleViewCalculo(taller.id)}
                        >
                          {loadingCalculo ? (
                            <CircularProgress size={18} />
                          ) : (
                            "Ver cálculo"
                          )}
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {calculo.length > 0 && (
              <Card>
                <CardHeader
                  title="Cálculo del taller"
                  subheader="Revisa rendimientos, desvíos y valores estimados según los pesos reales."
                />
                <Divider />
                <CardContent>
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Corte</TableCell>
                          <TableCell align="right">% default</TableCell>
                          <TableCell align="right">% real</TableCell>
                          <TableCell align="right">Δ %</TableCell>
                          <TableCell align="right">Peso</TableCell>
                          <TableCell align="right">Valor estimado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {calculo.map((row) => (
                          <TableRow
                            key={`${row.taller_id}-${row.nombre_corte}`}
                          >
                            <TableCell>
                              <Typography fontWeight={700}>
                                {row.nombre_corte}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {row.descripcion} · Código {row.item_code}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {numberFormatter.format(row.porcentaje_default)}%
                            </TableCell>
                            <TableCell align="right">
                              {numberFormatter.format(row.porcentaje_real)}%
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color:
                                  row.delta_pct < 0
                                    ? "error.main"
                                    : "success.main",
                              }}
                            >
                              {numberFormatter.format(row.delta_pct)}%
                            </TableCell>
                            <TableCell align="right">
                              {numberFormatter.format(row.peso)} kg
                            </TableCell>
                            <TableCell align="right">
                              {currencyFormatter.format(row.valor_estimado)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default TalleresDesposte;
