import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

const heroMetrics = [
  {
    label: "Talleres realizados",
    value: "0",
    helper: "En todas las sedes",
  },
  {
    label: "Porcentaje de Aprovechamiento",
    value: "0%",
    helper: "En todas las sedes",
  },
];

const HeroSection = () => {
  return (
    <Card
      sx={{
        p: { xs: 4, md: 6 },
        position: "relative",
        overflow: "hidden",
        backgroundImage:
          "linear-gradient(140deg, rgba(15,132,255,0.95) 0%, rgba(0,40,77,0.95) 100%)",
        color: "common.white",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={7}>
          <Stack spacing={3} position="relative" zIndex={1}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Chip
                label="Plataforma para Talleres"
                color="primary"
                variant="filled"
                sx={{
                  bgcolor: "rgba(255,255,255,0.16)",
                  color: "common.white",
                }}
              />
              <Chip
                label="Dashboard operativo"
                variant="outlined"
                sx={{
                  borderColor: "rgba(255,255,255,0.4)",
                  color: "common.white",
                }}
              />
            </Stack>
            <Typography
              variant="h3"
              component="h1"
              fontSize={76}
              fontWeight={800}
            >
              Talleres Desposte
            </Typography>
            <Typography
              variant="body1"
              fontSize={24.5}
              sx={{ maxWidth: 900, color: "rgba(255,255,255,0.85)" }}
            >
              Ingreso, gestion y Reporte historico de Talleres de Desposte.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={RouterLink}
                to="/talleres"
                variant="contained"
                color="secondary"
                size="large"
                sx={{ fontWeight: 700 }}
              >
                Ir al tablero de talleres
              </Button>
              <Button
                component={RouterLink}
                to="/talleres/desposte"
                variant="outlined"
                color="inherit"
                size="large"
                sx={{ fontWeight: 700 }}
              >
                Registrar desposte
              </Button>
            </Stack>{" "}
          </Stack>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              p: 3,
              bgcolor: "rgba(4,15,31,0.75)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="h6" color="rgba(255,255,255,0.9)">
                    Estado actual
                  </Typography>
                </Box>
                <Chip
                  label="Operativo"
                  color="success"
                  variant="outlined"
                  sx={{
                    bgcolor: "rgba(56, 142, 60, 0.15)",
                    borderColor: "rgba(76, 175, 80, 0.4)",
                    color: "#C8FACC",
                  }}
                />
              </Stack>
              <Typography variant="body1" color="rgba(255,255,255,0.7)">
                Resumen de métricas clave
              </Typography>
              <Box>
                <Typography
                  fontSize={20}
                  variant="caption"
                  color="rgba(255,255,255,0.7)"
                >
                  Talleres Mensuales
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                {heroMetrics.map((metric) => (
                  <Box key={metric.label} sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      color="rgba(165,200,233,1)"
                      fontWeight={700}
                    >
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.9)">
                      {metric.label}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      {metric.helper}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Card>
  );
};

export default HeroSection;
