import { createTheme } from "@mui/material/styles";

type LayoutConfig = {
  sectionSpacing: number;
  pagePaddingY: {
    xs: number;
    md: number;
  };
  contentMaxWidth: number;
};

type GradientConfig = {
  page: string;
  hero: string;
  heroOverlay: string;
  callout: string;
  subtle: string;
};

type CustomShadowsConfig = {
  surface: string;
  floating: string;
  frosted: string;
};

declare module "@mui/material/styles" {
  interface Theme {
    layout: LayoutConfig;
    gradients: GradientConfig;
    customShadows: CustomShadowsConfig;
  }

  interface ThemeOptions {
    layout?: LayoutConfig;
    gradients?: GradientConfig;
    customShadows?: CustomShadowsConfig;
  }
}

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0a1f44", // Deep Navy
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#334155", // Slate
    },
    background: {
      default: "#f1f5f9", // Light Slate Gray
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
  },
  typography: {
    fontFamily:
      "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  layout: {
    sectionSpacing: 6,
    pagePaddingY: {
      xs: 4,
      md: 6,
    },
    contentMaxWidth: 1280,
  },
  gradients: {
    page: "linear-gradient(180deg, #f1f5f9 0%, #f8fafc 40%)",
    hero: "linear-gradient(140deg, #0a1f44 0%, #041125 100%)",
    heroOverlay:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1), transparent 55%)",
    callout:
      "linear-gradient(135deg, rgba(10,31,68,0.08), rgba(10,31,68,0.02))",
    subtle:
      "radial-gradient(circle at top left, rgba(10,31,68,0.05) 0%, transparent 55%), radial-gradient(circle at bottom right, rgba(10,31,68,0.03) 0%, transparent 50%)",
  },
  customShadows: {
    surface: "0px 14px 40px rgba(15, 23, 42, 0.06)",
    floating: "0px 28px 60px rgba(15, 23, 42, 0.12)",
    frosted: "0px 18px 46px rgba(10, 31, 68, 0.15)",
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 20,
          boxShadow: theme.customShadows.surface,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          letterSpacing: 0.2,
        },
      },
    },
  },
});
