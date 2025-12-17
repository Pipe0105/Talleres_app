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
      { label: "Talleres", to: "/talleres" },
      { label: "Seguimiento", to: "/talleres/seguimiento" },
      { label: "Informes", to: "/informes-historicos" },
      { label: "Lista de precios", to: "/lista-precios" },
      ...(user?.is_admin
        ? [
            {
              label: "Historial",
              to: "/talleres/historial",
            },
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

    const activeRoute = navigationConfig.reduce<string | null>(
      (current, item) => {
        if (!item.to) return current;

        const isMatch =
          item.to === "/"
            ? pathToUse === "/"
            : pathToUse === item.to || pathToUse.startsWith(`${item.to}/`);

        if (!isMatch) return current;

        if (!current) return item.to;

        return item.to.length > current.length ? item.to : current;
      },
      null
    );

    return navigationConfig.map((item) => {
      const isActive = activeRoute ? item.to === activeRoute : false;
      return { ...item, isActive };
    });
  }, [pathToUse, user]);
};
