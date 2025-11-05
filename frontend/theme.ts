// theme.ts
import { createTheme, rem } from "@mantine/core";

export const dashboardTheme = createTheme({
  /** === Colores de marca === */
  colors: {
    brand: [
      "#e0f2ff", // 0
      "#b8e0ff",
      "#8ccaff",
      "#5eb3ff",
      "#339cff",
      "#0f84ff", // 5 principal
      "#006fe6",
      "#0057b3",
      "#004080",
      "#00284d",
    ],
    dark: [
      "#f8fafc",
      "#f1f5f9",
      "#e2e8f0",
      "#cbd5e1",
      "#94a3b8",
      "#64748b",
      "#475569",
      "#334155",
      "#1e293b",
      "#0f172a", // fondo base
    ],
  },

  /** === Configuración global === */
  primaryColor: "brand",
  primaryShade: 5,

  /** === Tipografía === */
  fontFamily: "Inter, system-ui, sans-serif",
  headings: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: "700",
  },

  /** === Espaciado, sombras y radios === */
  defaultRadius: "md",
  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.25)",
    md: "0 4px 10px rgba(0,0,0,0.25)",
    xl: "0 8px 24px rgba(0,0,0,0.4)",
  },

  /** === Componentes personalizados === */
  components: {
    Card: {
      styles: {
        root: {
          backgroundColor: "rgba(30,41,59,0.6)",
          borderColor: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(8px)",
          color: "var(--mantine-color-white)",
        },
      },
    },
    Button: {
      defaultProps: {
        radius: "md",
        fw: 600,
      },
    },
    Text: {
      styles: {
        root: {
          color: "var(--mantine-color-gray-1)",
        },
      },
    },
  },

  /** === Breakpoints modernos === */
  breakpoints: {
    xs: rem(480),
    sm: rem(640),
    md: rem(768),
    lg: rem(1024),
    xl: rem(1280),
  },
});
