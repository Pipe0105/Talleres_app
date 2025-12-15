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
import PageHeader from "../components/PageHeader";
import {
  createTaller,
  getCortesPorItem,
  getItems,
  getTallerCalculo,
  getTalleres,
} from "../api/talleresApi";
import {
  CrearTallerPayload,
  TallerCalculoRow,
  TallerListItem,
  Item,
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

const percentFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const TalleresDesposte = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [cortes, setCortes] = useState<corte[]>([]);
  const [pesos, setPesos] = useState<Record<string, number>>({});
  const [calculo, setCalculo] = useState<TallerCalculoRow[]>([]);

  const [pesoInicialInput, setPesoInicialInput] = useState<string>("");
  const [pesoFinalInput, setPesoFinalInput] = useState<string>("");
  const [pesoGuardado, setPesoGuardado] = useState<boolean>(false);

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

  const pesoInicial = useMemo(() => {
    const parsed = Number(pesoInicialInput);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [pesoInicialInput]);

  const pesoFinal = useMemo(() => {
    const parsed = Number(pesoFinalInput);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [pesoFinalInput]);

  const totalPesoSubcortes = useMemo(
    () => cortes.reduce((sum, corte) => sum + (pesos[corte.id] ?? 0), 0),
    [cortes, pesos]
  );

  const porcentajePerdida = useMemo(() => {
    if (!pesoInicial || !pesoFinal) {
      return 0;
    }
    const perdida = ((pesoInicial - pesoFinal) / pesoInicial) * 100;
    return Number.isFinite(perdida) ? perdida : 0;
  }, [pesoInicial, pesoFinal]);

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

  useEffect(() => {
    setPesoGuardado(false);
    setPesoInicialInput("");
    setPesoFinalInput("");
    setCalculo([]);
  }, [selectedItemId]);

  const handlePesoChange = (corteId: string, value: string) => {
    const parsed = Number(value);
    setPesos((prev) => ({
      ...prev,
      [corteId]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleGuardarPesoInicial = () => {
    if (pesoInicial <= 0) {
      setError("Ingrese un peso inicial válido mayor a cero.");
      return;
    }

    setPesoGuardado(true);
    setError(null);

    setPesos((prev) => {
      const next: Record<string, number> = { ...prev };
      cortes.forEach((corte) => {
        next[corte.id] = Number(
          ((pesoInicial * corte.porcentaje_default) / 100).toFixed(2)
        );
      });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedItem) {
      setError("Seleccione un material válido.");
      return;
    }

    if (!pesoGuardado || pesoInicial <= 0) {
      setError("Debe guardar un peso inicial válido antes de continuar.");
      return;
    }

    if (pesoFinal <= 0) {
      setError("Ingrese un peso final válido mayor a cero.");
      return;
    }

    if (!cortes.length) {
      setError("El material seleccionado no tiene cortes configurados.");
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
      peso_inicial: pesoInicial,
      peso_final: pesoFinal,
      porcentaje_perdida: porcentajePerdida,
      cortes: cortesPayload,
    };

    try {
      setSubmitting(true);
      const created = await createTaller(payload);
      setSuccess(`Taller "${created.nombre_taller}" creado exitosamente.`);
      setError(null);
      setCalculo([]);
      setPesoGuardado(false);
      setPesoInicialInput("");
      setPesoFinalInput("");
      setPesos({});
      setSelectedItemId("");

      const [talleresResponse, calculoResponse] = await Promise.all([
        getTalleres(),
        getTallerCalculo(created.id),
      ]);

      setTalleres(talleresResponse);
      setCalculo(calculoResponse);
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el taller. Intente nuevamente.");
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
      setError("No se pudo cargar el cálculo del taller.");
    } finally {
      setLoadingCalculo(false);
    }
  };

  return (
    <Stack spacing={3} className="animate-fade-up">
      <PageHeader
        title="Talleres de desposte"
        description="Registra el peso base del material, distribuye sus subcortes y calcula la pérdida del taller."
      />

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardHeader title="Nuevo taller">
              subheader="Selecciona un material, fija su peso inicial y
              documenta los subcortes."
            </CardHeader>
            <Divider />
            <CardContent>
              <Stack spacing={2}>
                <FormControl fullWidth disabled={loadingItems || submitting}>
                  <InputLabel id="material-select-label">
                    Material Principal
                  </InputLabel>
                  <Select
                    labelId="material-label"
                    label="Material Principal"
                    value={selectedItem}
                    onChange={(event) =>
                      setSelectedItemId(event.target.value as string)
                    }
                  >
                    {items.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)}>
                        {item.descripcion || item.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedItem && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Peso Inicial
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems="flex-start"
                    >
                      <TextField
                        label="Peso antes del taller (kg)"
                        type="number"
                        inputProps={{ min: 0, step: "0.01" }}
                        value={pesoInicialInput}
                        onChange={(event) =>
                          setPesoInicialInput(event.target.value)
                        }
                        disabled={pesoGuardado}
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGuardarPesoInicial}
                        disabled={pesoGuardado}
                      >
                        Guardar
                      </Button>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      El peso inicial bloqueará el campo y servirá para calcular
                      los porcentajes de cada subcorte.
                    </Typography>
                  </Box>
                )}

                {pesoGuardado && (
                  <Stack spacing={2}>
                    <Divider />
                    <Typography variant="h6">Subcortes</Typography>
                    {loadingCortes ? (
                      <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress size={28} />
                      </Box>
                    ) : cortes.length ? (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Corte</TableCell>
                            <TableCell align="right">% esperado</TableCell>
                            <TableCell align="right">Peso sugerido</TableCell>
                            <TableCell align="right">Peso real (kg)</TableCell>
                            <TableCell align="right">% real</TableCell>
                            <TableCell align="right">Δ %</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cortes.map((corte) => {
                            const pesoActual = pesos[corte.id] ?? 0;
                            const pesoSugerido =
                              pesoInicial > 0
                                ? (pesoInicial * corte.porcentaje_default) / 100
                                : 0;
                            const porcentajeReal =
                              pesoInicial > 0
                                ? (pesoActual / pesoInicial) * 100
                                : 0;
                            const delta =
                              porcentajeReal - corte.porcentaje_default;

                            return (
                              <TableRow key={corte.id} hover>
                                <TableCell>{corte.nombre_corte}</TableCell>
                                <TableCell align="right">
                                  {percentFormatter.format(
                                    corte.porcentaje_default
                                  )}
                                  %
                                </TableCell>
                                <TableCell align="right">
                                  {numberFormatter.format(pesoSugerido)} kg
                                </TableCell>
                                <TableCell align="right" sx={{ minWidth: 160 }}>
                                  <TextField
                                    type="number"
                                    size="small"
                                    fullWidth
                                    inputProps={{ min: 0, step: "0.01" }}
                                    value={pesoActual}
                                    onChange={(event) =>
                                      handlePesoChange(
                                        corte.id,
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {percentFormatter.format(porcentajeReal)}%
                                </TableCell>
                                <TableCell align="right">
                                  {percentFormatter.format(delta)}%
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow>
                            <TableCell colSpan={3} align="right">
                              <Typography fontWeight={600}>
                                Total subcortes
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={600}>
                                {numberFormatter.format(totalPesoSubcortes)} kg
                              </Typography>
                            </TableCell>
                            <TableCell align="right" colSpan={2}>
                              <Typography color="text.secondary">
                                % basado en peso inicial
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    ) : (
                      <Alert severity="info">
                        No hay subcortes configurados.
                      </Alert>
                    )}

                    <Divider />
                    <Typography variant="h6">Peso final</Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Peso final del corte (kg)"
                          type="number"
                          inputProps={{ min: 0, step: "0.01" }}
                          value={pesoFinalInput}
                          onChange={(event) =>
                            setPesoFinalInput(event.target.value)
                          }
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            Porcentaje de pérdida
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 800, color: "error.main" }}
                          >
                            {percentFormatter.format(
                              Math.max(porcentajePerdida, 0)
                            )}
                            %
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>

                    <Divider />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? "Guardando..." : "Guardar taller"}
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        El taller guardará el peso inicial, final y todos los
                        subcortes registrados.
                      </Typography>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card>
            <CardHeader
              title="Talleres registrados"
              subheader="Consulta los últimos talleres y revisa su cálculo."
            />
            <Divider />
            <CardContent>
              {loadingItems ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={28} />
                </Box>
              ) : talleres.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell align="right">Peso inicial</TableCell>
                      <TableCell align="right">Pérdida</TableCell>
                      <TableCell align="right">Detalles</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {talleres.map((taller) => (
                      <TableRow key={taller.id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {taller.nombre_taller}
                          </Typography>
                          {taller.descripcion && (
                            <Typography variant="body2" color="text.secondary">
                              {taller.descripcion}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {taller.peso_inicial != null
                            ? `${numberFormatter.format(
                                taller.peso_inicial
                              )} kg`
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {taller.porcentaje_perdida != null
                            ? `${percentFormatter.format(
                                taller.porcentaje_perdida
                              )}%`
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {taller.detalles_count}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => handleViewCalculo(taller.id)}
                            disabled={loadingCalculo}
                          >
                            Ver cálculo
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert severity="info">Aún no hay talleres registrados.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loadingCalculo && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={28} />
        </Box>
      )}

      {calculo.length > 0 && !loadingCalculo && (
        <Card>
          <CardHeader
            title="Detalle de cálculo"
            subheader="Porcentajes calculados con base en el peso inicial registrado."
          />
          <Divider />
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Corte</TableCell>
                  <TableCell align="right">Código</TableCell>
                  <TableCell align="right">Precio venta</TableCell>
                  <TableCell align="right">Peso (kg)</TableCell>
                  <TableCell align="right">% esperado</TableCell>
                  <TableCell align="right">% real</TableCell>
                  <TableCell align="right">Δ %</TableCell>
                  <TableCell align="right">Valor estimado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {calculo.map((row) => (
                  <TableRow key={`${row.taller_id}-${row.nombre_corte}`} hover>
                    <TableCell>{row.nombre_corte}</TableCell>
                    <TableCell align="right">{row.item_code}</TableCell>
                    <TableCell align="right">
                      {currencyFormatter.format(row.precio_venta)}
                    </TableCell>
                    <TableCell align="right">
                      {numberFormatter.format(row.peso)} kg
                    </TableCell>
                    <TableCell align="right">
                      {percentFormatter.format(row.porcentaje_default)}%
                    </TableCell>
                    <TableCell align="right">
                      {percentFormatter.format(row.porcentaje_real)}%
                    </TableCell>
                    <TableCell align="right">
                      {percentFormatter.format(row.delta_pct)}%
                    </TableCell>
                    <TableCell align="right">
                      {currencyFormatter.format(row.valor_estimado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};

export default TalleresDesposte;
