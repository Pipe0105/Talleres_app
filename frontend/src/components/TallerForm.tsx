import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { NewTaller, Producto } from "../types";
import { sanitizeInput, safeParseNumber } from "../utils/security";

interface TallerFormProps {
  productos: Producto[];
  onCreated: (nuevoTaller: NewTaller) => Promise<void>;
}

interface FormState {
  productoId: string;
  fecha: string;
  pesoInicial: string;
  pesoTaller: string;
  grupo: string;
  observaciones: string;
  creadoPor: string;
}

const initialState: FormState = {
  productoId: "",
  fecha: "",
  pesoInicial: "",
  pesoTaller: "",
  grupo: "",
  observaciones: "",
  creadoPor: "",
};

const MAX_COMMENT_LENGTH = 400;
const MAX_OPERATOR_LENGTH = 60;

const TallerForm = ({ productos, onCreated }: TallerFormProps) => {
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const productosOptions = useMemo(
    () =>
      productos.map((producto) => ({
        value: producto.id.toString(),
        label: `${producto.nombre} · ${producto.codigo}`,
      })),
    [productos]
  );

  const isDisabled = submitting || productos.length === 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.productoId || !formState.fecha || !formState.pesoTaller) {
      setError("Producto, fecha y peso del taller son obligatorios.");
      return;
    }

    const producto = productos.find(
      (item) => item.id === Number(formState.productoId)
    );

    if (!producto) {
      setError("El producto seleccionado no es válido.");
      return;
    }

    const pesoInicial = safeParseNumber(formState.pesoInicial);
    const pesoTaller = safeParseNumber(formState.pesoTaller);

    if (pesoTaller == null || pesoTaller <= 0) {
      setError("Debes ingresar un peso de taller numérico y mayor a cero.");
      return;
    }

    if (pesoInicial != null && pesoInicial <= 0) {
      setError("El peso inicial debe ser mayor a cero cuando se indique.");
      return;
    }

    if (pesoInicial != null && pesoTaller > pesoInicial) {
      setError("El peso del taller no puede ser mayor al peso inicial.");
      return;
    }

    if (pesoTaller > 100000) {
      setError("El peso del taller no puede superar las 100 toneladas.");
      return;
    }

    if (dayjs(formState.fecha).isAfter(dayjs(), "day")) {
      setError("La fecha del taller no puede ser futura.");
      return;
    }

    const observacionesSeguras = sanitizeInput(formState.observaciones, {
      maxLength: MAX_COMMENT_LENGTH,
    });
    const grupoSeguro = sanitizeInput(formState.grupo, { maxLength: 120 });
    const operarioSeguro = sanitizeInput(formState.creadoPor, {
      maxLength: MAX_OPERATOR_LENGTH,
    });

    const rendimiento =
      pesoInicial && pesoInicial > 0
        ? Number((pesoTaller / pesoInicial).toFixed(6))
        : null;

    const nuevoTaller: NewTaller = {
      producto_id: producto.id,
      codigo: producto.codigo,
      fecha: dayjs(formState.fecha).format("DD/MM/YYYY"),
      grupo: grupoSeguro || `${producto.nombre.replace(/\s+/g, "_")}_Group`,
      observaciones:
        observacionesSeguras || `Taller generado para ${producto.nombre}`,
      peso_inicial: pesoInicial,
      peso_taller: Number(pesoTaller.toFixed(3)),
      rendimiento,
      creado_por: operarioSeguro || "operario-demo",
    };

    try {
      setSubmitting(true);
      setError(null);
      await onCreated(nuevoTaller);
      setFormState(initialState);
      setSuccessMessage("Taller creado en el mock correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al crear el taller.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 3, md: 4 } }} component="section" elevation={0}>
      <Typography variant="h5" component="h3">
        Nuevo taller
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={1}>
        Completa el formulario para simular el registro de un nuevo taller en el
        json-server.
      </Typography>
      <Box component="form" onSubmit={handleSubmit} mt={3}>
        <Stack spacing={2.5}>
          <TextField
            select
            label="Producto"
            placeholder="Selecciona un producto…"
            value={formState.productoId}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFormState((prev) => ({
                ...prev,
                productoId: event.target.value,
              }))
            }
            required
            disabled={isDisabled}
            helperText={
              productos.length === 0
                ? "Cargando listado de productos…"
                : undefined
            }
          >
            {productosOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Fecha"
              type="date"
              value={formState.fecha}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({
                  ...prev,
                  fecha: event.target.value,
                }))
              }
              required
              disabled={isDisabled}
              InputLabelProps={{ shrink: true }}
              inputProps={{ maxLength: 10 }}
            />
            <TextField
              label="Grupo"
              placeholder="Ej. Ampolleta_Group"
              value={formState.grupo}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({
                  ...prev,
                  grupo: sanitizeInput(event.currentTarget.value, {
                    maxLength: 120,
                  }),
                }))
              }
              disabled={isDisabled}
              inputProps={{ maxLength: 120, autoComplete: "off" }}
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Peso inicial (kg)"
              type="number"
              inputProps={{ step: 0.001, min: 0 }}
              placeholder="Ej. 35.2"
              value={formState.pesoInicial}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({
                  ...prev,
                  pesoInicial: sanitizeInput(event.currentTarget.value, {
                    maxLength: 16,
                  }),
                }))
              }
              disabled={isDisabled}
            />
            <TextField
              label="Peso taller (kg)"
              type="number"
              inputProps={{ step: 0.001, min: 0 }}
              placeholder="Ej. 31.8"
              value={formState.pesoTaller}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({
                  ...prev,
                  pesoTaller: sanitizeInput(event.currentTarget.value, {
                    maxLength: 16,
                  }),
                }))
              }
              required
              disabled={isDisabled}
            />
          </Stack>

          <TextField
            label="Observaciones"
            placeholder="Notas relevantes del taller"
            multiline
            minRows={3}
            value={formState.observaciones}
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) =>
              setFormState((prev) => ({
                ...prev,
                observaciones: sanitizeInput(event.currentTarget.value, {
                  maxLength: MAX_COMMENT_LENGTH,
                }),
              }))
            }
            disabled={isDisabled}
            inputProps={{
              maxLength: MAX_COMMENT_LENGTH,
              autoComplete: "off",
            }}
          />

          <TextField
            label="Operario"
            placeholder="Ej. operario1"
            value={formState.creadoPor}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFormState((prev) => ({
                ...prev,
                creadoPor: sanitizeInput(event.currentTarget.value, {
                  maxLength: MAX_OPERATOR_LENGTH,
                }),
              }))
            }
            disabled={isDisabled}
            inputProps={{
              maxLength: MAX_OPERATOR_LENGTH,
              autoComplete: "off",
            }}
          />

          {error && <Alert severity="error">{error}</Alert>}

          {successMessage && <Alert severity="success">{successMessage}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isDisabled}
          >
            {submitting ? "Registrando taller…" : "Registrar taller"}
          </Button>
          {productos.length === 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              Espera a que cargue el listado de productos para habilitar el
              formulario.
            </Typography>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default TallerForm;
