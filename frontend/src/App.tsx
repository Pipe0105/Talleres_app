import { Box } from "@mui/material";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/home/Home";
import ListaPrecios from "./pages/ListaPrecios";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import UsersAdmin from "./pages/admin/UsersAdmin";
import UserProfile from "./pages/UserProfile";
import CreateTaller from "./pages/talleres/CreateTaller";
import SeguimientoTalleres from "./pages/talleres/SeguimientoTalleres";
import HistorialTalleres from "./pages/talleres/HistorialTalleres";
import InformesHistoricos from "./pages/InformesHistoricos";
import { useAuth } from "./context/AuthContext";
import LoadingScreen from "./components/LoadingScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import { useNavigationItems } from "./hooks/useNavigationItems";

const App = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isLoginRoute = location.pathname === "/login";
  const displayName = user?.full_name?.trim() || user?.email;

  const navItems = useNavigationItems({
    user,
    currentPath: location.pathname,
  });

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user && !isLoginRoute) {
    return <Navigate to="/login" replace />;
  }

  if (isLoginRoute) {
    return (
      <div className="page-fade" key="login">
        <Routes>
          <Route path="/login" element={<Login />}></Route>
          <Route path="*" element={<Navigate to="login" replace />}></Route>
        </Routes>
      </div>
    );
  }

  return (
    <div className="page-fade">
      <AppLayout navItems={navItems}>
        <Box key={location.pathname} className="animate-fade-up">
          <Routes location={location}>
            <Route />
            <Route path="/" element={<Home />}></Route>
            <Route path="/lista-precios" element={<ListaPrecios />} />
            <Route
              path="/talleres"
              element={
                <ProtectedRoute>
                  <CreateTaller />
                </ProtectedRoute>
              }
            />
            <Route
              path="/talleres/seguimiento"
              element={
                <ProtectedRoute>
                  <SeguimientoTalleres />
                </ProtectedRoute>
              }
            />
            <Route
              path="/talleres/historial"
              element={
                <ProtectedRoute requiresAdmin unauthorizedRedirectTo="/">
                  <HistorialTalleres />
                </ProtectedRoute>
              }
            />
            <Route
              path="/informes-historicos"
              element={
                <ProtectedRoute>
                  <InformesHistoricos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requiresAdmin unauthorizedRedirectTo="/">
                  <UsersAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/usuarios"
              element={<Navigate to="/usuarios" replace />}
            />
            <Route path="/logout" element={<Logout />}></Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </AppLayout>
    </div>
  );
};

export default App;
