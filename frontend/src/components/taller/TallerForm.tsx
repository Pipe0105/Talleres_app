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
  selectedItemId: string;
  selectedItem: Item | null;
  selectedItemNombre?: string;
  nombreTaller: string;
  loadingCortes: boolean;
  error: string | null;
  secondaryCuts: string[];
  submitting?: boolean;
  onNombreChange: (value: string) => void;
  onPesoChange: (corteId: string, value: string) => void;
  onOpenSelector: () => void;
  onSubcortePesoChange?: (label: string, value: string) => void;
  onSubmit?: () => void;
}

const TallerForm = ({
  cortes,
  pesos,
  selectedItemId,
  selectedItem,
  selectedItemNombre,
  nombreTaller,
  loadingCortes,
  error,
  secondaryCuts,
  submitting = false,
  onNombreChange,
  onPesoChange,
  onOpenSelector,
  onSubcortePesoChange,
  onSubmit,
}: TallerFormProps) => (
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
            onChange={(event) => onNombreChange(event.target.value)}
            required
            fullWidth
            disabled={!selectedItem}
            helperText="Ej. Taller desposte res 2024"
          />
        </Stack>

        {selectedItem && (
          <SubcorteCalculator
            primaryLabel={selectedItem.descripcion}
            secondaryCuts={secondaryCuts}
            onPesoChange={onSubcortePesoChange}
          ></SubcorteCalculator>
        )}

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
              No hay cortes registrados para este material. Registra cortes en
              la API antes de crear talleres.
            </Typography>
          )}
        </Stack>

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
            disabled={!selectedItem || submitting}
          >
            {submitting ? "Guardando.." : "Guardando taller"}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Guardar el taller para registrar todo
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  </div>
);

export default TallerForm;
