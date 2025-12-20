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
      main: "#0f2945", // Navy Blue
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#10b2d3", // Teal accent
    },
    background: {
      default: "#f6f8fb", // Soft gray canvas
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#4b5563",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 6,
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
    page: "linear-gradient(180deg, #f6f8fc 0%, #f3f6fb 45%, #eef2f7 100% )",
    hero: "linear-gradient(120deg, rgba(16, 178, 211, 0.15) 0%, rgba(15,41,69,0.06)100%)",
    heroOverlay: "radial-gradient(circle at 20% 20%, rgba(16,178,211,0.18), transparent 55%)",
    callout: "linear-gradient(135deg, rgba(16,178,211,0.08), rgba(15,41,69,0.04))",
    subtle:
      "radial-gradient(circle at top left, rgba(16,178,211,0.04) 0%, transparent 55%), radial-gradient(circle at bottom right, rgba(15,41,69,0.04) 0%, transparent 50%)",
  },
  customShadows: {
    surface: "0px 8px 26px rgba(15, 23, 42, 0.06)",
    floating: "0px 20px 52px rgba(15, 23, 42, 0.14)",
    frosted: "0px 18px 46px rgba(15, 41, 69, 0.16)",
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
          borderRadius: 14,
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
