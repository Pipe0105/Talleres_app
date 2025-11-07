import { Grid, Paper, Stack, Typography, Chip, useTheme } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { Link as RouterLink } from "react-router-dom";
import { TextSnippet } from "@mui/icons-material";

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
      <Typography variant="h4" component="h2">
        Capacidades clave
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
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.customShadows.surface,
                backgroundImage: theme.gradients.subtle,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                textDecoration: "none",
                transition: theme.transitions.create(
                  ["box-shadow", "transform"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
                "&:hover": {
                  boxShadow: theme.customShadows.floating,
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Chip
                label={pillar.tag}
                color="primary"
                variant="outlined"
                sx={{ width: "fit-content" }}
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
