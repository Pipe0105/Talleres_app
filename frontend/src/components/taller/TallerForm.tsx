import { useMemo } from "react";
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
  primaryCorteLabel?: string;
  nombreTaller: string;
  loadingCortes: boolean;
  error: string | null;
  secondaryCuts: string[];
  finalCorteLabel?: string;
  submitting?: boolean;
  onNombreChange: (value: string) => void;
  onPesoChange: (corteId: string, value: string) => void;
  getCorteIdByLabel?: (label: string) => string | null;
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
  primaryCorteLabel,
  nombreTaller,
  loadingCortes,
  error,
  secondaryCuts,
  finalCorteLabel,
  submitting = false,
  onNombreChange,
  onPesoChange,
  getCorteIdByLabel,
  onOpenSelector,
  onSubcortePesoChange,
  onSubmit,
}: TallerFormProps) => {
  const parsePesoValue = (value?: string) => {
    if (!value?.trim()) {
      return null;
    }
    const normalized = value.replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  const normalizeCorteName = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

  const corteLabels = useMemo(
    () => cortes.map((corte) => corte.nombre_corte).filter(Boolean),
    [cortes]
  );

  const derivedPrimaryLabel = useMemo(
    () =>
      corteLabels[0] ||
      primaryCorteLabel ||
      selectedItem?.descripcion ||
      selectedItemNombre ||
      "",
    [
      corteLabels,
      primaryCorteLabel,
      selectedItem?.descripcion,
      selectedItemNombre,
    ]
  );

  const derivedFinalLabel = useMemo(() => {
    const regex = /FINAL|SALIDA|DESP/;
    const finalFromCortes = corteLabels.find((label) =>
      regex.test(normalizeCorteName(label))
    );

    if (finalFromCortes) {
      return finalFromCortes;
    }

    return finalCorteLabel || `${derivedPrimaryLabel} FINAL`.trim();
  }, [corteLabels, derivedPrimaryLabel, finalCorteLabel]);

  const derivedSecondaryCuts = useMemo(() => {
    const excluded = new Set([
      normalizeCorteName(derivedPrimaryLabel),
      normalizeCorteName(derivedFinalLabel),
    ]);

    const cortesSecundarios = corteLabels.filter(
      (label) => !excluded.has(normalizeCorteName(label))
    );

    const extras = secondaryCuts.filter(
      (label) => !excluded.has(normalizeCorteName(label))
    );

    return [...cortesSecundarios, ...extras];
  }, [corteLabels, derivedFinalLabel, derivedPrimaryLabel, secondaryCuts]);
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
              fullWidth
            />
          </Stack>

          {selectedItem && primaryCorteLabel && (
            <SubcorteCalculator
              primaryLabel={primaryCorteLabel}
              secondaryCuts={secondaryCuts ?? []}
              finalLabel={finalCorteLabel ?? `${primaryCorteLabel} FINAL`}
              cortes={cortes}
              getCorteIdByLabel={getCorteIdByLabel}
              pesos={pesos}
              onPesoChange={onPesoChange}
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
              disabled={!selectedItem || submitting}
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
