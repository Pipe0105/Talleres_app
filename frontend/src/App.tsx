import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/home/Home";
import Talleres from "./pages/Talleres";
import TalleresDesposte from "./pages/TalleresDesposte";
import InformesHistoricos from "./pages/InformesHistoricos";
import ListaPrecios from "./pages/ListaPrecios";
import Login from "./pages/Login";

const App = () => {
  const location = useLocation();
  const isLoginRoute = location.pathname === "/login";

  const navItems = [
    { label: "Inicio", to: "/", isActive: location.pathname === "/" },
    {
      label: "Iniciar sesión",
      to: "/login",
      isActive: location.pathname === "/login",
    },
  ];

  if (isLoginRoute) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout navItems={navItems}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/talleres" element={<Talleres />} />
        <Route path="/talleres/desposte" element={<TalleresDesposte />} />
        <Route path="/informes-historicos" element={<InformesHistoricos />} />
        <Route path="/lista-precios" element={<ListaPrecios />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
