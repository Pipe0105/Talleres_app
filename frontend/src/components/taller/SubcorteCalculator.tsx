import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Button,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { sanitizeInput } from "../../utils/security";
import { corte } from "../../types";

interface SubcorteCalculatorProps {
  primaryLabel: string;
  secondaryCuts?: string[];
  disabled?: boolean;
  finalLabel?: string;
  cortes: corte[]; // 👈 CORTES REALES DEL BACKEND
  onPesoChange?: (corteId: string, value: string) => void;
  getCorteIdByLabel?: (label: string) => string | null;
  pesos: Record<string, string>;
}

const DEFAULT_SECONDARY_CUTS = ["Recorte", "Gordana"];

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatPercentage = (value: number | null): string =>
  value !== null ? `${value.toFixed(2)}%` : "—";

const formatCurrency = (value: number | null): string =>
  value !== null ? currencyFormatter.format(value) : "—";

const parseInputNumber = (value?: string): number | null => {
  const parsed = Number(value?.replace(/,/g, "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

const normalize = (s: string) =>
  s
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

export default function SubcorteCalculator({
  primaryLabel,
  secondaryCuts = DEFAULT_SECONDARY_CUTS,
  disabled = false,
  finalLabel,
  cortes,
  onPesoChange,
  getCorteIdByLabel,
  pesos,
}: SubcorteCalculatorProps) {
  const [botonOculto, setBotonOculto] = useState(false);
  const [pesoInicial, setPesoInicial] = useState("");
  const [botonPresionado, setBotonPresionado] = useState(false);
  const [pesoFinal, setPesoFinal] = useState("");
  const [pesoBloqueado, setPesoBloqueado] = useState(false);
  const [subPesos, setSubPesos] = useState<Record<string, string>>({});

  const resolveCorteId = useCallback(
    (label: string): string | null => {
      if (getCorteIdByLabel) {
        return getCorteIdByLabel(label);
      }
      const normLabel = normalize(label);
      const found = cortes.find((c) => {
        const normalizedCorte = normalize(c.nombre_corte);
        return (
          normalizedCorte === normLabel ||
          normalizedCorte.includes(normLabel) ||
          normLabel.includes(normalizedCorte)
        );
      });
      return found ? String(found.id) : null;
    },
    [cortes, getCorteIdByLabel]
  );

  const pesoInicialNumber = useMemo(
    () => parseInputNumber(pesoInicial),
    [pesoInicial]
  );

  const handlePesoInicialChange = (value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setPesoInicial(sanitized);

    const id = resolveCorteId(primaryLabel);
    if (typeof id === "string") {
      onPesoChange?.(id, sanitized);
    }

    setPesoBloqueado(false);
  };

  const handleSubPesoChange = (label: string, value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setSubPesos((prev) => ({ ...prev, [label]: sanitized }));

    const id = resolveCorteId(label);
    if (typeof id === "string") {
      onPesoChange?.(id, sanitized);
    }
  };

  const handlePesoFinalChange = (value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setPesoFinal(sanitized);

    const labelFinal = finalLabel?.trim() || `${primaryLabel} FINAL`;
    const id = resolveCorteId(labelFinal);
    if (typeof id === "string") {
      onPesoChange?.(id, sanitized);
    }
  };

  const uniqueSecondaryCuts = useMemo(() => {
    const seen = new Set<string>();
    return secondaryCuts.filter((cut) => {
      const key = normalize(cut);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [secondaryCuts]);

  useEffect(() => {
    const primaryId = resolveCorteId(primaryLabel);
    const finalId = resolveCorteId(
      finalLabel?.trim() || `${primaryLabel} FINAL`
    );

    setPesoInicial(primaryId ? pesos[primaryId] ?? "" : "");
    setPesoFinal(finalId ? pesos[finalId] ?? "" : "");

    setSubPesos((prev) => {
      const next: Record<string, string> = {};
      uniqueSecondaryCuts.forEach((label) => {
        const corteId = resolveCorteId(label);
        next[label] = corteId ? pesos[corteId] ?? "" : prev[label] ?? "";
      });
      return next;
    });
  }, [finalLabel, pesos, primaryLabel, resolveCorteId, uniqueSecondaryCuts]);

  useEffect(() => {
    setPesoInicial("");
    setPesoFinal("");
    setPesoBloqueado(false);
    setSubPesos({});
  }, [primaryLabel, JSON.stringify(uniqueSecondaryCuts)]);

  const calculatePercentage = useCallback(
    (rawValue: string | undefined): number | null => {
      if (!pesoInicialNumber || pesoInicialNumber <= 0) return null;
      const parsed = parseInputNumber(rawValue);
      return parsed !== null ? (parsed / pesoInicialNumber) * 100 : null;
    },
    [pesoInicialNumber]
  );

  const subcorteDatos = useMemo(
    () =>
      uniqueSecondaryCuts.map((label) => ({
        label,
        porcentaje: calculatePercentage(subPesos[label]),
      })),
    [uniqueSecondaryCuts, subPesos, calculatePercentage]
  );

  const porcentajeFinal = useMemo(
    () => calculatePercentage(pesoFinal),
    [pesoFinal, calculatePercentage]
  );

  const totalPorcentaje = useMemo(() => {
    const subcorteTotal = subcorteDatos
      .map((entry) => entry.porcentaje)
      .filter((value): value is number => value !== null)
      .reduce((acc, value) => acc + value, 0);

    return porcentajeFinal !== null
      ? subcorteTotal + porcentajeFinal
      : subcorteTotal;
  }, [porcentajeFinal, subcorteDatos]);

  const perdidaPorcentaje =
    pesoInicialNumber && totalPorcentaje > 0 ? 100 - totalPorcentaje : null;

  const puedeGuardarPeso =
    pesoInicialNumber !== null && pesoInicialNumber > 0 && !pesoBloqueado;

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={600}>
        Peso del corte seleccionado
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
      >
        <TextField
          label={`Peso de ${primaryLabel}`}
          value={pesoInicial}
          onChange={(event) => handlePesoInicialChange(event.target.value)}
          type="number"
          inputProps={{ step: 0.001, min: 0 }}
          helperText="Peso inicial del corte principal en kilogramos"
          disabled={disabled || pesoBloqueado}
          fullWidth
        />

        {!botonOculto && (
          <Button
            variant={pesoBloqueado ? "outlined" : "contained"}
            color={pesoBloqueado ? "secondary" : "primary"}
            onClick={() => {
              setPesoBloqueado((prev) =>
                prev
                  ? false
                  : pesoInicialNumber !== null && pesoInicialNumber > 0
              );
              setBotonOculto(true);
            }}
            disabled={disabled || (!pesoBloqueado && !puedeGuardarPeso)}
          >
            {pesoBloqueado ? "Editar peso" : "Guardar peso"}
          </Button>
        )}
      </Stack>

      {!pesoBloqueado && (
        <Alert severity="info">
          Ingresa el peso inicial para habilitar los subcortes.
        </Alert>
      )}

      {pesoBloqueado && (
        <Stack spacing={2}>
          <Divider textAlign="left">Subcortes</Divider>

          {uniqueSecondaryCuts.map((label) => {
            const datos = subcorteDatos.find((entry) => entry.label === label);
            const porcentaje = datos?.porcentaje ?? null;

            return (
              <Stack key={label} spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <TextField
                    label={`Peso de ${label}`}
                    value={subPesos[label] ?? ""}
                    onChange={(event) =>
                      handleSubPesoChange(label, event.target.value)
                    }
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                    helperText={`Peso registrado para ${label.toLowerCase()}`}
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

          <Divider textAlign="left">Peso luego del taller</Divider>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              label="Peso final del taller"
              value={pesoFinal}
              onChange={(event) => handlePesoFinalChange(event.target.value)}
              type="number"
              inputProps={{ step: 0.001, min: 0 }}
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
            <Typography>
              Total: <strong>{formatPercentage(totalPorcentaje)}</strong>
            </Typography>

            {perdidaPorcentaje !== null && (
              <Typography>
                Pérdida estimada:{" "}
                <strong style={{ color: "red" }}>
                  {formatPercentage(perdidaPorcentaje)}
                </strong>
              </Typography>
            )}
          </Alert>
        </Stack>
      )}
    </Stack>
  );
}
