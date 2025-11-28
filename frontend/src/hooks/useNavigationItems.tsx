import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
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
  displayName: string;
  currentPath?: string;
}

export const useNavigationItems = ({
  user,
  displayName,
  currentPath,
}: UseNavigationItemsOptions) => {
  const location = useLocation();
  const pathToUse = currentPath ?? location.pathname;

  return useMemo<NavigationItem[]>(() => {
    const navigationConfig: NavigationItem[] = [
      { label: "Inicio", to: "/" },
      ...(user
        ? [
            { label: "Desposte", to: "/talleres/desposte" },
            { label: "Informes", to: "/informes-historicos" },
            ...(user.is_admin || user.is_gerente
              ? [{ label: "Seguimiento", to: "/seguimiento-talleres" }]
              : []),
          ]
        : []),
      { label: "Lista de precios", to: "/lista-precios" },
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
              label: displayName || "Usuario",
              to: "/perfil",
              icon: <PersonOutlineIcon fontSize="small" />,
            },
            { label: "Cerrar sesión", to: "/logout" },
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
  }, [displayName, pathToUse, user]);
};
