import { ChangeEvent, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CssBaseline,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Unstable_Grid2 as Grid, // ✅ Usa la versión moderna de Grid compatible con MUI 7.3.5
} from "@mui/material";
import { Theme, ThemeProvider, createTheme } from "@mui/material/styles";
import { Precio, Producto, Taller } from "../types";

const dashboardTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0046ff",
    },
    secondary: {
      main: "#00bfa5",
    },
    background: {
      default: "#f4f6f8",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily:
      '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightBold: 700,
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
    },
    subtitle1: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f4f6f8",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          backgroundImage: "none",
          "&:hover": {
            boxShadow: "0 22px 60px rgba(15, 23, 42, 0.12)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          background: "linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)",
          boxShadow: "0 12px 36px rgba(15, 23, 42, 0.10)",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          "&:hover": {
            boxShadow: "0 18px 48px rgba(0, 70, 255, 0.25)",
            transform: "translateY(-4px)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#f0f3ff",
          "& .MuiTableCell-root": {
            fontWeight: 600,
            color: "#1f2937",
          },
        },
      },
    },
  },
});

interface DashboardProps {
  talleres: Taller[];
  productos: Producto[];
  precios: Precio[];
  selectedTallerId: number | null;
  onSelectTaller?: (tallerId: number) => void;
}

const Dashboard = ({
  talleres,
  productos,
  precios,
  selectedTallerId,
  onSelectTaller,
}: DashboardProps) => {
  const [search, setSearch] = useState("");

  const productoMap = useMemo(
    () =>
      new Map(productos.map((producto) => [producto.id, producto] as const)),
    [productos]
  );

  const precioMap = useMemo(() => {
    const map = new Map<number, Precio>();

    precios.forEach((precio) => {
      const current = map.get(precio.producto_id);
      if (!current) {
        map.set(precio.producto_id, precio);
        return;
      }

      const currentDate = new Date(current.fecha_vigencia_desde).getTime();
      const candidateDate = new Date(precio.fecha_vigencia_desde).getTime();

      if (candidateDate > currentDate) {
        map.set(precio.producto_id, precio);
      }
    });

    return map;
  }, [precios]);

  const filteredTalleres = useMemo(() => {
    if (!search.trim()) {
      return talleres;
    }
    const term = search.toLowerCase();
    return talleres.filter((taller) => {
      const producto = productoMap.get(taller.producto_id);
      return (
        taller.grupo.toLowerCase().includes(term) ||
        taller.observaciones.toLowerCase().includes(term) ||
        producto?.nombre.toLowerCase().includes(term) ||
        producto?.codigo.toString().includes(term)
      );
    });
  }, [search, talleres, productoMap]);

  const resumenPorGrupo = useMemo(() => {
    const map = new Map<
      string,
      {
        totalPeso: number;
        totalRendimiento: number;
        cantidad: number;
        conRendimiento: number;
      }
    >();

    filteredTalleres.forEach((taller) => {
      const entry = map.get(taller.grupo) ?? {
        totalPeso: 0,
        totalRendimiento: 0,
        cantidad: 0,
        conRendimiento: 0,
      };
      entry.totalPeso += taller.peso_taller;
      if (typeof taller.rendimiento === "number") {
        entry.totalRendimiento += taller.rendimiento;
        entry.conRendimiento += 1;
      }
      entry.cantidad += 1;
      map.set(taller.grupo, entry);
    });

    return Array.from(map.entries()).map(([grupo, valores]) => ({
      grupo,
      totalPeso: valores.totalPeso,
      rendimientoPromedio:
        valores.conRendimiento > 0
          ? valores.totalRendimiento / valores.conRendimiento
          : null,
      cantidad: valores.cantidad,
    }));
  }, [filteredTalleres]);

  return (
    <ThemeProvider theme={dashboardTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Box
          component="aside"
          sx={{
            width: { xs: 0, md: 280 },
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            height: "100vh",
            py: 6,
            px: 4,
            color: "common.white",
            background:
              "linear-gradient(165deg, #001a4f 0%, #0046ff 60%, #1a73ff 100%)",
            boxShadow: "18px 0 45px rgba(15, 23, 42, 0.35)",
          }}
        >
          <Stack spacing={6}>
            <Stack spacing={0.5}>
              <Typography variant="h5">Talleres Cárnicos</Typography>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.72)" }}
              >
                Dashboard operativo
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                color="secondary"
                disableElevation
                sx={{
                  justifyContent: "flex-start",
                  px: 2.5,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "common.white",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.24)",
                  },
                }}
              >
                Talleres Desposte
              </Button>
              <Button
                variant="text"
                color="inherit"
                sx={{
                  justifyContent: "flex-start",
                  px: 2.5,
                  color: "rgba(255,255,255,0.74)",
                  "&:hover": {
                    color: "common.white",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Estado actual
              </Button>
              <Button
                variant="text"
                color="inherit"
                sx={{
                  justifyContent: "flex-start",
                  px: 2.5,
                  color: "rgba(255,255,255,0.74)",
                  "&:hover": {
                    color: "common.white",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Talleres mensuales
              </Button>
              <Button
                variant="text"
                color="inherit"
                sx={{
                  justifyContent: "flex-start",
                  px: 2.5,
                  color: "rgba(255,255,255,0.74)",
                  "&:hover": {
                    color: "common.white",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Capacidades clave
              </Button>
            </Stack>
          </Stack>
          <Stack spacing={0.5}>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.6)" }}
            >
              Reportes estratégicos
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.85)" }}
            >
              Optimiza los talleres con datos en tiempo real.
            </Typography>
          </Stack>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: { xs: 3, md: 6 },
            py: { xs: 4, md: 6 },
            maxWidth: "1440px",
            marginX: "auto",
          }}
        >
          <Stack spacing={5}>
            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                background: "linear-gradient(145deg, #ffffff 0%, #f4f8ff 100%)",
                boxShadow: "0 20px 60px rgba(0, 20, 90, 0.12)",
              }}
            >
              <Stack spacing={3}>
                <Typography variant="h4">Estado actual</Typography>
                <Grid container spacing={3}>
                  {resumenPorGrupo.map((grupo) => (
                    <Grid key={grupo.grupo} xs={12} sm={6} md={4}>
                      <Card>
                        <CardContent>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            textTransform="uppercase"
                          >
                            Grupo
                          </Typography>
                          <Typography variant="h5" mt={1}>
                            {grupo.grupo.replace(/_/g, " ")}
                          </Typography>
                          <Stack spacing={1.5} mt={2}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Registros
                              </Typography>
                              <Typography variant="subtitle1">
                                {grupo.cantidad}
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Peso total
                              </Typography>
                              <Typography variant="subtitle1">
                                {grupo.totalPeso.toFixed(2)} kg
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Rendimiento medio
                              </Typography>
                              <Typography variant="subtitle1">
                                {grupo.rendimientoPromedio
                                  ? `${(
                                      grupo.rendimientoPromedio * 100
                                    ).toFixed(2)}%`
                                  : "Sin datos"}
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}

                  {resumenPorGrupo.length === 0 && (
                    <Grid xs={12}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron registros para el filtro aplicado.
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Stack>
            </Paper>

            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                backdropFilter: "blur(8px)",
              }}
            >
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "flex-end" }}
                  spacing={2}
                >
                  <Typography variant="h5" component="h3">
                    Detalle de talleres
                  </Typography>
                  <TextField
                    placeholder="Buscar por grupo, producto o código"
                    value={search}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setSearch(event.currentTarget.value)
                    }
                    size="small"
                    sx={{ width: { xs: "100%", md: 320 } }}
                  />
                </Stack>

                <TableContainer
                  component={Paper}
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0 12px 36px rgba(15, 23, 42, 0.12)",
                    "&:hover": {
                      boxShadow: "0 16px 44px rgba(15, 23, 42, 0.18)",
                    },
                  }}
                >
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Producto</TableCell>
                        <TableCell>Grupo</TableCell>
                        <TableCell>Peso inicial</TableCell>
                        <TableCell>Peso taller</TableCell>
                        <TableCell>Rendimiento</TableCell>
                        <TableCell>Precio unitario</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filteredTalleres.map((taller) => {
                        const producto = productoMap.get(taller.producto_id);
                        const precio = precioMap.get(taller.producto_id);
                        const isSelected = selectedTallerId === taller.id;

                        return (
                          <TableRow
                            key={taller.id}
                            hover
                            selected={isSelected}
                            sx={(theme: Theme) => ({
                              transition: "background-color 0.2s ease",
                              "&:hover": {
                                backgroundColor: `${theme.palette.primary.main}0F`,
                              },
                              "&.Mui-selected": {
                                backgroundColor: `${theme.palette.primary.light}22`,
                              },
                            })}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {new Date(taller.fecha).toLocaleDateString(
                                  "es-CL"
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {producto?.nombre ?? "Producto desconocido"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Código {taller.codigo}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {taller.grupo.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell>
                              {taller.peso_inicial
                                ? `${taller.peso_inicial} kg`
                                : "—"}
                            </TableCell>
                            <TableCell>{taller.peso_taller} kg</TableCell>
                            <TableCell>
                              {typeof taller.rendimiento === "number"
                                ? `${(taller.rendimiento * 100).toFixed(2)}%`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {precio
                                ? new Intl.NumberFormat("es-CL", {
                                    style: "currency",
                                    currency: "CLP",
                                  }).format(precio.precio_unitario)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {onSelectTaller && (
                                <Button
                                  size="small"
                                  variant={
                                    isSelected ? "contained" : "outlined"
                                  }
                                  onClick={() => onSelectTaller(taller.id)}
                                >
                                  {isSelected ? "Seleccionado" : "Ver detalle"}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {filteredTalleres.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8}>
                            <Box py={3} textAlign="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No hay talleres que coincidan con tu búsqueda.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;
