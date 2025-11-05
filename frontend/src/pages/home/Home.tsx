import { Stack } from "@mui/material";
import HeroSection from "./section/HeroSection";
import HighlightsSection from "./section/HighlightsSection";
import OperationsSection from "./section/OperationsSection";
import TestimonialsSection from "./section/TestimonialsSection";
import CallToActionSection from "./section/CallToActionSection";

const Home = () => {
  // 👇 Cambia estos valores para mostrar u ocultar secciones
  const mostrarHero = true;
  const mostrarHighlights = true; // ❌ Oculto
  const mostrarOperations = false;
  const mostrarTestimonials = false;
  const mostrarCallToAction = false;

  return (
    <Stack spacing={6} pb={6}>
      {mostrarHero && <HeroSection />}
      {mostrarHighlights && <HighlightsSection />}
      {mostrarOperations && <OperationsSection />}
      {mostrarTestimonials && <TestimonialsSection />}
      {mostrarCallToAction && <CallToActionSection />}
    </Stack>
  );
};

export default Home;
