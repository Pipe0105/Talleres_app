import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CssBaseline,
  LinearProgress,
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
import { sanitizeSearchQuery } from "../utils/security";

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
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

const Dashboard = ({
  talleres,
  productos,
  precios,
  selectedTallerId,
  onSelectTaller,
  searchQuery,
  onSearchChange,
}: DashboardProps) => {
  const [internalSearch, setInternalSearch] = useState<string>(
    searchQuery ?? ""
  );

  useEffect(() => {
    if (typeof searchQuery === "string") {
      setInternalSearch(searchQuery);
    }
  }, [searchQuery]);

  const search = searchQuery ?? internalSearch;

  const productoMap = useMemo(
    () =>
      new Map(productos.map((producto) => [producto.id, producto] as const)),
    [productos]
  );

  const precioMap = useMemo(() => {
    const map = new Map<number, Precio>();

    precios.forEach((precio) => {
      const productoId = precio.producto_id;
      const current = map.get(productoId);
      if (!current) {
        map.set(productoId, precio);
        return;
      }

      const currentDate = new Date(current.fecha_vigencia_desde).getTime();
      const candidateDate = new Date(precio.fecha_vigencia_desde).getTime();

      if (candidateDate > currentDate) {
        map.set(productoId, precio);
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

    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.totalPeso - a.totalPeso)
      .map(([grupo, valores]) => ({
        grupo,
        totalPeso: valores.totalPeso,
        rendimientoPromedio:
          valores.conRendimiento > 0
            ? valores.totalRendimiento / valores.conRendimiento
            : null,
        cantidad: valores.cantidad,
      }));
  }, [filteredTalleres]);

  const pesoPorGrupoData = useMemo(() => {
    const topGroups = resumenPorGrupo.slice(0, 5);
    const total = topGroups.reduce((acum, item) => acum + item.totalPeso, 0);
    return topGroups.map((grupo) => ({
      id: grupo.grupo,
      label: grupo.grupo.replace(/_/g, " "),
      kilos: Number(grupo.totalPeso.toFixed(2)),
      porcentaje: total > 0 ? (grupo.totalPeso / total) * 100 : 0,
    }));
  }, [resumenPorGrupo]);

  const rendimientoPorGrupo = useMemo(
    () =>
      resumenPorGrupo
        .filter((grupo) => typeof grupo.rendimientoPromedio === "number")
        .slice(0, 5)
        .map((grupo) => ({
          label: grupo.grupo.replace(/_/g, " "),
          rendimiento: Number(
            ((grupo.rendimientoPromedio ?? 0) * 100).toFixed(2)
          ),
        })),
    [resumenPorGrupo]
  );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeSearchQuery(event.currentTarget.value);
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }
    setInternalSearch(value);
  };

  return (
    <Stack spacing={4} mt={4}>
      {/* ==== RESUMEN POR GRUPO ==== */}
      <Grid container spacing={3}>
        {resumenPorGrupo.map((grupo) => (
          <Grid key={grupo.grupo} xs={12} sm={6}>
            <Card
              elevation={0}
              sx={(theme: Theme) => ({
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              })}
            >
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
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Registros
                    </Typography>
                    <Typography variant="subtitle1">
                      {grupo.cantidad}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Peso total
                    </Typography>
                    <Typography variant="subtitle1">
                      {grupo.totalPeso.toFixed(2)} kg
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Rendimiento medio
                    </Typography>
                    <Typography variant="subtitle1">
                      {grupo.rendimientoPromedio
                        ? `${(grupo.rendimientoPromedio * 100).toFixed(2)}%`
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

      {(pesoPorGrupoData.length > 0 || rendimientoPorGrupo.length > 0) && (
        <Grid container spacing={3}>
          {pesoPorGrupoData.length > 0 && (
            <Grid xs={12} md={6}>
              <Paper sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom>
                  Top grupos por peso procesado
                </Typography>
                <Stack spacing={2}>
                  {pesoPorGrupoData.map((item) => (
                    <Box key={item.id}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.kilos.toLocaleString("es-CL", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          {" kg"}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(item.porcentaje, 100)}
                        sx={{ borderRadius: 999 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          )}

          {rendimientoPorGrupo.length > 0 && (
            <Grid xs={12} md={6}>
              <Paper sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom>
                  Rendimiento promedio por grupo
                </Typography>
                <Stack spacing={2}>
                  {rendimientoPorGrupo.map((item) => (
                    <Box key={item.label}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.rendimiento.toFixed(2)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(item.rendimiento, 100)}
                        color="secondary"
                        sx={{ borderRadius: 999 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* ==== DETALLE DE TALLERES ==== */}
      <Stack spacing={2}>
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
            onChange={handleSearchChange}
            size="small"
            sx={{ width: { xs: "100%", md: 320 } }}
          />
        </Stack>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
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
                      "&.Mui-selected": {
                        backgroundColor: `${theme.palette.primary.light}22`,
                      },
                    })}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(taller.fecha).toLocaleDateString("es-CL")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {producto?.nombre ?? "Producto desconocido"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Código {taller.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>{taller.grupo.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      {taller.peso_inicial ? `${taller.peso_inicial} kg` : "—"}
                    </TableCell>
                    <TableCell>{taller.peso_taller} kg</TableCell>
                    <TableCell>
                      {typeof taller.rendimiento === "number"
                        ? `${(taller.rendimiento * 100).toFixed(2)}%`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {precio && typeof precio.precio_unitario === "number"
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
                          variant={isSelected ? "contained" : "outlined"}
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
                      <Typography variant="body2" color="text.secondary">
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
    </Stack>
  );
};

export default Dashboard;
