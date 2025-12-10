import { Grid, Paper, Stack, Typography, Chip, useTheme } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { Link as RouterLink } from "react-router-dom";
import { TextSnippet, ThreeMp } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

const capabilityPillars = [
  {
    icon: <TextSnippet fontSize="large" color="primary" />,
    title: "Talleres Desposte",
    description: "Realizar el ingreso de nuevos talleres de desposte.",
    tag: "Inventario",
    to: "/talleres/desposte",
  },
  {
    icon: <AssessmentIcon fontSize="large" color="primary" />,
    title: "Informes Historicos",
    description:
      "Generar reportes detallados de talleres realizados historicamente.",
    tag: "Historial",
    to: "/informes-historicos",
  },
  {
    icon: <AttachMoneyIcon fontSize="large" color="primary" />,
    title: "Lista de Precios",
    description: "Acceder a la lista actualizada de precios para cada item.",
    tag: "Precios",
    to: "/lista-precios",
  },
];

const HighlightsSection = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2" color="primary">
        Funcionalidades Principales
      </Typography>
      <Grid container spacing={3}>
        {capabilityPillars.map((pillar) => (
          <Grid item xs={12} md={4} key={pillar.title}>
            <Paper
              elevation={0}
              component={RouterLink}
              to={pillar.to}
              sx={{
                p: 3,
                height: "100%",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                boxShadow: "0px 14px 36px rgba(15,41,69,0.08)",
                backgroundColor: theme.palette.common.white,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                textDecoration: "none",
                transition: theme.transitions.create([
                  "box-shadow",
                  "transform",
                  "border-color",
                ]),
                "&:hover": {
                  boxShadow: theme.customShadows.floating,
                  transform: "translateY(-6px)",
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                },
              }}
            >
              <Chip
                label={pillar.tag}
                color="secondary"
                variant="outlined"
                sx={{ width: "fit-content", fontWeight: 700 }}
              />
              {pillar.icon}
              <Typography variant="h6">{pillar.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {pillar.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default HighlightsSection;
