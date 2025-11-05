import { Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/home/Home";
import Talleres from "./pages/Talleres";

const App = () => {
  const location = useLocation();

  const navItems = [
    { label: "Inicio", to: "/", isActive: location.pathname === "/" },
    {
      label: "Talleres",
      to: "/talleres",
      isActive: location.pathname.startsWith("/talleres"),
    },
  ];

  return (
    <AppLayout navItems={navItems}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/talleres" element={<Talleres />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
