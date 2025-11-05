import { Paper, Stack, Typography } from "@mui/material";

const ListaPrecios = () => {
  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lista de Precios
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consulta la información de precios vigentes para cada producto. Esta
          vista servirá como base para futuras integraciones con el módulo de
          gestión comercial.
        </Typography>
      </Paper>
    </Stack>
  );
};

export default ListaPrecios;
