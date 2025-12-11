import { Avatar, Grid, Paper, Stack, Typography } from "@mui/material";
import { fadeUpDelayStyle } from "../../../utils/animations";
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

const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const TestimonialsSection = () => {
  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        Historias reales de impacto
      </Typography>
      <Grid container spacing={3}>
        {testimonials.map((testimonial, index) => (
          <Grid item xs={12} md={6} key={testimonial.name}>
            <Paper
              className="animate-fade-up"
              style={fadeUpDelayStyle(index * 120)}
              sx={(theme) => ({
                p: 3,
                height: "100%",
                boxShadow: theme.customShadows.surface,
                backgroundImage: theme.gradients.subtle,
              })}
            >
              {" "}
              <Stack spacing={2}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  “{testimonial.quote}”
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    {initials(testimonial.name)}
                  </Avatar>
                  <div>
                    <Typography variant="subtitle1">
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.role}
                    </Typography>
                  </div>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default TestimonialsSection;
