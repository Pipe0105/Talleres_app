import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requiresAdmin?: boolean;
  requiresManager?: boolean;
  requiresUserAdmin?: boolean;
  unauthorizedRedirectTo?: string;
}

const ProtectedRoute = ({
  children,
  redirectTo = "/login",
  requiresAdmin = false,
  requiresUserAdmin = false,
  requiresManager = false,
  unauthorizedRedirectTo = "/",
}: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiresAdmin && !user.is_admin) {
    return <Navigate to={unauthorizedRedirectTo} replace />;
  }

  if (requiresManager && !(user.is_admin || user.is_gerente || user.is_coordinator)) {
    return <Navigate to={unauthorizedRedirectTo} replace />;
  }
  if (requiresUserAdmin && !(user.is_admin || user.is_branch_admin)) {
    return <Navigate to={unauthorizedRedirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
