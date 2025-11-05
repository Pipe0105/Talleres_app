import { ChangeEvent, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  Collapse,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import {
  createTaller,
  getPrecios,
  getProductos,
  getTalleres,
} from "../api/talleresApi";
import Dashboard from "../components/Dashboard";
import FileUploader from "../components/FileUploader";
import { NewTaller, Precio, Producto, Taller } from "../types";

const TalleresDesposte = () => {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [selectedTallerId, setSelectedTallerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(
    null
  );
  const [materialInput, setMaterialInput] = useState("");
  const [pesoTaller, setPesoTaller] = useState("");
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [gordana, setGordana] = useState("");
  const [recorte, setRecorte] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [talleresData, productosData, preciosData] = await Promise.all([
          getTalleres(),
          getProductos(),
          getPrecios(),
        ]);

        if (!isMounted) return;

        setTalleres(talleresData);
        setProductos(productosData);
        setPrecios(preciosData);
        setError(null);
        setSelectedTallerId((current) => {
          if (current) {
            return talleresData.find((t) => t.id === current)?.id ?? null;
          }
          return talleresData[0]?.id ?? null;
        });
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible cargar los datos del mock API.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const selectedTaller = useMemo(
    () => talleres.find((taller) => taller.id === selectedTallerId) ?? null,
    [selectedTallerId, talleres]
  );

  const resetForm = () => {
    setSelectedProducto(null);
    setMaterialInput("");
    setPesoTaller("");
    setGordana("");
    setRecorte("");
    setShowAdvancedFields(false);
    setFormError(null);
  };

  const handleStartForm = () => {
    resetForm();
    setSuccessMessage(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAcceptPeso = () => {
    if (!selectedProducto) {
      setFormError("Selecciona un material para continuar.");
      return;
    }

    const pesoValue = Number.parseFloat(pesoTaller);
    if (Number.isNaN(pesoValue) || pesoValue <= 0) {
      setFormError("Ingresa un peso válido en kilogramos.");
      return;
    }

    setFormError(null);
    setShowAdvancedFields(true);
  };

  const handleRegistrarTaller = async () => {
    if (!selectedProducto) {
      setFormError("Selecciona un material antes de registrar el taller.");
      return;
    }

    const pesoValue = Number.parseFloat(pesoTaller);
    if (Number.isNaN(pesoValue) || pesoValue <= 0) {
      setFormError("Ingresa un peso válido en kilogramos.");
      return;
    }

    const gordanaValue = Number.parseFloat(gordana);
    const recorteValue = Number.parseFloat(recorte);

    if (Number.isNaN(gordanaValue) || Number.isNaN(recorteValue)) {
      setFormError(
        "Completa los campos de gordana y recorte con valores numéricos."
      );
      return;
    }

    const rendimiento = pesoValue
      ? Number(((gordanaValue + recorteValue) / pesoValue).toFixed(6))
      : null;

    const nuevoTaller: NewTaller = {
      producto_id: selectedProducto.id,
      codigo: selectedProducto.codigo,
      fecha: dayjs().format("DD/MM/YYYY"),
      grupo: `${selectedProducto.nombre.replace(/\s+/g, "_")}_Desposte`,
      observaciones: `Gordana: ${gordanaValue} kg · Recorte: ${recorteValue} kg`,
      peso_inicial: Number(pesoValue.toFixed(3)),
      peso_taller: Number(pesoValue.toFixed(3)),
      rendimiento,
      creado_por: "operario-desposte",
    };

    try {
      setSubmitting(true);
      setFormError(null);
      const tallerRegistrado = await createTaller(nuevoTaller);
      setTalleres((prev) =>
        [...prev, tallerRegistrado].sort(
          (a, b) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
            b.id - a.id
        )
      );
      setSelectedTallerId(tallerRegistrado.id);
      setSuccessMessage("Taller registrado exitosamente.");
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setFormError("Ocurrió un error al registrar el taller.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSelectedTallerId(null);
    setLoading(true);
    setRefreshToken((token) => token + 1);
  };
  return (
    <Stack spacing={4}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={1}>
          <Typography variant="h4" component="h1">
            Talleres de Desposte
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona, consulta y registra los talleres de desposte con un flujo
            guiado y sencillo.
          </Typography>
        </Stack>
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={1.5}>
              <div>
                <Typography variant="h5" component="h2">
                  Talleres registrados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Información proveniente del archivo <code>mock/db.json</code>.
                </Typography>
              </div>
            </Stack>
            {loading ? (
              <Typography mt={4} variant="body2" color="text.secondary">
                Cargando datos del servidor mock…
              </Typography>
            ) : error ? (
              <Alert severity="error" sx={{ mt: 4 }}>
                <AlertTitle>Error al cargar</AlertTitle>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {error}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={handleRetry}
                >
                  Reintentar
                </Button>
              </Alert>
            ) : (
              <Dashboard
                talleres={talleres}
                productos={productos}
                precios={precios}
                selectedTallerId={selectedTallerId}
                onSelectTaller={setSelectedTallerId}
              />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" component="h3">
                  Nuevo proceso de desposte
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Sigue los pasos para registrar un taller enfocado en desposte.
                </Typography>
              </Box>

              {successMessage && !showForm && (
                <Alert
                  severity="success"
                  onClose={() => setSuccessMessage(null)}
                >
                  {successMessage}
                </Alert>
              )}

              {!showForm ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartForm}
                  disabled={submitting}
                >
                  Ingresar taller nuevo
                </Button>
              ) : (
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ letterSpacing: 1.5 }}
                    >
                      Paso 1
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                    >
                      Selecciona el material
                    </Typography>
                    <Autocomplete
                      options={productos}
                      getOptionLabel={(option) =>
                        `${option.nombre} · ${option.codigo}`
                      }
                      value={selectedProducto}
                      onChange={(_, newValue) => {
                        setSelectedProducto(newValue);
                        setShowAdvancedFields(false);
                        setPesoTaller("");
                        setGordana("");
                        setRecorte("");
                        setFormError(null);
                      }}
                      inputValue={materialInput}
                      onInputChange={(_, newInputValue) =>
                        setMaterialInput(newInputValue)
                      }
                      disableClearable={false}
                      loading={productos.length === 0}
                      disabled={submitting}
                      renderInput={(params: AutocompleteRenderInputParams) => (
                        <TextField
                          {...params}
                          label="Nombre del material"
                          placeholder="Ej. Bife Ancho"
                        />
                      )}
                    />
                  </Box>

                  <Collapse in={Boolean(selectedProducto)}>
                    <Stack spacing={2.5}>
                      <Divider flexItem />
                      <Box>
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          sx={{ letterSpacing: 1.5 }}
                        >
                          Paso 2
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          gutterBottom
                        >
                          Registra el peso del corte (kg)
                        </Typography>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={2}
                        >
                          <TextField
                            label="Peso del taller"
                            type="number"
                            inputProps={{ step: 0.001, min: 0 }}
                            placeholder="Ej. 120.5"
                            value={pesoTaller}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setPesoTaller(event.target.value)
                            }
                            disabled={submitting}
                            fullWidth
                          />
                          {!showAdvancedFields && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleAcceptPeso}
                              disabled={submitting}
                              sx={{ minWidth: { sm: 150 } }}
                            >
                              Aceptar
                            </Button>
                          )}
                        </Stack>
                      </Box>

                      <Collapse in={showAdvancedFields}>
                        <Stack spacing={2.5}>
                          <Divider flexItem />
                          <Box>
                            <Typography
                              variant="overline"
                              color="text.secondary"
                              sx={{ letterSpacing: 1.5 }}
                            >
                              Paso 3
                            </Typography>
                            <Typography
                              variant="subtitle1"
                              fontWeight={600}
                              gutterBottom
                            >
                              Detalla cortes base
                            </Typography>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={2}
                            >
                              <TextField
                                label="Gordana (kg)"
                                type="number"
                                inputProps={{ step: 0.001, min: 0 }}
                                placeholder="Ej. 12.4"
                                value={gordana}
                                onChange={(
                                  event: ChangeEvent<HTMLInputElement>
                                ) => setGordana(event.target.value)}
                                disabled={submitting}
                                fullWidth
                              />
                              <TextField
                                label="Recorte (kg)"
                                type="number"
                                inputProps={{ step: 0.001, min: 0 }}
                                placeholder="Ej. 8.1"
                                value={recorte}
                                onChange={(
                                  event: ChangeEvent<HTMLInputElement>
                                ) => setRecorte(event.target.value)}
                                disabled={submitting}
                                fullWidth
                              />
                            </Stack>
                          </Box>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                          >
                            <Button
                              variant="contained"
                              size="large"
                              onClick={handleRegistrarTaller}
                              disabled={submitting}
                            >
                              {submitting
                                ? "Registrando taller…"
                                : "Registrar taller"}
                            </Button>
                            <Button
                              variant="outlined"
                              size="large"
                              color="inherit"
                              onClick={handleCancelForm}
                              disabled={submitting}
                            >
                              Cancelar
                            </Button>
                          </Stack>
                        </Stack>
                      </Collapse>
                    </Stack>
                  </Collapse>

                  {formError && <Alert severity="error">{formError}</Alert>}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h6" component="h3">
          Archivos asociados
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Visualiza documentos o imágenes ligados al taller seleccionado. El
          formulario de subida se comporta de manera local para fines de
          prototipado.
        </Typography>
        <FileUploader taller={selectedTaller} />
      </Paper>
    </Stack>
  );
};

export default TalleresDesposte;
