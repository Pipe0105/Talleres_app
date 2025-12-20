import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { createAppTheme } from "../theme";

interface AppThemeContextValue {
  highContrast: boolean;
  toggleHighContrast: () => void;
  setHighContrast: (value: boolean) => void;
}

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "talleres:high-contrast";

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, String(highContrast));
    document.body.dataset.contrast = highContrast ? "high" : "normal";
  }, [highContrast]);

  const theme = useMemo(() => createAppTheme({ highContrast }), [highContrast]);

  const value = useMemo(
    () => ({
      highContrast,
      toggleHighContrast: () => setHighContrast((prev) => !prev),
      setHighContrast,
    }),
    [highContrast]
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            "::selection": {
              backgroundColor: theme.palette.secondary.main,
              color: theme.palette.secondary.contrastText,
            },
          }}
        />
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
};
