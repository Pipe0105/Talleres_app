import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/home/Home";
import Talleres from "./pages/Talleres";
import TalleresDesposte from "./pages/TalleresDesposte";
import InformesHistoricos from "./pages/InformesHistoricos";
import ListaPrecios from "./pages/ListaPrecios";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import UsersAdmin from "./pages/admin/UsersAdmin";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isLoginRoute = location.pathname === "/login";

  const navigationConfig = [
    { label: "Inicio", to: "/" },
    { label: "Desposte", to: "/talleres/desposte" },
    { label: "Informes", to: "/informes-historicos" },
    { label: "Lista de precios", to: "/lista-precios" },
    ...(user?.is_admin ? [{ label: "Usuarios", to: "/admin/usuarios" }] : []),
    user
      ? { label: "Cerrar sesión", to: "/logout" }
      : { label: "Iniciar sesión", to: "/login" },
  ];

  const navItems = navigationConfig.map((item) => {
    const isActive =
      item.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.to);
    return { ...item, isActive };
  });

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
        <Route
          path="/admin/usuarios"
          element={
            user ? (
              user.is_admin ? (
                <UsersAdmin />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/logout" element={<Logout />}></Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
