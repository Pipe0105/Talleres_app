import { Divider, Stack, Typography } from "@mui/material";

interface InformesResumenProps {
  scope: "taller" | "sede" | "material" | "comparar";
  totalCortes: number;
  totalTalleres: number;
  totalPesoLabel: string;
  totalValorLabel: string;
}

const InformesResumen = ({
  scope,
  totalCortes,
  totalTalleres,
  totalPesoLabel,
  totalValorLabel,
}: InformesResumenProps) => (
  <>
    <Stack
      direction={{ xs: "column", md: "row" }}
      divider={<Divider flexItem orientation="vertical" />}
      spacing={2.5}
    >
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          {scope === "sede" || scope === "comparar" ? "Total talleres" : "Total cortes"}
        </Typography>
        <Typography variant="h6">
          {scope === "sede" || scope === "comparar" ? totalTalleres : totalCortes}
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          Peso filtrado
        </Typography>
        <Typography variant="h6">{totalPesoLabel} kg</Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          Valor estimado
        </Typography>
        <Typography variant="h6">{totalValorLabel}</Typography>
      </Stack>
    </Stack>

    <Divider sx={{ my: 2 }} />
  </>
);

export default InformesResumen;
