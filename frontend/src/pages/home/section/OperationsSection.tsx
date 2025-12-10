import { Grid, LinearProgress, Paper, Stack, Typography } from "@mui/material";

const maturityIndicators = [
  {
    label: "Eficiencia de producción",
    progress: 86,
    helper: "Control de mermas e integración de líneas",
  },
  {
    label: "Cumplimiento normativo",
    progress: 98,
    helper: "Auditorías y registros actualizados",
  },
  {
    label: "Sincronización logística",
    progress: 74,
    helper: "Despachos y cámaras en tiempo real",
  },
];

const OperationsSection = () => {
  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2" color="primary">
        Indicadores de madurez operativa
      </Typography>
      <Grid container spacing={3}>
        {maturityIndicators.map((indicator) => (
          <Grid item xs={12} md={4} key={indicator.label}>
            <Paper
              sx={(theme) => ({
                p: 3,
                height: "100%",
                boxShadow: "0px 14px 36px rgba(15,41,69,0.08)",
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.common.white,
              })}
            >
              {" "}
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                >
                  <Typography variant="subtitle1">{indicator.label}</Typography>
                  <Typography variant="body2" color="secondary">
                    {indicator.progress}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={indicator.progress}
                  sx={{ borderRadius: 999, height: 8 }}
                  color="primary"
                />
                <Typography variant="body2" color="text.secondary">
                  {indicator.helper}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default OperationsSection;
