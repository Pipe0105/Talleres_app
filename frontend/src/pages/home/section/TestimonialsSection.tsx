import { Grid, Typography } from "@mui/material";
import { fadeUpDelayStyle } from "../../../utils/animations";
import LandingSection from "../../../components/cards/LandingSection";
import TestimonialCard from "../../../components/cards/TestimonialCard";
const testimonials = [
  {
    quote: "Ganamos visibilidad total de la cadena fría en tres plantas.",
    name: "Sandra Ríos",
    role: "Gerente de operaciones",
  },
  {
    quote: "Las alertas predictivas redujeron tiempos muertos en 18%.",
    name: "Ricardo Flores",
    role: "Director de planta",
  },
];

const TestimonialsSection = () => {
  return (
    <LandingSection
      title={
        <Typography variant="h4" component="h2">
          Historias reales de impacto
        </Typography>
      }
    >
      <Grid container spacing={3}>
        {testimonials.map((testimonial, index) => (
          <Grid item xs={12} md={6} key={testimonial.name}>
            <TestimonialCard
              quote={testimonial.quote}
              name={testimonial.name}
              role={testimonial.role}
              className="animate-fade-up"
              style={fadeUpDelayStyle(index * 120)}
            />
          </Grid>
        ))}
      </Grid>
    </LandingSection>
  );
};

export default TestimonialsSection;
