import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import { ReactNode, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { UserProfile } from "../types";

export interface NavigationItem {
  label: string;
  to?: string;
  isActive?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}

interface UseNavigationItemsOptions {
  user: UserProfile | null;
  currentPath?: string;
}

export const useNavigationItems = ({
  user,
  currentPath,
}: UseNavigationItemsOptions) => {
  const location = useLocation();
  const pathToUse = currentPath ?? location.pathname;

  return useMemo<NavigationItem[]>(() => {
    const navigationConfig: NavigationItem[] = [
      { label: "Lista de precios", to: "/lista-precios" },
      { label: "Talleres", to: "/talleres" },
      { label: "Seguimiento", to: "/talleres/seguimiento" },
      ...(user?.is_admin
        ? [
            {
              label: "Usuarios",
              to: "/usuarios",
            },
          ]
        : []),
      ...(user
        ? [
            {
              label: "Usuario", // 👈 fijo, genérico
              to: "/perfil",
            },
          ]
        : [{ label: "Iniciar sesión", to: "/login" }]),
    ];

    return navigationConfig.map((item) => {
      const isActive = item.to
        ? item.to === "/"
          ? pathToUse === "/"
          : pathToUse.startsWith(item.to)
        : false;
      return { ...item, isActive };
    });
  }, [pathToUse, user]);
};
