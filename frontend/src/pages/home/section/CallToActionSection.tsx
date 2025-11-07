import { Link as RouterLink } from "react-router-dom";
import { Button, Card, Stack, Typography } from "@mui/material";

const CallToActionSection = () => {
  return (
    <Card
      sx={(theme) => ({
        p: { xs: 4, md: 6 },
        textAlign: "center",
        backgroundImage: theme.gradients.callout,
        boxShadow: theme.customShadows.floating,
      })}
    >
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4" component="h2">
          Potencia tus operaciones hoy mismo
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={520}>
          Agenda una sesión con nuestro equipo y descubre cómo digitalizar
          controles, automatizar reportes y mantener la trazabilidad total.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={1}>
          <Button
            component={RouterLink}
            to="/talleres"
            variant="contained"
            color="primary"
          >
            Explorar tablero
          </Button>
          <Button
            component="a"
            href="mailto:contacto@talleres360.com"
            variant="outlined"
            color="secondary"
          >
            Hablar con un asesor
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

export default CallToActionSection;
