import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircle, SaveRounded } from "@mui/icons-material";

import { createTaller } from "../../api/talleresApi";
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
import { formatKg, parseWeightInput } from "../../utils/weights";

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9_.-]*$/i;
const UNIT_OPTIONS = [
  { value: "kg", label: "Kilogramos" },
  { value: "g", label: "Gramos" },
  { value: "lb", label: "Libras" },
  { value: "unidad", label: "Unidades (requiere factor)" },
  { value: "caja", label: "Cajas (requiere factor)" },
];
const CATEGORY_OPTIONS = [
  { value: "corte", label: "Corte" },
  { value: "subproducto", label: "Subproducto" },
  { value: "merma", label: "Merma" },
  { value: "otro", label: "Otro" },
];
const DEFAULT_UNIT = "kg";
const DEFAULT_CATEGORY = "corte";
const UNIT_FACTORS: Record<string, number | undefined> = {
  kg: 1,
  g: 0.001,
  lb: 0.45359237,
};
const requiresFactor = (unit: string) => ["caja", "unidad"].includes(unit);

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

  const [subcorteUnidades, setSubcorteUnidades] = useState<
    Record<string, string>
  >({});
  const [subcorteFactores, setSubcorteFactores] = useState<
    Record<string, string>
  >({});
  const [subcorteCategorias, setSubcorteCategorias] = useState<
    Record<string, string>
  >({});
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

  const pesoInicialNumero = parseWeightInput(pesoInicial);
  const pesoFinalNumero = parseWeightInput(pesoFinal);
  const resolveFactor = (codigo: string): number => {
    const unidad = (subcorteUnidades[codigo] ?? DEFAULT_UNIT).toLowerCase();
    const factorRaw = Number((subcorteFactores[codigo] ?? "").replace(/,/g, "."));
    if (requiresFactor(unidad)) {
      return Number.isFinite(factorRaw) && factorRaw > 0 ? factorRaw : 0;
    }
    if (Number.isFinite(factorRaw) && factorRaw > 0) {
      return factorRaw;
    }
    return UNIT_FACTORS[unidad] ?? 1;
  };
  const totalSubcortes = subcortesActivos.reduce((acc, sc) => {
    const peso = parseWeightInput(subcortesPesos[sc.codigo] ?? "0");
    return acc + peso * resolveFactor(sc.codigo);
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
    setSubcorteUnidades((prev) => {
      const updated: Record<string, string> = {};
      subcortesSeleccionados.forEach((codigo) => {
        updated[codigo] = prev[codigo] ?? DEFAULT_UNIT;
      });
      return updated;
    });
    setSubcorteFactores((prev) => {
      const updated: Record<string, string> = {};
      subcortesSeleccionados.forEach((codigo) => {
        const unidadSeleccionada = subcorteUnidades[codigo] ?? DEFAULT_UNIT;
        const defaultFactor = UNIT_FACTORS[unidadSeleccionada];
        updated[codigo] =
          prev[codigo] ?? (defaultFactor != null ? String(defaultFactor) : "");
      });
      return updated;
    });
    setSubcorteCategorias((prev) => {
      const updated: Record<string, string> = {};
      subcortesSeleccionados.forEach((codigo) => {
        updated[codigo] = prev[codigo] ?? DEFAULT_CATEGORY;
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

    const pesoInicialParse = Number(pesoInicial.replace(/,/g, "."));
    const pesoFinalParse = Number(pesoFinal.replace(/,/g, "."));

    if (!Number.isFinite(pesoInicialParse) || pesoInicialParse <= 0) {
      setMensaje({
        tipo: "error",
        texto: "El peso inicial debe ser un número mayor a cero.",
      });
      return;
    }

    if (!Number.isFinite(pesoFinalParse) || pesoFinalParse < 0) {
      setMensaje({
        tipo: "error",
        texto: "El peso final debe ser un número válido.",
      });
      return;
    }

    const seenSkus = new Set<string>();
    const subcortesPayload = [];

    for (const sc of subcortesActivos) {
      const pesoRaw = Number((subcortesPesos[sc.codigo] ?? "").replace(/,/g, "."));
      if (!Number.isFinite(pesoRaw)) {
        setMensaje({
          tipo: "error",
          texto: `Revisa el peso ingresado para ${sc.nombre} (${sc.codigo}).`,
        });
        return;
      }

      const unidad = (subcorteUnidades[sc.codigo] ?? DEFAULT_UNIT).toLowerCase();
      const categoria = (subcorteCategorias[sc.codigo] ?? DEFAULT_CATEGORY).trim();
      const factorValor = subcorteFactores[sc.codigo];
      const factorParse = Number((factorValor ?? "").replace(/,/g, "."));
      const factor =
        requiresFactor(unidad) && Number.isFinite(factorParse)
          ? factorParse
          : UNIT_FACTORS[unidad] ?? (Number.isFinite(factorParse) ? factorParse : null);

      if (!SKU_PATTERN.test(sc.codigo)) {
        setMensaje({
          tipo: "error",
          texto: `El SKU ${sc.codigo} no cumple con el formato permitido.`,
        });
        return;
      }

      if (seenSkus.has(sc.codigo.toUpperCase())) {
        setMensaje({
          tipo: "error",
          texto: "Cada subcorte debe tener un SKU único.",
        });
        return;
      }
      seenSkus.add(sc.codigo.toUpperCase());

      if (!categoria) {
        setMensaje({
          tipo: "error",
          texto: "Completa la categoría de cada subcorte.",
        });
        return;
      }

      if (
        requiresFactor(unidad) &&
        (factor == null || !Number.isFinite(factor) || factor <= 0)
      ) {
        setMensaje({
          tipo: "error",
          texto:
            "Las unidades tipo caja/unidad requieren un factor de conversión mayor a cero.",
        });
        return;
      }


      subcortesPayload.push({
        codigo_producto: sc.codigo,
        nombre_subcorte: sc.nombre,
        peso: pesoRaw,
        categoria,
        unidad_medida: unidad,
        factor_conversion: Number.isFinite(factor) ? factor : undefined,
      });
    }


    setSubmitting(true);
    setMensaje(null);

    try {
      await createTaller({
        nombre_taller:
          nombreTaller.trim() || `Taller de ${materialSeleccionado.nombre}`,
        descripcion: descripcion || undefined,
        sede: isAdmin ? sede || undefined : undefined,
        peso_inicial: pesoInicialParse,
        peso_final: pesoFinalParse,
        especie,
        codigo_principal: materialSeleccionado.codigo,
        subcortes: subcortesPayload,
      });

      setMensaje({
        tipo: "success",
        texto: "Taller guardado correctamente.",
      });
      setPesoInicialGuardado(false);
      setSubcortesPesos({});
      setSubcorteUnidades({});
      setSubcorteFactores({});
      setSubcorteCategorias({});
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
                            <SelectableSubcorteCard
                              subcorte={subcorte}
                              checked={subcortesSeleccionados.includes(
                                subcorte.codigo
                              )}
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
                        {subcortesActivos.map((subcorte) => {
                          const unidadSeleccionada =
                            subcorteUnidades[subcorte.codigo] ?? DEFAULT_UNIT;
                          const necesitaFactor = requiresFactor(unidadSeleccionada);

                          return (
                            <Grid item xs={12} md={6} key={subcorte.codigo}>
                              <Stack spacing={1}>
                                <Typography fontWeight={700}>
                                  {subcorte.nombre} ({subcorte.codigo})
                                </Typography>
                                <TextField
                                  fullWidth
                                  type="number"
                                  inputProps={{ min: 0, step: "0.01" }}
                                  label="Peso reportado"
                                  value={subcortesPesos[subcorte.codigo] ?? ""}
                                  onChange={(e) =>
                                    setSubcortesPesos((prev) => ({
                                      ...prev,
                                      [subcorte.codigo]: e.target.value,
                                    }))
                                  }
                                />
                                <Stack
                                  spacing={1}
                                  direction={{ xs: "column", sm: "row" }}
                                >
                                  <TextField
                                    select
                                    fullWidth
                                    label="Unidad de medida"
                                    value={unidadSeleccionada}
                                    onChange={(e) => {
                                      const unidad = e.target.value;
                                      setSubcorteUnidades((prev) => ({
                                        ...prev,
                                        [subcorte.codigo]: unidad,
                                      }));
                                      if (!requiresFactor(unidad)) {
                                        const defaultFactor =
                                          UNIT_FACTORS[unidad] ?? "";
                                        setSubcorteFactores((prev) => ({
                                          ...prev,
                                          [subcorte.codigo]: defaultFactor
                                            ? String(defaultFactor)
                                            : "",
                                        }));
                                      }
                                    }}
                                  >
                                    {UNIT_OPTIONS.map((option) => (
                                      <MenuItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                  {necesitaFactor && (
                                    <TextField
                                      fullWidth
                                      label="Factor a kg"
                                      placeholder="Ej: 12"
                                      value={subcorteFactores[subcorte.codigo] ?? ""}
                                      onChange={(e) =>
                                        setSubcorteFactores((prev) => ({
                                          ...prev,
                                          [subcorte.codigo]: e.target.value,
                                        }))
                                      }
                                      helperText="Equivalencia en kg por unidad/caja."
                                    />
                                  )}
                                </Stack>
                                <TextField
                                  select
                                  fullWidth
                                  label="Categoría"
                                  value={subcorteCategorias[subcorte.codigo] ?? DEFAULT_CATEGORY}
                                  onChange={(e) =>
                                    setSubcorteCategorias((prev) => ({
                                      ...prev,
                                      [subcorte.codigo]: e.target.value,
                                    }))
                                  }
                                >
                                  {CATEGORY_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Stack>
                            </Grid>
                          );
                        })}
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
