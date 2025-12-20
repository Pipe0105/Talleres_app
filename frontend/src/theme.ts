import { alpha, createTheme } from "@mui/material/styles";
type LayoutConfig = {
  sectionSpacing: number;
  pagePaddingX: {
    xs: number;
    md: number;
  };
  pagePaddingY: {
    xs: number;
    md: number;
  };
  contentMaxWidth: number;
};

type SpaceScale = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  sectionPadding: {
    xs: number;
    md: number;
  };
  cardPadding: {
    xs: number;
    md: number;
  };
  gridGutter: {
    xs: number;
    md: number;
  };
};

type FontSizeScale = {
  display: string;
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  subtitle1: string;
  subtitle2: string;
  body: string;
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
    space: SpaceScale;
    fontSizes: FontSizeScale;
    gradients: GradientConfig;
    customShadows: CustomShadowsConfig;
  }

  interface ThemeOptions {
    layout?: LayoutConfig;
    space?: SpaceScale;
    fontSizes?: FontSizeScale;
    gradients?: GradientConfig;
    customShadows?: CustomShadowsConfig;
  }
}

const spaceScale: SpaceScale = {
  xs: 0.75,
  sm: 1.25,
  md: 2,
  lg: 3,
  xl: 4,
  sectionPadding: {
    xs: 3,
    md: 3.75,
  },
  cardPadding: {
    xs: 2.5,
    md: 3,
  },
  gridGutter: {
    xs: 2.5,
    md: 3.5,
  },
};

const fontSizes: FontSizeScale = {
  display: "2.75rem",
  h1: "2.25rem",
  h2: "1.875rem",
  h3: "1.5rem",
  h4: "1.25rem",
  subtitle1: "1.05rem",
  subtitle2: "0.95rem",
  body: "1rem",
};

const focusRingFor = (color: string, emphasis: number) => ({
  outline: `3px solid ${alpha(color, emphasis)}`,
  outlineOffset: 3,
  boxShadow: `0 0 0 4px ${alpha(color, emphasis * 0.65)}`,
});

type AppThemeOptions = {
  highContrast?: boolean;
};

export const createAppTheme = (options: AppThemeOptions = {}) => {
  const { highContrast = false } = options;

  const palette = {
    mode: "light",
    primary: {
      main: highContrast ? "#0b3b82" : "#0d3b66",
      contrastText: "#ffffff",
    },
    secondary: {
      main: highContrast ? "#0a7a98" : "#0f9fb8",
      contrastText: "#ffffff",
    },
    background: {
      default: highContrast ? "#e6ebf5" : "#f6f8fb",
      paper: "#ffffff",
    },
    text: {
      primary: highContrast ? "#0a0f1f" : "#0f172a",
      secondary: highContrast ? "#111827" : "#4b5563",
    },
    success: {
      main: "#1d8050",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#c27803",
      contrastText: "#0f172a",
    },
    info: {
      main: "#0b7ccc",
      contrastText: "#ffffff",
    },
  } as const;

  const gradients = {
    page: highContrast
      ? "linear-gradient(180deg, #dbe4f3 0%, #e4ebf8 45%, #dfe6f4 100%)"
      : "linear-gradient(180deg, #f7f9fc 0%, #f4f7fb 40%, #eff3f9 100% )",
    hero: highContrast
      ? "linear-gradient(120deg, rgba(11,124,204,0.14) 0%, rgba(10,122,152,0.1) 100%)"
      : "linear-gradient(120deg, rgba(0,178,144,0.12) 0%, rgba(88,205,173,0.06) 100%)",
    heroOverlay: highContrast
      ? "radial-gradient(circle at 20% 20%, rgba(11,124,204,0.16), transparent 55%)"
      : "radial-gradient(circle at 20% 20%, rgba(0,178,144,0.16), transparent 55%)",
    callout: highContrast
      ? "linear-gradient(135deg, rgba(11,124,204,0.1), rgba(10,122,152,0.08))"
      : "linear-gradient(135deg, rgba(0,178,144,0.08), rgba(115,92,245,0.06))",
    subtle: highContrast
      ? "radial-gradient(circle at top left, rgba(11,124,204,0.08) 0%, transparent 55%), radial-gradient(circle at bottom right, rgba(10,122,152,0.06) 0%, transparent 50%)"
      : "radial-gradient(circle at top left, rgba(0,178,144,0.06) 0%, transparent 55%), radial-gradient(circle at bottom right, rgba(115,92,245,0.06) 0%, transparent 50%)",
  };

  const theme = createTheme({
    palette,
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
    gradients,
    customShadows: {
      surface: highContrast
        ? "0px 14px 30px rgba(12, 53, 83, 0.12)"
        : "0px 12px 30px rgba(12, 53, 83, 0.08)",
      floating: highContrast
        ? "0px 24px 66px rgba(12, 53, 83, 0.18)"
        : "0px 22px 60px rgba(12, 53, 83, 0.14)",
      frosted: highContrast
        ? "0px 24px 68px rgba(12, 53, 83, 0.2)"
        : "0px 20px 54px rgba(12, 53, 83, 0.18)",
    },
  });

  const focusRing = focusRingFor(theme.palette.secondary.main, highContrast ? 0.7 : 0.45);

  theme.components = {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          colorScheme: "light",
        },
        body: {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
        },
        "a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [role='button']:focus-visible":
          {
            ...focusRing,
            borderRadius: 8,
          },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: theme.shape.borderRadius,
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          "&:focus-visible": {
            ...focusRing,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 999,
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": {
            boxShadow: theme.customShadows.surface,
          },
          "&:focus-visible": {
            ...focusRing,
          },
        },
        containedPrimary: {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.9),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: theme.customShadows.surface,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(theme.space.cardPadding.xs),
          [theme.breakpoints.up("sm")]: {
            padding: theme.spacing(theme.space.cardPadding.md),
          },
          "& .MuiCardHeader-title": {
            fontWeight: 800,
            fontSize: theme.fontSizes.h4,
          },
          "& .MuiCardHeader-subheader": {
            fontSize: theme.fontSizes.subtitle2,
          },
        }),
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(theme.space.cardPadding.xs),
          [theme.breakpoints.up("sm")]: {
            padding: theme.spacing(theme.space.cardPadding.md),
          },
          "&:last-child": {
            paddingBottom: theme.spacing(theme.space.cardPadding.xs),
            [theme.breakpoints.up("sm")]: {
              paddingBottom: theme.spacing(theme.space.cardPadding.md),
            },
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          letterSpacing: 0.2,
          "&.MuiChip-filled": {
            boxShadow: theme.customShadows.surface,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.background.paper,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
          },
          "&:focus-within": {
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
            borderRadius: theme.shape.borderRadius + 2,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          "&:focus-visible": {
            ...focusRing,
          },
        },
      },
    },
  };

  return theme;
};
