import { Grid, Typography } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { TextSnippet } from "@mui/icons-material";
import { fadeUpDelayStyle } from "../../../utils/animations";
import LandingSection from "../../../components/cards/LandingSection";
import FeatureCard from "../../../components/cards/FeatureCard";

const capabilityPillars = [
  {
    icon: <TextSnippet fontSize="large" color="primary" />,
    title: "Talleres Desposte",
    description: "Realizar el ingreso de nuevos talleres de desposte.",
    tag: "Inventario",
    to: "/talleres-plus",
  },
  {
    icon: <AssessmentIcon fontSize="large" color="primary" />,
    title: "Informes Historicos",
    description: "Generar reportes detallados de talleres realizados historicamente.",
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
  return (
    <LandingSection
      title={
        <Typography variant="h4" component="h2" color="primary">
          Funcionalidades Principales
        </Typography>
      }
    >
      <Grid container spacing={3}>
        {capabilityPillars.map((pillar, index) => (
          <Grid item xs={12} md={4} key={pillar.title}>
            <FeatureCard
              className="animate-fade-up"
              style={fadeUpDelayStyle(index * 120)}
              icon={pillar.icon}
              title={pillar.title}
              description={pillar.description}
              tag={pillar.tag}
              to={pillar.to}
            />
          </Grid>
        ))}
      </Grid>
    </LandingSection>
  );
};

export default HighlightsSection;
