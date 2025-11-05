import { Grid, Paper, Stack, Typography, Chip, useTheme } from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import SensorsIcon from "@mui/icons-material/Sensors";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";

const capabilityPillars = [
  {
    icon: <SensorsIcon fontSize="large" color="primary" />,
    title: "Monitoreo en vivo",
    description: "Sensores e IoT conectados para trazabilidad total.",
    tag: "Tiempo real",
  },
  {
    icon: <PrecisionManufacturingIcon fontSize="large" color="primary" />,
    title: "Automatización inteligente",
    description: "Flujos que liberan tareas críticas sin intervención manual.",
    tag: "Rendimiento",
  },
  {
    icon: <InsightsIcon fontSize="large" color="primary" />,
    title: "Análisis predictivo",
    description:
      "KPIs que anticipan cuellos de botella y optimizan el rendimiento.",
    tag: "Analytics",
  },
];

const HighlightsSection = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3} mt={6}>
      <Typography variant="h4" component="h2">
        Capacidades clave
      </Typography>
      <Grid container spacing={3}>
        {capabilityPillars.map((pillar) => (
          <Grid item xs={12} md={4} key={pillar.title}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                border: `1px solid ${theme.palette.divider}`,
                display: "flex",
                flexDirection: "column",
                gap: 2,
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
