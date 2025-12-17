import { Grid, Typography } from "@mui/material";
import { fadeUpDelayStyle } from "../../../utils/animations";
import LandingSection from "../../../components/cards/LandingSection";
import ProgressCard from "../../../components/cards/ProgressCard";
const maturityIndicators = [
  {
    label: "Eficiencia de producción",
    progress: 86,
    helper: "Control de mermas e integración de líneas",
  },
  {
    label: "Cumplimiento normativo",
    progress: 98,
    helper: "Auditorías y registros actualizados",
  },
  {
    label: "Sincronización logística",
    progress: 74,
    helper: "Despachos y cámaras en tiempo real",
  },
];

const OperationsSection = () => {
  return (
    <LandingSection
      title={
        <Typography variant="h4" component="h2" color="primary">
          Indicadores de madurez operativa
        </Typography>
      }
    >
      <Grid container spacing={3}>
        {maturityIndicators.map((indicator, index) => (
          <Grid item xs={12} md={4} key={indicator.label}>
            <ProgressCard
              title={indicator.label}
              value={indicator.progress}
              helper={indicator.helper}
              className="animate-fade-up"
              style={fadeUpDelayStyle(index * 140)}
            />
          </Grid>
        ))}
      </Grid>
    </LandingSection>
  );
};

export default OperationsSection;
