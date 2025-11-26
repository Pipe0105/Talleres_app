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

const SubcorteCalculator = ({
  primaryLabel,
  secondaryCuts = DEFAULT_SECONDARY_CUTS,
  disabled = false,
}: SubcorteCalculatorProps) => {
  const [pesoInicial, setPesoInicial] = useState("");
  const [pesoFinal, setPesoFinal] = useState("");
  const [precioFinal, setPrecioFinal] = useState("");
  const [pesoBloqueado, setPesoBloqueado] = useState(false);
  const [subPesos, setSubPesos] = useState<Record<string, string>>({});
  const [subPrecios, setSubPrecios] = useState<Record<string, string>>({});

  const pesoInicialNumber = useMemo(
    () => parseInputNumber(pesoInicial),
    [pesoInicial]
  );

  const handlePesoInicialChange = (value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setPesoInicial(sanitized);
    setPesoBloqueado(false);
  };

  const handleSubPesoChange = (label: string, value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setSubPesos((prev) => ({ ...prev, [label]: sanitized }));
  };

  const handleSubPrecioChange = (label: string, value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setSubPrecios((prev) => ({ ...prev, [label]: sanitized }));
  };

  const handlePesoFinalChange = (value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setPesoFinal(sanitized);
  };

  const handlePrecioFinalChange = (value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setPrecioFinal(sanitized);
  };

  const uniqueSecondaryCuts = useMemo(() => {
    const seen = new Set<string>();

    return secondaryCuts.filter((cut) => {
      const key = cut.trim().toUpperCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [secondaryCuts]);

  useEffect(() => {
    setPesoInicial("");
    setPesoFinal("");
    setPrecioFinal("");
    setPesoBloqueado(false);
    setSubPesos({});
    setSubPrecios({});
  }, [primaryLabel, JSON.stringify(uniqueSecondaryCuts)]);

  const calculatePercentage = useCallback(
    (rawValue: string | undefined): number | null => {
      if (!pesoInicialNumber || pesoInicialNumber <= 0) {
        return null;
      }
      const parsed = parseInputNumber(rawValue);
      return parsed !== null ? (parsed / pesoInicialNumber) * 100 : null;
    },
    [pesoInicialNumber]
  );

  const calculateValor = useCallback(
    (
      pesoRaw: string | undefined,
      precioRaw: string | undefined
    ): number | null => {
      const peso = parseInputNumber(pesoRaw);
      const precio = parseInputNumber(precioRaw);

      if (peso === null || precio === null) {
        return null;
      }

      return peso * precio;
    },
    []
  );

  const subcorteDatos = useMemo(
    () =>
      uniqueSecondaryCuts.map((label) => ({
        label,
        porcentaje: calculatePercentage(subPesos[label]),
        valor: calculateValor(subPesos[label], subPrecios[label]),
      })),
    [
      uniqueSecondaryCuts,
      subPesos,
      subPrecios,
      calculatePercentage,
      calculateValor,
    ]
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

  const valorFinal = useMemo(
    () => calculateValor(pesoFinal, precioFinal),
    [calculateValor, pesoFinal, precioFinal]
  );

  const valorSubcortes = useMemo(
    () =>
      subcorteDatos
        .map((entry) => entry.valor)
        .filter((valor): valor is number => valor !== null)
        .reduce((acc, valor) => acc + valor, 0),
    [subcorteDatos]
  );

  const valorTotal = useMemo(
    () => (valorFinal !== null ? valorSubcortes + valorFinal : valorSubcortes),
    [valorFinal, valorSubcortes]
  );

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={600}>
        Desglose del corte principal
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Ingresa el peso total del corte {primaryLabel.toLowerCase()} y guarda el
        valor para habilitar los recortes asociados y el peso final.
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
        <Button
          variant={pesoBloqueado ? "outlined" : "contained"}
          color={pesoBloqueado ? "secondary" : "primary"}
          onClick={() =>
            setPesoBloqueado((prev) =>
              prev ? false : pesoInicialNumber !== null && pesoInicialNumber > 0
            )
          }
          disabled={disabled || (!pesoBloqueado && !puedeGuardarPeso)}
        >
          {pesoBloqueado ? "Editar peso" : "Guardar peso"}
        </Button>
      </Stack>

      {!pesoBloqueado && (
        <Alert severity="info">
          Ingresa el peso inicial para habilitar el registro de recortes.
        </Alert>
      )}

      {pesoBloqueado && (
        <Stack spacing={2}>
          <Divider textAlign="left">Subcortes vinculados</Divider>
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

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <TextField
                    label={`Precio de ${label}`}
                    value={subPrecios[label] ?? ""}
                    onChange={(event) =>
                      handleSubPrecioChange(label, event.target.value)
                    }
                    type="number"
                    inputProps={{ step: 100, min: 0 }}
                    helperText={`Monto asignado al ${label.toLowerCase()}`}
                    disabled={disabled}
                    fullWidth
                  />
                  <Chip
                    label={`Valor: ${formatCurrency(datos?.valor ?? null)}`}
                    color={datos?.valor ? "primary" : "default"}
                  />
                </Stack>
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

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <TextField
              label="Precio del corte final"
              value={precioFinal}
              onChange={(event) => handlePrecioFinalChange(event.target.value)}
              type="number"
              inputProps={{ step: 100, min: 0 }}
              helperText="Monto obtenido por el corte principal terminado"
              disabled={disabled}
              fullWidth
            />
            <Chip
              label={`Valor: ${formatCurrency(valorFinal)}`}
              color={valorFinal !== null ? "primary" : "default"}
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
              <Divider flexItem sx={{ my: 0.5 }} />
              <Typography>
                Valor de subcortes registrados:{" "}
                <strong>{formatCurrency(valorSubcortes || null)}</strong>
              </Typography>
              {valorFinal !== null && (
                <Typography>
                  Valor del corte final:{" "}
                  <strong>{formatCurrency(valorFinal)}</strong>
                </Typography>
              )}
              {(valorSubcortes > 0 || valorFinal) && (
                <Typography>
                  Valor total estimado:{" "}
                  <strong>{formatCurrency(valorTotal || null)}</strong>
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
