import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AddCircleOutline, CheckCircle, PlaylistAdd, SaveRounded } from "@mui/icons-material";

import { createTallerCompleto } from "../../api/talleresApi";
import { BRANCH_LOCATIONS } from "../../data/branchLocations";
import {
  Especie,
  MaterialDefinition,
  SubcorteDefinition,
  getMaterialesPorEspecie,
} from "../../data/talleres";
import { useAuth } from "../../context/AuthContext";

import SelectableSubcorteCard from "../../components/taller/SelectableSubcorteCard";
import WeightSummaryCards from "../../components/taller/WeightSummaryCards";
import {
  formatKg,
  formatPercent,
  isNegativeInputValue,
  normalizeZero,
  parseWeightInput,
} from "../../utils/weights";

interface TallerPlusMaterial {
  id: string;
  especie: Especie;
  codigoMaterial: string;
  materialNombre: string;
  pesoInicial: number;
  pesoFinal: number;
  sede?: string;
  subcortes: {
    codigo: string;
    nombre: string;
    peso: number;
  }[];
  perdida: number;
  porcentajePerdida: number;
}

const buildId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const TalleresPlus = () => {
  const [especie, setEspecie] = useState<Especie | "">("");
  const [codigoMaterial, setCodigoMaterial] = useState<string>("");
  const [materialSearch, setMaterialSearch] = useState<string>("");
  const [pesoInicial, setPesoInicial] = useState<string>("");
  const [pesoFinal, setPesoFinal] = useState<string>("");
  const [sede, setSede] = useState<string>("");
  const [mensaje, setMensaje] = useState<null | {
    tipo: "success" | "error" | "info";
    texto: string;
  }>(null);
  const [pesoInicialGuardado, setPesoInicialGuardado] = useState(false);
  const [subcortesSeleccionados, setSubcortesSeleccionados] = useState<string[]>([]);
  const [seleccionSubcortesGuardada, setSeleccionSubcortesGuardada] = useState(false);
  const [subcortesPesos, setSubcortesPesos] = useState<Record<string, string>>({});
  const [materialesGuardados, setMaterialesGuardados] = useState<TallerPlusMaterial[]>([]);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [negativeLossModal, setNegativeLossModal] = useState<null | string>(null);

  const { user } = useAuth();
  const isManager = Boolean(user?.is_admin || user?.is_gerente);

  useEffect(() => {
    if (!isManager && user?.sede) {
      setSede(user.sede);
    }
  }, [isManager, user?.sede]);

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
    () => subcortes.filter((subcorte) => subcortesSeleccionados.includes(subcorte.codigo)),
    [subcortes, subcortesSeleccionados]
  );

  const pesoInicialNumero = parseWeightInput(pesoInicial);
  const pesoFinalNumero = parseWeightInput(pesoFinal);
  const totalSubcortes = subcortesActivos.reduce((acc, sc) => {
    return acc + parseWeightInput(subcortesPesos[sc.codigo] ?? "0");
  }, 0);
  const totalProcesado = pesoFinalNumero + totalSubcortes;
  const perdida = pesoInicialNumero > 0 ? normalizeZero(pesoInicialNumero - totalProcesado) : 0;
  const porcentajePerdida =
    pesoInicialNumero > 0 ? normalizeZero((perdida / pesoInicialNumero) * 100) : 0;

  const readyForSubcortes =
    pesoInicialGuardado && Boolean(materialSeleccionado) && pesoInicialNumero > 0;

  const readyToQueueMaterial =
    readyForSubcortes && seleccionSubcortesGuardada && subcortesActivos.length > 0;

  const resetFormularioMaterial = () => {
    setCodigoMaterial("");
    setMaterialSearch("");
    setPesoInicialGuardado(false);
    setSubcortesPesos({});
    setSubcortesSeleccionados([]);
    setSeleccionSubcortesGuardada(false);
    setPesoInicial("");
    setPesoFinal("");
  };

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
      prev.includes(codigo) ? prev.filter((item) => item !== codigo) : [...prev, codigo]
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

  const handleGuardarMaterial = () => {
    if (!materialSeleccionado || !especie) {
      setMensaje({
        tipo: "error",
        texto: "Selecciona especie y material para continuar.",
      });
      return;
    }

    if (!readyToQueueMaterial) {
      setMensaje({
        tipo: "error",
        texto: "Selecciona y guarda al menos un subcorte para añadir el material.",
      });
      return;
    }

    if (porcentajePerdida < 0) {
      setNegativeLossModal(
        "El porcentaje de pérdida no puede ser negativo. Revisa los pesos para poder guardar el material."
      );
      return;
    }

    setSavingMaterial(true);
    setMensaje(null);

    const nuevoMaterial: TallerPlusMaterial = {
      id: buildId(),
      especie,
      codigoMaterial: materialSeleccionado.codigo,
      materialNombre: materialSeleccionado.nombre,
      pesoInicial: pesoInicialNumero,
      pesoFinal: pesoFinalNumero,
      sede: sede || undefined,
      subcortes: subcortesActivos.map((sc) => ({
        codigo: sc.codigo,
        nombre: sc.nombre,
        peso: parseWeightInput(subcortesPesos[sc.codigo] ?? "0"),
      })),
      perdida,
      porcentajePerdida,
    };

    setMaterialesGuardados((prev) => [...prev, nuevoMaterial]);
    setMensaje({
      tipo: "success",
      texto: `Material "${materialSeleccionado.nombre}" agregado a la lista.`,
    });
    setSavingMaterial(false);
    resetFormularioMaterial();
  };

  const handleRemoverMaterial = (id: string) => {
    setMaterialesGuardados((prev) => prev.filter((material) => material.id !== id));
  };

  const handleGuardarLote = async () => {
    if (!materialesGuardados.length) {
      setMensaje({
        tipo: "error",
        texto: "Añade al menos un material antes de guardar el taller.",
      });
      return;
    }

    const tienePerdidaNegativa = materialesGuardados.some(
      (material) => material.porcentajePerdida < 0
    );
    if (tienePerdidaNegativa) {
      setNegativeLossModal(
        "Hay materiales con porcentaje de perdida negativo. Corrige los pesos antes de guardar"
      );
      return;
    }

    setSavingBatch(true);
    setMensaje(null);

    const nombreGrupoFinal = `Taller (${materialesGuardados.length} materiales)`;

    try {
      await createTallerCompleto({
        nombre_taller: nombreGrupoFinal,
        descripcion: undefined,
        sede: isManager ? sede || undefined : undefined,
        materiales: materialesGuardados.map((material) => ({
          nombre_taller: "Taller",
          descripcion: undefined,
          sede: isManager ? material.sede || undefined : undefined,
          peso_inicial: material.pesoInicial,
          peso_final: material.pesoFinal,
          especie: material.especie,
          codigo_principal: material.codigoMaterial,
          subcortes: material.subcortes.map((sc) => ({
            codigo_producto: sc.codigo,
            nombre_subcorte: sc.nombre,
            peso: sc.peso,
          })),
        })),
      });
      setMensaje({
        tipo: "success",
        texto: `Se guardaron ${materialesGuardados.length} materiales como parte del taller+.`,
      });
      setMaterialesGuardados([]);
    } catch (error) {
      console.error("No se pudo guardar el taller completo", error);
      setMensaje({
        tipo: "error",
        texto: "No se pudo guardar el taller completo. Intenta nuevamente.",
      });
    }

    setSavingBatch(false);
  };

  return (
    <Box
      sx={{
        maxWidth: 1280,
        margin: "0 auto",
        py: 4,
        px: { xs: 2, sm: 3 },
        background:
          "radial-gradient(circle at 15% 30%, rgba(99, 102, 241, 0.08), transparent 30%), radial-gradient(circle at 75% 0%, rgba(16, 185, 129, 0.12), transparent 25%)",
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
              Talleres+
            </Typography>
            <Typography color="text.secondary">
              Crea varios materiales en un mismo flujo, guárdalos en una lista y envía todo el
              taller en conjunto.
            </Typography>
          </Box>

          <Chip
            icon={<PlaylistAdd />}
            label="Múltiples materiales"
            color="primary"
            variant="outlined"
            sx={{
              fontWeight: 700,
              bgcolor: "rgba(99, 102, 241, 0.08)",
              borderColor: "rgba(99, 102, 241, 0.3)",
            }}
          />
        </Box>

        {mensaje && (
          <Alert severity={mensaje.tipo} onClose={() => setMensaje(null)}>
            {mensaje.texto}
          </Alert>
        )}
        <Dialog
          open={Boolean(negativeLossModal)}
          onClose={() => setNegativeLossModal(null)}
          aria-labelledby="negative-loss-dialog-title"
        >
          <DialogTitle id="negative-loss-dialog-title">Verifica los pesos ingresados</DialogTitle>
          <DialogContent>
            <DialogContentText>{negativeLossModal}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setNegativeLossModal(null)}>
              Entendido
            </Button>
          </DialogActions>
        </Dialog>

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={8}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 4,
                borderColor: "rgba(0,0,0,0.04)",
                boxShadow: "0 20px 80px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <Stack spacing={4}>
                  <Grid container spacing={2}>
                    {isManager && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Sede del taller"
                          value={sede}
                          onChange={(e) => setSede(e.target.value)}
                          helperText="Se aplicará a cada material que guardes"
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
                  </Grid>

                  <Divider />

                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AddCircleOutline color="primary" />
                      <Typography variant="h6" fontWeight={800}>
                        Añade un material principal
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary">
                      Repite el proceso de pesos y subcortes para cada material que quieras incluir
                      en este taller+.
                    </Typography>
                  </Stack>

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
                          setMaterialSearch("");
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
                      <Autocomplete
                        fullWidth
                        disabled={!especie}
                        value={materialSeleccionado ?? null}
                        inputValue={materialSearch}
                        options={materiales}
                        getOptionLabel={(option) => `${option.nombre} (${option.codigo})`}
                        isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
                        onInputChange={(_, newValue) => setMaterialSearch(newValue)}
                        onChange={(_, newValue) => {
                          setCodigoMaterial(newValue?.codigo ?? "");
                          setMaterialSearch(
                            newValue ? `${newValue.nombre} (${newValue.codigo})` : ""
                          );
                          setPesoInicialGuardado(false);
                          setSubcortesPesos({});
                          setSubcortesSeleccionados([]);
                          setSeleccionSubcortesGuardada(false);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Material principal"
                            placeholder="Escribe para buscar el material"
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        inputProps={{ min: 0, step: "0.01" }}
                        label="Peso inicial (kg)"
                        value={pesoInicial}
                        onChange={(e) => {
                          if (isNegativeInputValue(e.target.value)) {
                            return;
                          }
                          setPesoInicial(e.target.value);
                        }}
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

                  <WeightSummaryCards
                    hasPesoInicial={Boolean(pesoInicial)}
                    pesoInicial={pesoInicialNumero}
                    totalProcesado={totalProcesado}
                    perdida={perdida}
                    porcentajePerdida={porcentajePerdida}
                  />

                  {readyForSubcortes && (
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="h6" gutterBottom fontWeight={700}>
                          Subcortes ({materialSeleccionado?.nombre})
                        </Typography>
                        <Typography color="text.secondary">
                          Selecciona los subcortes disponibles, guarda tu selección y luego registra
                          los pesos obtenidos.
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
                              Selección guardada ({subcortesSeleccionados.length} subcorte(s))
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
                              <Grid item xs={12} md={6} lg={4} key={subcorte.codigo}>
                                <SelectableSubcorteCard
                                  subcorte={subcorte}
                                  checked={subcortesSeleccionados.includes(subcorte.codigo)}
                                  onToggle={handleToggleSubcorte}
                                />
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
                                {subcortesSeleccionados.length} subcorte(s) seleccionado(s)
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
                                  onChange={(e) => {
                                    if (isNegativeInputValue(e.target.value)) {
                                      return;
                                    }
                                    setSubcortesPesos((prev) => ({
                                      ...prev,
                                      [subcorte.codigo]: e.target.value,
                                    }));
                                  }}
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
                                onChange={(e) => {
                                  if (isNegativeInputValue(e.target.value)) {
                                    return;
                                  }
                                  setPesoFinal(e.target.value);
                                }}
                              />
                            </Grid>
                          </Grid>

                          <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="error">
                              Pérdida: {formatKg(perdida)} kg ({formatPercent(porcentajePerdida)}%)
                            </Typography>
                            <Typography color="text.secondary">
                              Total subcortes: {formatKg(totalSubcortes)} kg · Peso final:{" "}
                              {formatKg(pesoFinalNumero)} kg
                            </Typography>
                          </Box>
                        </Stack>
                      ) : (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          Selecciona y guarda los subcortes para habilitar los campos de registro de
                          peso.
                        </Alert>
                      )}
                    </Stack>
                  )}

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    justifyContent="flex-end"
                  >
                    <Button variant="outlined" onClick={resetFormularioMaterial}>
                      Limpiar formulario
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      disabled={!readyToQueueMaterial || savingMaterial}
                      startIcon={<SaveRounded />}
                      onClick={handleGuardarMaterial}
                    >
                      {savingMaterial ? "Guardando..." : "Guardar material"}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={2} height="100%">
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <PlaylistAdd color="primary" />
                    <Typography fontWeight={800}>Materiales guardados</Typography>
                  </Stack>

                  {!materialesGuardados.length ? (
                    <Alert severity="info" icon={false}>
                      Aún no has agregado materiales. Guárdalos aquí y luego envíalos todos juntos.
                    </Alert>
                  ) : (
                    <Stack spacing={2}>
                      {materialesGuardados.map((material) => (
                        <Card
                          key={material.id}
                          variant="outlined"
                          sx={{ borderRadius: 2, bgcolor: "rgba(0,0,0,0.01)" }}
                        >
                          <CardContent>
                            <Stack spacing={1}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                justifyContent="space-between"
                              >
                                <Typography fontWeight={700}>{material.materialNombre}</Typography>
                                <Chip
                                  size="small"
                                  label={`${formatKg(material.pesoInicial)} kg`}
                                  color="primary"
                                  variant="outlined"
                                />
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                {material.subcortes.length} subcorte(s) · Pérdida:{" "}
                                {formatKg(material.perdida)} kg (
                                {formatPercent(material.porcentajePerdida)}%)
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip
                                  size="small"
                                  label={`Peso inicial: ${formatKg(material.pesoInicial)} kg`}
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={`Peso final: ${formatKg(material.pesoFinal)} kg`}
                                  variant="outlined"
                                />
                              </Stack>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {material.subcortes.map((sc) => (
                                  <Chip
                                    key={sc.codigo}
                                    size="small"
                                    label={`${sc.nombre} (${formatKg(sc.peso)} kg)`}
                                  />
                                ))}
                              </Stack>
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                  variant="text"
                                  color="error"
                                  size="small"
                                  onClick={() => handleRemoverMaterial(material.id)}
                                >
                                  Eliminar
                                </Button>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Button
                variant="contained"
                color="success"
                startIcon={<SaveRounded />}
                disabled={!materialesGuardados.length || savingBatch}
                onClick={handleGuardarLote}
              >
                {savingBatch
                  ? "Guardando taller+..."
                  : `Guardar ${materialesGuardados.length} material(es)`}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
};

export default TalleresPlus;
