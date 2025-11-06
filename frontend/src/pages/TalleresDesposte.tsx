import { ChangeEvent, useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Collapse,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import { createTaller, getProductos } from "../api/talleresApi";
import { NewTaller, Producto } from "../types";

const TalleresDesposte = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(
    null
  );
  const [materialInput, setMaterialInput] = useState("");
  const [pesoTaller, setPesoTaller] = useState("");
  const [labelPhoto, setLabelPhoto] = useState<File | null>(null);
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
        const productosData = await getProductos();

        if (!isMounted) return;

        setProductos(productosData);
        setError(null);
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

  const resetForm = () => {
    setSelectedProducto(null);
    setMaterialInput("");
    setPesoTaller("");
    setLabelPhoto(null);
    setGordana("");
    setRecorte("");
    setShowAdvancedFields(false);
    setFormError(null);
  };

  const handleCancelForm = () => {
    resetForm();
    setSuccessMessage(null);
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

    if (!labelPhoto) {
      setFormError("Sube la foto de la etiqueta de la canastilla.");
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

    if (!labelPhoto) {
      setFormError(
        "Sube la foto de la etiqueta de la canastilla antes de continuar."
      );
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
      await createTaller(nuevoTaller);

      setSuccessMessage("Taller registrado exitosamente.");
      resetForm();
    } catch (err) {
      console.error(err);
      setFormError("Ocurrió un error al registrar el taller.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
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

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" component="h2">
              Registrar nuevo taller de desposte
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Completa los pasos para ingresar un taller. El registro solicita
              la foto de la etiqueta de la canastilla junto con los datos
              básicos.
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={handleRetry}>
                  Reintentar
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          <Stack spacing={3}>
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: 1.5 }}
              >
                Paso 1
              </Typography>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
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
                  setLabelPhoto(null);
                  setGordana("");
                  setRecorte("");
                  setFormError(null);
                }}
                inputValue={materialInput}
                onInputChange={(_, newInputValue) =>
                  setMaterialInput(newInputValue)
                }
                disableClearable={false}
                loading={loading}
                disabled={submitting || loading}
                renderInput={(params: AutocompleteRenderInputParams) => (
                  <TextField
                    {...params}
                    label="Nombre del material"
                    placeholder="Ej. Bife Ancho"
                    helperText={
                      loading
                        ? "Cargando materiales del servidor mock…"
                        : undefined
                    }
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
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Registra peso y etiqueta de canastilla
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Peso del taller"
                      type="number"
                      inputProps={{ step: 0.001, min: 0 }}
                      placeholder="Ej. 120.5"
                      value={pesoTaller}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setPesoTaller(event.target.value)
                      }
                      disabled={submitting || showAdvancedFields}
                      fullWidth
                    />
                    {!showAdvancedFields && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAcceptPeso}
                        disabled={submitting}
                        sx={{ minWidth: { sm: 180 } }}
                      >
                        Confirmar datos
                      </Button>
                    )}
                  </Stack>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    mt={2}
                    alignItems={{ sm: "center" }}
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={submitting || showAdvancedFields}
                    >
                      {labelPhoto ? "Cambiar foto" : "Subir foto de etiqueta"}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          const file = event.target.files?.[0] ?? null;
                          setLabelPhoto(file);
                          if (file) {
                            setFormError(null);
                          }
                        }}
                      />
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      {labelPhoto
                        ? labelPhoto.name
                        : "Adjunta la foto de la etiqueta de la canastilla"}
                    </Typography>
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
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setGordana(event.target.value)
                          }
                          disabled={submitting}
                          fullWidth
                        />
                        <TextField
                          label="Recorte (kg)"
                          type="number"
                          inputProps={{ step: 0.001, min: 0 }}
                          placeholder="Ej. 8.1"
                          value={recorte}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setRecorte(event.target.value)
                          }
                          disabled={submitting}
                          fullWidth
                        />
                      </Stack>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
        </Stack>
      </Paper>
    </Stack>
  );
};

export default TalleresDesposte;
