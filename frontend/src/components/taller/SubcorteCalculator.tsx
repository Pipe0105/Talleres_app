import { useMemo } from "react";
import {
  Alert,
  AlertTitle,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { corte } from "../../types";
import { sanitizeInput } from "../../utils/security";

interface SubcorteCalculatorProps {
  cortes: corte[];
  pesos: Record<string, string>;
  disabled?: boolean;
  finalLabel?: string;
  onPesoChange?: (corteId: string, value: string) => void;
}

const parsePesoValue = (value?: string): number | null => {
  if (!value?.trim()) {
    return null;
  }
  const normalized = value.replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const formatPercentage = (value: number | null): string =>
  value !== null ? `${value.toFixed(2)}%` : "—";

const SubcorteCalculator = ({
  cortes,
  pesos,
  disabled = false,
  finalLabel = "Peso luego del taller",
  onPesoChange,
}: SubcorteCalculatorProps) => {
  const primaryCorte = cortes[0];
  const finalCorte = cortes[cortes.length - 1];
  const subcortes = cortes.slice(1, -1);

  const primaryPeso = parsePesoValue(
    primaryCorte ? pesos[primaryCorte.id] : ""
  );
  const subcorteDatos = useMemo(
    () =>
      subcortes.map((corte) => {
        const peso = parsePesoValue(pesos[corte.id]);
        const porcentaje =
          primaryPeso && primaryPeso > 0
            ? ((peso ?? 0) / primaryPeso) * 100
            : null;

        return {
          corte,
          peso,
          porcentaje,
        };
      }),
    [primaryPeso, subcortes, pesos]
  );

  const porcentajeFinal = useMemo(() => {
    if (!finalCorte) {
      return null;
    }
    const peso = parsePesoValue(pesos[finalCorte.id]);
    return primaryPeso && primaryPeso > 0 && peso !== null
      ? (peso / primaryPeso) * 100
      : null;
  }, [finalCorte, pesos, primaryPeso]);

  const totalPorcentaje = useMemo(() => {
    const subTotal = subcorteDatos.reduce((acc, current) => {
      return acc + (current.porcentaje ?? 0);
    }, 0);

    return porcentajeFinal !== null ? subTotal + porcentajeFinal : subTotal;
  }, [porcentajeFinal, subcorteDatos]);

  const perdidaPorcentaje =
    primaryPeso && totalPorcentaje > 0 ? 100 - totalPorcentaje : null;

  const handleChange = (corteId: string, value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    onPesoChange?.(corteId, sanitized);
  };

  if (!primaryCorte || !finalCorte) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={600}>
        Peso del corte seleccionado
      </Typography>

      <TextField
        label={`Peso de ${primaryCorte.nombre_corte}`}
        value={pesos[primaryCorte.id] ?? ""}
        onChange={(event) => handleChange(primaryCorte.id, event.target.value)}
        type="number"
        inputProps={{ step: 0.001, min: 0 }}
        helperText="Peso inicial del corte principal en kilogramos"
        disabled={disabled}
        fullWidth
      />

      {subcortes.length > 0 && (
        <>
          <Divider textAlign="left">Subcortes</Divider>
          <Stack spacing={2}>
            {subcortes.map((corte) => {
              const data = subcorteDatos.find(
                (entry) => entry.corte.id === corte.id
              );
              const porcentaje = data?.porcentaje ?? null;

              return (
                <Stack key={corte.id} spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <TextField
                      label={`Peso de ${corte.nombre_corte}`}
                      value={pesos[corte.id] ?? ""}
                      onChange={(event) =>
                        handleChange(corte.id, event.target.value)
                      }
                      type="number"
                      inputProps={{ step: 0.001, min: 0 }}
                      helperText={`Peso registrado para ${corte.nombre_corte.toLowerCase()}`}
                      disabled={disabled}
                      fullWidth
                    />
                    <Chip
                      label={formatPercentage(porcentaje)}
                      color={porcentaje !== null ? "success" : "default"}
                    />
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </>
      )}

      <Divider textAlign="left">{finalLabel}</Divider>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <TextField
          label={finalLabel}
          value={pesos[finalCorte.id] ?? ""}
          onChange={(event) => handleChange(finalCorte.id, event.target.value)}
          type="number"
          inputProps={{ step: 0.001, min: 0 }}
          helperText={`Peso reportado para ${finalCorte.nombre_corte}`}
          disabled={disabled}
          fullWidth
        />
        <Chip
          label={formatPercentage(porcentajeFinal)}
          color={porcentajeFinal !== null ? "primary" : "default"}
        />
      </Stack>

      <Alert severity="info">
        <AlertTitle>Resumen de porcentajes</AlertTitle>
        <Stack spacing={0.5}>
          <Typography>
            Porcentaje total calculado:{" "}
            <strong>{formatPercentage(totalPorcentaje)}</strong>
          </Typography>
          {perdidaPorcentaje !== null && (
            <Typography>
              Pérdida estimada frente al peso inicial:{" "}
              <strong style={{ color: "#FF0000" }}>
                {formatPercentage(perdidaPorcentaje)}
              </strong>
            </Typography>
          )}
        </Stack>
      </Alert>
    </Stack>
  );
};

export default SubcorteCalculator;
