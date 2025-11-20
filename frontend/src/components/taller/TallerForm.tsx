import { FormEvent } from "react";
import {
  Alert,
  AlertTitle,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { corte, Item } from "../../types";

interface TallerFormProps {
  items: Item[];
  cortes: corte[];
  pesos: Record<string, string>;
  selectedItemId: string;
  nombreTaller: string;
  descripcion: string;
  loadingItems: boolean;
  loadingCortes: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectItem: (itemId: string) => void;
  onNombreChange: (value: string) => void;
  onDescripcionChange: (value: string) => void;
  onPesoChange: (corteId: string, value: string) => void;
}

const TallerForm = ({
  items,
  cortes,
  pesos,
  selectedItemId,
  nombreTaller,
  descripcion,
  loadingItems,
  loadingCortes,
  submitting,
  error,
  onSubmit,
  onSelectItem,
  onNombreChange,
  onDescripcionChange,
  onPesoChange,
}: TallerFormProps) => (
  <Paper
    component="form"
    onSubmit={onSubmit}
    sx={{ flex: 1, p: { xs: 3, md: 4 } }}
  >
    <Stack spacing={3}>
      <div>
        <Typography variant="h6" component="h2">
          Registrar nuevo taller
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completa los campos para crear un nuevo taller con los cortes
          configurados para el material seleccionado.
        </Typography>
      </div>

      <TextField
        select
        label="Material"
        value={selectedItemId}
        onChange={(event) => onSelectItem(event.target.value)}
        required
        disabled={loadingItems || items.length === 0}
      >
        {items.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.descripcion} · {item.codigo_producto}
          </MenuItem>
        ))}
      </TextField>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Nombre del taller"
          value={nombreTaller}
          onChange={(event) => onNombreChange(event.target.value)}
          required
          fullWidth
          helperText="Ej. Taller desposte res 2024"
        />
        <TextField
          label="Descripción (opcional)"
          value={descripcion}
          onChange={(event) => onDescripcionChange(event.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
      </Stack>

      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={600}>
          Pesos por corte
        </Typography>
        {loadingCortes ? (
          <Typography variant="body2" color="text.secondary">
            Cargando cortes asociados…
          </Typography>
        ) : cortes.length ? (
          cortes.map((corte) => (
            <TextField
              key={corte.id}
              label={`${
                corte.nombre_corte
              } · % objetivo ${corte.porcentaje_default.toFixed(2)}%`}
              type="number"
              inputProps={{ step: 0.001, min: 0 }}
              value={pesos[corte.id] ?? ""}
              onChange={(event) => onPesoChange(corte.id, event.target.value)}
              helperText="Ingresa el peso en kilogramos"
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No hay cortes registrados para este material. Registra cortes en la
            API antes de crear talleres.
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={submitting || loadingCortes}
      >
        {submitting ? "Registrando taller…" : "Registrar taller"}
      </Button>
    </Stack>
  </Paper>
);

export default TallerForm;
