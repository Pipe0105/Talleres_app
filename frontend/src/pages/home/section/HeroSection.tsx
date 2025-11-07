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
import { alpha } from "@mui/material/styles";

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
      sx={(theme) => ({
        p: { xs: 4, md: 6 },
        position: "relative",
        overflow: "hidden",
        backgroundImage: theme.gradients.hero,
        color: theme.palette.common.white,
        boxShadow: theme.customShadows.floating,
      })}
    >
      <Box
        sx={(theme) => ({
          position: "absolute",
          inset: 0,
          background: theme.gradients.heroOverlay,
          pointerEvents: "none",
        })}
      />
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={7}>
          <Stack spacing={3} position="relative" zIndex={1}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Chip
                label="Plataforma para Talleres"
                color="primary"
                variant="filled"
                sx={(theme) => ({
                  bgcolor: alpha(theme.palette.common.white, 0.16),
                  color: theme.palette.common.white,
                  borderColor: "transparent",
                })}
              />
              <Chip
                label="Dashboard operativo"
                variant="outlined"
                sx={(theme) => ({
                  borderColor: alpha(theme.palette.common.white, 0.4),
                  color: theme.palette.common.white,
                  bgcolor: alpha(theme.palette.common.white, 0.08),
                })}
              />
            </Stack>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontSize: { xs: 48, md: 76 },
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              Talleres Desposte
            </Typography>
            <Typography
              variant="body1"
              sx={(theme) => ({
                fontSize: { xs: 18, md: 24 },
                maxWidth: 900,
                color: alpha(theme.palette.common.white, 0.82),
              })}
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
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card
            sx={(theme) => ({
              p: 3,
              bgcolor: alpha(theme.palette.common.black, 0.35),
              border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
              backdropFilter: "blur(12px)",
              boxShadow: theme.customShadows.frosted,
            })}
          >
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="h6" color={alpha("#FFFFFF", 0.9)}>
                    {" "}
                    Estado actual
                  </Typography>
                </Box>
                <Chip
                  label="Operativo"
                  color="success"
                  variant="outlined"
                  sx={(theme) => ({
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    borderColor: alpha(theme.palette.success.main, 0.4),
                    color: alpha(theme.palette.success.light, 0.92),
                  })}
                />
              </Stack>
              <Typography variant="body1" color={alpha("#FFFFFF", 0.7)}>
                {" "}
                Resumen de métricas clave
              </Typography>
              <Box>
                <Typography
                  fontSize={20}
                  variant="caption"
                  color={alpha("#FFFFFF", 0.7)}
                >
                  Talleres Mensuales
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                {heroMetrics.map((metric) => (
                  <Box key={metric.label} sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        color: alpha("#CDE4FF", 0.98),
                        fontWeight: 700,
                      }}
                    >
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color={alpha("#FFFFFF", 0.9)}>
                      {" "}
                      {metric.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={alpha("#FFFFFF", 0.55)}
                    >
                      {" "}
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
