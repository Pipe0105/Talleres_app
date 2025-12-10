import {
  Alert,
  AlertTitle,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { corte, Item } from "../../types";
import SubcorteCalculator from "./SubcorteCalculator";

interface TallerFormProps {
  cortes: corte[];
  pesos: Record<string, string>;
  selectedItem: Item | null;
  selectedItemNombre?: string;
  nombreTaller: string;
  loadingCortes: boolean;
  error: string | null;
  submitting?: boolean;
  onNombreChange: (value: string) => void;
  onPesoChange: (corteId: string, value: string) => void;
  onOpenSelector: () => void;
  onSubmit?: () => void;
}

const FINAL_CORTE_LABEL = "Peso luego del taller";

const TallerForm = ({
  cortes,
  pesos,
  selectedItem,
  selectedItemNombre,
  nombreTaller,
  loadingCortes,
  error,
  submitting = false,
  onNombreChange,
  onPesoChange,
  onOpenSelector,
  onSubmit,
}: TallerFormProps) => {
  return (
    <div style={{ flex: 1 }}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
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

          <Stack spacing={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                Material seleccionado
              </Typography>
              <Button variant="outlined" onClick={onOpenSelector}>
                Cambiar material
              </Button>
            </Stack>
            {selectedItem || selectedItemNombre ? (
              <Typography>
                {selectedItem?.descripcion ?? selectedItemNombre ?? ""}
                {selectedItem?.codigo_producto
                  ? ` · ${selectedItem.codigo_producto}`
                  : ""}
              </Typography>
            ) : (
              <Alert severity="warning">
                Usa el botón "Registrar nuevo taller" para elegir un material
                antes de completar los datos.
              </Alert>
            )}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Nombre del taller"
              value={nombreTaller}
              required
              InputProps={{ readOnly: true }}
              onChange={(event) => onNombreChange(event.target.value)}
              fullWidth
            />
          </Stack>

          {selectedItem && cortes.length > 0 && (
            <SubcorteCalculator
              cortes={cortes}
              pesos={pesos}
              finalLabel={FINAL_CORTE_LABEL}
              onPesoChange={onPesoChange}
              disabled={loadingCortes || submitting}
            />
          )}

          {error && (
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={onSubmit}
              type="submit"
              disabled={!selectedItem || submitting || loadingCortes}
            >
              {submitting ? "Guardando…" : "Guardar taller"}
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Guarda el taller para registrar el peso inicial, los subcortes y
              el peso final en el historial.
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </div>
  );
};

export default TallerForm;
