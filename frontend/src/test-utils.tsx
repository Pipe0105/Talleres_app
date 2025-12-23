import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { appTheme } from "./theme";

const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, "queries">) =>
  render(<ThemeProvider theme={appTheme}>{ui}</ThemeProvider>, options);

export * from "@testing-library/react";
export { renderWithProviders as render };
