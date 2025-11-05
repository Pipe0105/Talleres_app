import { Stack, Typography, Paper } from "@mui/material";

const TalleresDesposte = () => {
  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Talleres de Desposte
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona y consulta los talleres de desposte registrados en la
          plataforma. Desde aquí podrás acceder rápidamente a las herramientas
          principales para dar de alta nuevos procesos y revisar su estado.
        </Typography>
      </Paper>
    </Stack>
  );
};

export default TalleresDesposte;
