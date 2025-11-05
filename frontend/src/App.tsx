import { Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/home/Home";
import Talleres from "./pages/Talleres";
import TalleresDesposte from "./pages/TalleresDesposte";
import InformesHistoricos from "./pages/InformesHistoricos";
import ListaPrecios from "./pages/ListaPrecios";

const App = () => {
  const location = useLocation();

  const navItems = [
    { label: "Inicio", to: "/", isActive: location.pathname === "/" },
  ];

  return (
    <AppLayout navItems={navItems}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/talleres" element={<Talleres />} />
        <Route path="/talleres/desposte" element={<TalleresDesposte />} />
        <Route path="/informes-historicos" element={<InformesHistoricos />} />
        <Route path="/lista-precios" element={<ListaPrecios />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
