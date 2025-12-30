import { Assessment, CheckCircle } from "@mui/icons-material";
import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { formatKg, formatPercent } from "../../utils/weights";

interface WeightSummaryCardsProps {
  hasPesoInicial: boolean;
  pesoInicial: number;
  totalProcesado: number;
  perdida: number;
  porcentajePerdida: number;
}

const WeightSummaryCards = ({
  hasPesoInicial,
  pesoInicial,
  totalProcesado,
  perdida,
  porcentajePerdida,
}: WeightSummaryCardsProps) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            borderRadius: 3,
            bgcolor: "rgba(16, 185, 129, 0.05)",
            borderColor: "rgba(16, 185, 129, 0.18)",
          }}
        >
          <CardContent>
            <Stack spacing={1}>
              <Typography color="success.main" fontWeight={700}>
                Peso inicial
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {hasPesoInicial ? `${formatKg(pesoInicial)} kg` : "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Guarda este valor para habilitar los subcortes.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            borderRadius: 3,
            bgcolor: "rgba(59, 130, 246, 0.05)",
            borderColor: "rgba(59, 130, 246, 0.18)",
          }}
        >
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Assessment fontSize="small" color="primary" />
                <Typography color="primary" fontWeight={700}>
                  Proceso actual
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={800}>
                {formatKg(totalProcesado)} kg
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Subcortes + corte final registrados.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            borderRadius: 3,
            bgcolor: "rgba(239, 68, 68, 0.05)",
            borderColor: "rgba(239, 68, 68, 0.18)",
          }}
        >
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle fontSize="small" color="error" />
                <Typography color="error" fontWeight={700}>
                  Pérdida estimada
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={800} color="error">
                {formatKg(perdida)} kg
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatPercent(porcentajePerdida)}% del peso inicial.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default WeightSummaryCards;
