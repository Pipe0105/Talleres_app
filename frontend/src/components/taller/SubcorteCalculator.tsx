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

interface SubcorteCalculatorProps {
  primaryLabel: string;
  secondaryCuts?: string[];
  disabled?: boolean;
}

const DEFAULT_SECONDARY_CUTS = ["Recorte", "Gordana"];

const formatPercentage = (value: number | null): string =>
  value !== null ? `${value.toFixed(2)}%` : "—";

const SubcorteCalculator = ({
  primaryLabel,
  secondaryCuts = DEFAULT_SECONDARY_CUTS,
  disabled = false,
}: SubcorteCalculatorProps) => {
  const [pesoInicial, setPesoInicial] = useState("");
  const [pesoFinal, setPesoFinal] = useState("");
  const [pesoBloqueado, setPesoBloqueado] = useState(false);
  const [subPesos, setSubPesos] = useState<Record<string, string>>({});

  useEffect(() => {
    setPesoInicial("");
    setPesoFinal("");
    setPesoBloqueado(false);
    setSubPesos({});
  }, [primaryLabel, JSON.stringify(secondaryCuts)]);

  const pesoInicialNumber = useMemo(() => {
    const parsed = Number(pesoInicial.replace(/,/g, "."));
    return Number.isFinite(parsed) ? parsed : null;
  }, [pesoInicial]);

  const handlePesoInicialChange = (value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setPesoInicial(sanitized);
    const numericValue = Number(sanitized.replace(/,/g, "."));
    setPesoBloqueado(Number.isFinite(numericValue) && numericValue > 0);
  };

  const handleSubPesoChange = (label: string, value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setSubPesos((prev) => ({ ...prev, [label]: sanitized }));
  };

  const handlePesoFinalChange = (value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setPesoFinal(sanitized);
  };

  const calculatePercentage = useCallback(
    (rawValue: string | undefined): number | null => {
      if (!pesoInicialNumber || pesoInicialNumber <= 0) {
        return null;
      }
      const parsed = Number(rawValue?.replace(/,/g, "."));
      if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
      }
      return (parsed / pesoInicialNumber) * 100;
    },
    [pesoInicialNumber]
  );

  const subcortePercentages = useMemo(
    () =>
      secondaryCuts.map((label) => ({
        label,
        porcentaje: calculatePercentage(subPesos[label]),
      })),
    [secondaryCuts, subPesos, calculatePercentage]
  );

  const porcentajeFinal = useMemo(
    () => calculatePercentage(pesoFinal),
    [pesoFinal, calculatePercentage]
  );

  const totalPorcentaje = useMemo(() => {
    const subcorteTotal = subcortePercentages
      .map((entry) => entry.porcentaje)
      .filter((value): value is number => value !== null)
      .reduce((acc, value) => acc + value, 0);

    return porcentajeFinal !== null
      ? subcorteTotal + porcentajeFinal
      : subcorteTotal;
  }, [porcentajeFinal, subcortePercentages]);

  const perdidaPorcentaje =
    pesoInicialNumber && totalPorcentaje > 0 ? 100 - totalPorcentaje : null;

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={600}>
        Desglose del corte principal
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Ingresa primero el peso total del corte {primaryLabel.toLowerCase()}{" "}
        para desbloquear los campos de recortes asociados (recorte y gordana) y
        el peso final después del taller.
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
        {pesoBloqueado && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setPesoBloqueado(false)}
            disabled={disabled}
          >
            Editar peso
          </Button>
        )}
      </Stack>

      {!pesoBloqueado && (
        <Alert severity="info">
          Ingresa el peso inicial para habilitar el registro de recortes.
        </Alert>
      )}

      {pesoBloqueado && (
        <Stack spacing={2}>
          <Divider textAlign="left">Subcortes vinculados</Divider>
          {secondaryCuts.map((label) => {
            const porcentaje = subcortePercentages.find(
              (entry) => entry.label === label
            )?.porcentaje;

            return (
              <Stack
                key={label}
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
                  label={formatPercentage(porcentaje ?? null)}
                  color={porcentaje !== null ? "success" : "default"}
                />
              </Stack>
            );
          })}

          <Divider textAlign="left">Peso final del corte</Divider>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <TextField
              label="Peso del corte después del taller"
              value={pesoFinal}
              onChange={(event) => handlePesoFinalChange(event.target.value)}
              type="number"
              inputProps={{ step: 0.001, min: 0 }}
              helperText="Peso del corte principal tras retirar recortes"
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
                  {formatPercentage(perdidaPorcentaje)}
                </Typography>
              )}
              {pesoInicialNumber && totalPorcentaje === 0 && (
                <Typography color="text.secondary">
                  Agrega los pesos de recorte, gordana y peso final para ver el
                  porcentaje consolidado.
                </Typography>
              )}
            </Stack>
          </Alert>
        </Stack>
      )}
    </Stack>
  );
};

export default SubcorteCalculator;
