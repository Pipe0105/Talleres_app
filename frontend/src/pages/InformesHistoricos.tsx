import { Paper, Stack, Typography } from "@mui/material";

const InformesHistoricos = () => {
  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Informes Históricos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Accede a los informes históricos de talleres realizados en las sedes.
          Aquí podrás generar reportes detallados que te permitirán analizar el
          desempeño y la eficiencia de los procesos a lo largo del tiempo.
        </Typography>
      </Paper>
    </Stack>
  );
};

export default InformesHistoricos;
