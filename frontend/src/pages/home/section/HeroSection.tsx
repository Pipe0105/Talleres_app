import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Card, Chip, Grid, Stack, Typography, Paper } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ScaleOutlinedIcon from "@mui/icons-material/ScaleOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import { fadeUpDelayStyle } from "../../../utils/animations";

const summaryStats = [
  {
    label: "Entradas",
    value: "0",
    helper: "Semana actual",
    icon: <Inventory2OutlinedIcon />,
  },
  {
    label: "Kilos",
    value: "0",
    helper: "A la fecha",
    icon: <ScaleOutlinedIcon />,
  },
  {
    label: "Stock Disponible",
    value: "0",
    helper: "Inventario",
    icon: <LocalShippingOutlinedIcon />,
  },
  {
    label: "Tasa Promedio",
    value: "0%",
    helper: "Sedes",
    icon: <QueryStatsOutlinedIcon />,
  },
];

const HeroSection = () => {
  return (
    <Card
      className="animate-fade-up"
      sx={(theme) => ({
        p: { xs: 3, md: 4 },
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
        backgroundImage: theme.gradients.hero,
        boxShadow: theme.customShadows.surface,
      })}
    >
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Stack spacing={1}>
            <Chip
              label="Dashboard operativo"
              sx={(theme) => ({
                alignSelf: "flex-start",
                bgcolor: alpha(theme.palette.secondary.main, 0.12),
                color: theme.palette.secondary.main,
                fontWeight: 700,
              })}
            />
            <Typography
              variant="h3"
              component="h1"
              sx={(theme) => ({
                fontWeight: 800,
                color: theme.palette.primary.main,
              })}
            >
              Talleres Desposte
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={760}>
              Ingreso, gestión y reporte histórico de talleres de desposte. Mantén el panel al día
              con un vistazo rápido de las métricas principales.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={RouterLink}
                to="/talleres-plus"
                variant="contained"
                color="primary"
                size="large"
                sx={{ fontWeight: 700, px: 3 }}
              >
                Ir al tablero de talleres
              </Button>
              <Button
                component={RouterLink}
                to="/talleres-plus"
                variant="outlined"
                color="primary"
                size="large"
                sx={{ fontWeight: 700, px: 3 }}
              >
                Registrar desposte
              </Button>
            </Stack>
          </Stack>
          <Card
            sx={(theme) => ({
              minWidth: 280,
              p: 2.5,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
              backgroundColor: alpha(theme.palette.common.white, 0.9),
              boxShadow: theme.customShadows.surface,
            })}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Estado general
              </Typography>
              <Typography variant="h5" color="primary" fontWeight={800}>
                Operativo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mantén la trazabilidad al día para todas las sedes.
              </Typography>
            </Stack>
          </Card>
        </Stack>
        <Grid container spacing={2}>
          {summaryStats.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <Paper
                className="animate-fade-up"
                style={fadeUpDelayStyle(index * 80)}
                sx={(theme) => ({
                  p: 2.5,
                  height: "100%",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  boxShadow: "0px 16px 40px rgba(15,41,69,0.08)",
                  borderRadius: 12,
                  backgroundColor: theme.palette.common.white,
                })}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={(theme) => ({
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(theme.palette.secondary.main, 0.12),
                      color: theme.palette.secondary.main,
                    })}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.helper}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Card>
  );
};

export default HeroSection;
