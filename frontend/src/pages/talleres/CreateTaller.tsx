import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { createTaller } from "../../api/talleresApi";
import {
  Especie,
  MaterialDefinition,
  SubcorteDefinition,
  getMaterialesPorEspecie,
} from "../../data/talleres";

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
  const [subcortesPesos, setSubcortesPesos] = useState<Record<string, string>>(
    {}
  );

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

  const pesoInicialNumero = toNumber(pesoInicial);
  const pesoFinalNumero = toNumber(pesoFinal);
  const totalSubcortes = subcortes.reduce(
    (acc, sc) => acc + toNumber(subcortesPesos[sc.codigo] ?? "0"),
    0
  );
  const totalProcesado = pesoFinalNumero + totalSubcortes;
  const perdida =
    pesoInicialNumero > 0 ? pesoInicialNumero - totalProcesado : 0;
  const porcentajePerdida =
    pesoInicialNumero > 0 ? (perdida / pesoInicialNumero) * 100 : 0;

  const readyForSubcortes =
    pesoInicialGuardado &&
    Boolean(materialSeleccionado) &&
    pesoInicialNumero > 0;

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

  const handleSubmit = async () => {
    if (!materialSeleccionado || !especie) {
      setMensaje({
        tipo: "error",
        texto: "Selecciona especie y material para continuar.",
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
        peso_inicial: pesoInicialNumero,
        peso_final: pesoFinalNumero,
        especie,
        codigo_principal: materialSeleccionado.codigo,
        subcortes: subcortes.map((sc) => ({
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
      setPesoInicial("");
      setPesoFinal("");
      setNombreTaller("");
      setDescripcion("");
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
    <Box sx={{ maxWidth: 1080, margin: "0 auto" }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Crear taller
          </Typography>
          <Typography color="text.secondary">
            Configura el taller seleccionando la especie, el corte principal y
            registra los pesos para calcular la pérdida.
          </Typography>
        </Box>

        {mensaje && (
          <Alert severity={mensaje.tipo} onClose={() => setMensaje(null)}>
            {mensaje.texto}
          </Alert>
        )}

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={3}>
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

              {readyForSubcortes && (
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" gutterBottom fontWeight={700}>
                      Subcortes ({materialSeleccionado?.nombre})
                    </Typography>
                    <Typography color="text.secondary">
                      Ingresa el peso obtenido para cada subcorte
                      preestablecido.
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    {subcortes.map((subcorte) => (
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
              )}

              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={!readyForSubcortes || submitting}
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
