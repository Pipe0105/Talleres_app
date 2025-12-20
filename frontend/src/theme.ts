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
    borderRadius: 10,
  },
  layout: {
    sectionSpacing: 6,
    pagePaddingY: {
      xs: 4,
      md: 6,
    },
    contentMaxWidth: 1400,
  },
  gradients: {
    page: "linear-gradient(180deg, #f7f9fc 0%, #f4f7fb 40%, #eff3f9 100% )",
    hero: "linear-gradient(120deg, rgba(0,178,144,0.12) 0%, rgba(88,205,173,0.06) 100%)",
    heroOverlay: "radial-gradient(circle at 20% 20%, rgba(0,178,144,0.16), transparent 55%)",
    callout: "linear-gradient(135deg, rgba(0,178,144,0.08), rgba(115,92,245,0.06))",
    subtle:
      "radial-gradient(circle at top left, rgba(0,178,144,0.06) 0%, transparent 55%), radial-gradient(circle at bottom right, rgba(115,92,245,0.06) 0%, transparent 50%)",
  },
  customShadows: {
    surface: "0px 12px 30px rgba(12, 53, 83, 0.08)",
    floating: "0px 22px 60px rgba(12, 53, 83, 0.14)",
    frosted: "0px 20px 54px rgba(12, 53, 83, 0.18)",
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
