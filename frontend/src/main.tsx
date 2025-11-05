import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  MantineProvider,
  createTheme,
  MantineColorsTuple,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import App from "./App";
import "./index.css";

const brandColors: MantineColorsTuple = [
  "#eef4ff",
  "#dce5ff",
  "#b5c7ff",
  "#8da7ff",
  "#6a8cff",
  "#5179ff",
  "#436bff",
  "#3357e6",
  "#2748b4",
  "#1b3882",
];

const theme = createTheme({
  colors: {
    brand: brandColors,
  },
  primaryColor: "brand",
  fontFamily:
    "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);
