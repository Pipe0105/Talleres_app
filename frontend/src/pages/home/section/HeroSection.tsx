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
    label: "Órdenes coordinadas",
    value: "350+",
    helper: "desde faena a despacho",
  },
  {
    label: "Tiempo de respuesta",
    value: "2.3h",
    helper: "incidentes resueltos",
  },
  {
    label: "Cumplimiento sanitario",
    value: "100%",
    helper: "documentación al día",
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
                label="Plataforma para talleres cárnicos"
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
            <Typography variant="h3" component="h1" fontWeight={800}>
              Controla calidad, logística y producción desde un solo panel
            </Typography>
            <Typography
              variant="body1"
              sx={{ maxWidth: 520, color: "rgba(255,255,255,0.85)" }}
            >
              Unifica la trazabilidad sanitaria, los equipos de planta y la toma
              de decisiones con una vista centralizada y dinámica.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={RouterLink}
                to="/talleres"
                variant="contained"
                color="secondary"
                size="large"
              >
                Ver tablero en acción
              </Button>
              <Button
                component="a"
                href="mailto:contacto@talleres360.com"
                variant="outlined"
                color="inherit"
                size="large"
                sx={{ borderColor: "rgba(255,255,255,0.4)" }}
              >
                Hablar con un asesor
              </Button>
            </Stack>
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
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Estado actual
                  </Typography>
                  <Typography variant="h6">Taller Las Delicias</Typography>
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
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                • Cadena de frío estable • Lotes sanitarios validados • 6
                alertas resueltas esta semana
              </Typography>
              <Box>
                <Typography variant="caption" color="rgba(255,255,255,0.7)">
                  Avance diario
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    height: 8,
                    borderRadius: 999,
                    bgcolor: "rgba(255,255,255,0.16)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: "82%",
                      height: "100%",
                      bgcolor: "primary.main",
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  color="rgba(255,255,255,0.6)"
                  display="block"
                  mt={0.5}
                >
                  82% completado hoy
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                {heroMetrics.map((metric) => (
                  <Box key={metric.label} sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.7)">
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
