import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/home/Home";
import Talleres from "./pages/Talleres";
import TalleresDesposte from "./pages/TalleresDesposte";
import InformesHistoricos from "./pages/InformesHistoricos";
import ListaPrecios from "./pages/ListaPrecios";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import UsersAdmin from "./pages/admin/UsersAdmin";
import UserProfile from "./pages/UserProfile";
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
    displayName: displayName || "Usuario",
    currentPath: location.pathname,
  });

  if (loading) {
    return <LoadingScreen />;
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
    </AppLayout>
  );
};

export default App;
