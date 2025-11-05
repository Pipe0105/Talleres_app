import { Stack } from "@mui/material";
import HeroSection from "./section/HeroSection";
import HighlightsSection from "./section/HighlightsSection";
import OperationsSection from "./section/OperationsSection";
import TestimonialsSection from "./section/TestimonialsSection";
import CallToActionSection from "./section/CallToActionSection";

const Home = () => {
  return (
    <Stack spacing={6} pb={6}>
      <HeroSection />
      <HighlightsSection />
      <OperationsSection />
      <TestimonialsSection />
      <CallToActionSection />
    </Stack>
  );
};

export default Home;
