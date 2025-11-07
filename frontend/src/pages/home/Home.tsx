import { Stack, useTheme } from "@mui/material";
import HeroSection from "./section/HeroSection";
import HighlightsSection from "./section/HighlightsSection";
import OperationsSection from "./section/OperationsSection";
import TestimonialsSection from "./section/TestimonialsSection";
import CallToActionSection from "./section/CallToActionSection";
import { homeSectionsConfig } from "./homeSectionsConfig";

const Home = () => {
  const theme = useTheme();
  const {
    hero: mostrarHero,
    highlights: mostrarHighlights,
    operations: mostrarOperations,
    testimonials: mostrarTestimonials,
    callToAction: mostrarCallToAction,
  } = homeSectionsConfig;

  return (
    <Stack
      spacing={theme.layout.sectionSpacing}
      pb={theme.layout.sectionSpacing}
    >
      {" "}
      {mostrarHero && <HeroSection />}
      {mostrarHighlights && <HighlightsSection />}
      {mostrarOperations && <OperationsSection />}
      {mostrarTestimonials && <TestimonialsSection />}
      {mostrarCallToAction && <CallToActionSection />}
    </Stack>
  );
};

export default Home;
