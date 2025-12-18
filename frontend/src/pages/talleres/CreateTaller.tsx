import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Assessment, CheckCircle, SaveRounded } from "@mui/icons-material";

import { createTaller } from "../../api/talleresApi";
import { BRANCH_LOCATIONS } from "../../data/branchLocations";
import {
  Especie,
  MaterialDefinition,
  SubcorteDefinition,
  getMaterialesPorEspecie,
} from "../../data/talleres";
import { useAuth } from "../../context/AuthContext";

const toNumber = (value: string): number => {
  const parsed = Number(value.replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatKg = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const CreateTaller = () => {
  const [especie, setEspecie] = useState<Especie | "">("");
  const [codigoMaterial, setCodigoMaterial] = useState<string>("");
  const [pesoInicial, setPesoInicial] = useState<string>("");
  const [pesoFinal, setPesoFinal] = useState<string>("");
  const [nombreTaller, setNombreTaller] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [mensaje, setMensaje] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pesoInicialGuardado, setPesoInicialGuardado] = useState(false);
  const [subcortesSeleccionados, setSubcortesSeleccionados] = useState<
    string[]
  >([]);
  const [seleccionSubcortesGuardada, setSeleccionSubcortesGuardada] =
    useState(false);
  const [subcortesPesos, setSubcortesPesos] = useState<Record<string, string>>(
    {}
  );
  const [sede, setSede] = useState<string>("");

  const { user } = useAuth();
  const isAdmin = Boolean(user?.is_admin);

  useEffect(() => {
    if (!isAdmin && user?.sede) {
      setSede(user.sede);
    }
  }, [isAdmin, user?.sede]);

  const materiales = useMemo(() => {
    if (!especie) return [];
    return getMaterialesPorEspecie(especie as Especie);
  }, [especie]);

  const materialSeleccionado = useMemo<MaterialDefinition | undefined>(
    () => materiales.find((m) => m.codigo === codigoMaterial),
    [materiales, codigoMaterial]
  );

  const subcortes = useMemo<SubcorteDefinition[]>(
    () => materialSeleccionado?.subcortes ?? [],
    [materialSeleccionado]
  );

  const subcortesActivos = useMemo<SubcorteDefinition[]>(
    () =>
      subcortes.filter((subcorte) =>
        subcortesSeleccionados.includes(subcorte.codigo)
      ),
    [subcortes, subcortesSeleccionados]
  );

  const pesoInicialNumero = toNumber(pesoInicial);
  const pesoFinalNumero = toNumber(pesoFinal);
  const totalSubcortes = subcortesActivos.reduce((acc, sc) => {
    return acc + toNumber(subcortesPesos[sc.codigo] ?? "0");
  }, 0);
  const totalProcesado = pesoFinalNumero + totalSubcortes;
  const perdida =
    pesoInicialNumero > 0 ? pesoInicialNumero - totalProcesado : 0;
  const porcentajePerdida =
    pesoInicialNumero > 0 ? (perdida / pesoInicialNumero) * 100 : 0;

  const readyForSubcortes =
    pesoInicialGuardado &&
    Boolean(materialSeleccionado) &&
    pesoInicialNumero > 0;

  const readyToSubmit =
    readyForSubcortes &&
    seleccionSubcortesGuardada &&
    subcortesActivos.length > 0;

  const handleGuardarPesoInicial = () => {
    if (!materialSeleccionado || pesoInicialNumero <= 0) {
      setMensaje({
        tipo: "error",
        texto: "Selecciona un material y un peso inicial mayor a cero.",
      });
      return;
    }
    setMensaje(null);
    setPesoInicialGuardado(true);
  };

  const handleToggleSubcorte = (codigo: string) => {
    setSeleccionSubcortesGuardada(false);
    setSubcortesSeleccionados((prev) =>
      prev.includes(codigo)
        ? prev.filter((item) => item !== codigo)
        : [...prev, codigo]
    );
  };

  const handleGuardarSubcortes = () => {
    if (!subcortesSeleccionados.length) {
      setMensaje({
        tipo: "error",
        texto: "Selecciona al menos un subcorte para continuar.",
      });
      return;
    }

    setMensaje(null);
    setSeleccionSubcortesGuardada(true);
    setSubcortesPesos((prev) => {
      const updated: Record<string, string> = {};
      subcortesSeleccionados.forEach((codigo) => {
        if (prev[codigo]) {
          updated[codigo] = prev[codigo];
        }
      });
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!materialSeleccionado || !especie) {
      setMensaje({
        tipo: "error",
        texto: "Selecciona especie y material para continuar.",
      });
      return;
    }

    if (!seleccionSubcortesGuardada || !subcortesActivos.length) {
      setMensaje({
        tipo: "error",
        texto: "Selecciona y guarda al menos un subcorte para registrar.",
      });
      return;
    }

    setSubmitting(true);
    setMensaje(null);

    try {
      await createTaller({
        nombre_taller:
          nombreTaller.trim() || `Taller de ${materialSeleccionado.nombre}`,
        descripcion: descripcion || undefined,
        sede: isAdmin ? sede || undefined : undefined,
        peso_inicial: pesoInicialNumero,
        peso_final: pesoFinalNumero,
        especie,
        codigo_principal: materialSeleccionado.codigo,
        subcortes: subcortesActivos.map((sc) => ({
          codigo_producto: sc.codigo,
          nombre_subcorte: sc.nombre,
          peso: toNumber(subcortesPesos[sc.codigo] ?? "0"),
        })),
      });

      setMensaje({
        tipo: "success",
        texto: "Taller guardado correctamente.",
      });
      setPesoInicialGuardado(false);
      setSubcortesPesos({});
      setSubcortesSeleccionados([]);
      setSeleccionSubcortesGuardada(false);
      setPesoInicial("");
      setPesoFinal("");
      setNombreTaller("");
      setDescripcion("");
      setSede(isAdmin ? "" : user?.sede ?? "");
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: "No se pudo guardar el taller. Intenta nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 1200,
        margin: "0 auto",
        py: 4,
        px: { xs: 2, sm: 3 },
        background:
          "radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.08), transparent 30%), radial-gradient(circle at 80% 0%, rgba(16, 185, 129, 0.12), transparent 25%)",
      }}
    >
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Crear taller
            </Typography>
            <Typography color="text.secondary">
              Configura el taller seleccionando la especie, el corte principal y
              registra los pesos para calcular la pérdida.
            </Typography>
          </Box>

          <Chip
            icon={<CheckCircle />}
            label="Pasos guiados"
            color="success"
            variant="outlined"
            sx={{
              fontWeight: 700,
              bgcolor: "rgba(16, 185, 129, 0.08)",
              borderColor: "rgba(16, 185, 129, 0.3)",
            }}
          />
        </Box>

        {mensaje && (
          <Alert severity={mensaje.tipo} onClose={() => setMensaje(null)}>
            {mensaje.texto}
          </Alert>
        )}

        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            borderColor: "rgba(0,0,0,0.04)",
            boxShadow:
              "0 20px 80px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Stack spacing={4}>
              <Grid container spacing={2}>
                {[
                  "Define la especie",
                  "Añade el material",
                  "Registra los pesos",
                ].map((step, index) => (
                  <Grid item xs={12} md={4} key={step}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderRadius: 3,
                        borderColor: "rgba(99, 102, 241, 0.15)",
                        bgcolor: "rgba(99, 102, 241, 0.04)",
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 800,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography fontWeight={700}>{step}</Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Especie"
                    value={especie}
                    onChange={(e) => {
                      setEspecie(e.target.value as Especie);
                      setCodigoMaterial("");
                      setPesoInicialGuardado(false);
                      setSubcortesPesos({});
                      setSubcortesSeleccionados([]);
                      setSeleccionSubcortesGuardada(false);
                    }}
                  >
                    <MenuItem value="res">Res (vacuno)</MenuItem>
                    <MenuItem value="cerdo">Cerdo (porcino)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    disabled={!especie}
                    label="Material principal"
                    value={codigoMaterial}
                    onChange={(e) => {
                      setCodigoMaterial(e.target.value);
                      setPesoInicialGuardado(false);
                      setSubcortesPesos({});
                      setSubcortesSeleccionados([]);
                      setSeleccionSubcortesGuardada(false);
                    }}
                  >
                    {materiales.map((material) => (
                      <MenuItem key={material.codigo} value={material.codigo}>
                        {material.nombre} ({material.codigo})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre del taller"
                    placeholder="Ej. Taller Costilla 10/10"
                    value={nombreTaller}
                    onChange={(e) => setNombreTaller(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    placeholder="Notas o detalle del taller"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </Grid>
                {isAdmin && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Sede del taller"
                      value={sede}
                      onChange={(e) => setSede(e.target.value)}
                      helperText="Solo visible para administradores"
                    >
                      <MenuItem value="">Selecciona la sede</MenuItem>
                      {BRANCH_LOCATIONS.map((branch) => (
                        <MenuItem key={branch} value={branch}>
                          {branch}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    label="Peso inicial (kg)"
                    value={pesoInicial}
                    onChange={(e) => setPesoInicial(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6} display="flex" alignItems="center">
                  <Button
                    variant="contained"
                    fullWidth
                    color="primary"
                    disabled={!materialSeleccionado || pesoInicialNumero <= 0}
                    onClick={handleGuardarPesoInicial}
                  >
                    Guardar peso inicial
                  </Button>
                </Grid>
              </Grid>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      bgcolor: "rgba(16, 185, 129, 0.05)",
                      borderColor: "rgba(16, 185, 129, 0.18)",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1}>
                        <Typography color="success.main" fontWeight={700}>
                          Peso inicial
                        </Typography>
                        <Typography variant="h5" fontWeight={800}>
                          {pesoInicial
                            ? `${formatKg(pesoInicialNumero)} kg`
                            : "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Guarda este valor para habilitar los subcortes.
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      bgcolor: "rgba(59, 130, 246, 0.05)",
                      borderColor: "rgba(59, 130, 246, 0.18)",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Assessment fontSize="small" color="primary" />
                          <Typography color="primary" fontWeight={700}>
                            Proceso actual
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight={800}>
                          {formatKg(totalProcesado)} kg
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Subcortes + corte final registrados.
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      bgcolor: "rgba(239, 68, 68, 0.05)",
                      borderColor: "rgba(239, 68, 68, 0.18)",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CheckCircle fontSize="small" color="error" />
                          <Typography color="error" fontWeight={700}>
                            Pérdida estimada
                          </Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight={800} color="error">
                          {formatKg(perdida)} kg
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {porcentajePerdida.toFixed(2)}% del peso inicial.
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {readyForSubcortes && (
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" gutterBottom fontWeight={700}>
                      Subcortes ({materialSeleccionado?.nombre})
                    </Typography>
                    <Typography color="text.secondary">
                      Selecciona los subcortes disponibles, guarda tu selección
                      y luego registra los pesos obtenidos.
                    </Typography>
                  </Box>

                  {seleccionSubcortesGuardada ? (
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      alignItems={{ xs: "stretch", md: "center" }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>
                          Selección guardada ({subcortesSeleccionados.length}{" "}
                          subcorte(s))
                        </Typography>
                        <Chip
                          label="Checklist listo"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </Stack>

                      <Box flexGrow={1} />

                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => setSeleccionSubcortesGuardada(false)}
                      >
                        Editar selección
                      </Button>
                    </Stack>
                  ) : (
                    <Stack spacing={2}>
                      <Grid container spacing={2}>
                        {subcortes.map((subcorte) => (
                          <Grid
                            item
                            xs={12}
                            md={6}
                            lg={4}
                            key={subcorte.codigo}
                          >
                            <Card
                              variant="outlined"
                              sx={{
                                height: "100%",
                                borderRadius: 2,
                                borderColor: subcortesSeleccionados.includes(
                                  subcorte.codigo
                                )
                                  ? "success.light"
                                  : "rgba(0,0,0,0.06)",
                                bgcolor: subcortesSeleccionados.includes(
                                  subcorte.codigo
                                )
                                  ? "rgba(16, 185, 129, 0.06)"
                                  : "background.paper",
                              }}
                            >
                              <CardContent sx={{ py: 1.5 }}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={subcortesSeleccionados.includes(
                                        subcorte.codigo
                                      )}
                                      onChange={() =>
                                        handleToggleSubcorte(subcorte.codigo)
                                      }
                                    />
                                  }
                                  label={
                                    <Stack spacing={0.5}>
                                      <Typography fontWeight={700}>
                                        {subcorte.nombre}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {subcorte.codigo}
                                      </Typography>
                                    </Stack>
                                  }
                                />
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", md: "center" }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={700}>
                            {subcortesSeleccionados.length} subcorte(s)
                            seleccionado(s)
                          </Typography>
                          {seleccionSubcortesGuardada && (
                            <Chip
                              label="Selección guardada"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>

                        <Box flexGrow={1} />

                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={handleGuardarSubcortes}
                          disabled={!subcortesSeleccionados.length}
                        >
                          Guardar selección
                        </Button>
                      </Stack>
                    </Stack>
                  )}

                  {seleccionSubcortesGuardada ? (
                    <Stack spacing={2}>
                      <Grid container spacing={2}>
                        {subcortesActivos.map((subcorte) => (
                          <Grid item xs={12} md={6} key={subcorte.codigo}>
                            <TextField
                              fullWidth
                              type="number"
                              inputProps={{ min: 0, step: "0.01" }}
                              label={`${subcorte.nombre} (${subcorte.codigo})`}
                              value={subcortesPesos[subcorte.codigo] ?? ""}
                              onChange={(e) =>
                                setSubcortesPesos((prev) => ({
                                  ...prev,
                                  [subcorte.codigo]: e.target.value,
                                }))
                              }
                            />
                          </Grid>
                        ))}
                      </Grid>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            type="number"
                            inputProps={{ min: 0, step: "0.01" }}
                            label="Peso final del corte (kg)"
                            value={pesoFinal}
                            onChange={(e) => setPesoFinal(e.target.value)}
                          />
                        </Grid>
                      </Grid>

                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="error"
                        >
                          Pérdida: {formatKg(perdida)} kg (
                          {porcentajePerdida.toFixed(2)}%)
                        </Typography>
                        <Typography color="text.secondary">
                          Total subcortes: {formatKg(totalSubcortes)} kg · Peso
                          final: {formatKg(pesoFinalNumero)} kg
                        </Typography>
                      </Box>
                    </Stack>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Selecciona y guarda los subcortes para habilitar los
                      campos de registro de peso.
                    </Alert>
                  )}
                </Stack>
              )}

              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={!readyToSubmit || submitting}
                  startIcon={<SaveRounded />}
                  onClick={handleSubmit}
                >
                  {submitting ? "Guardando..." : "Guardar taller"}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default CreateTaller;
