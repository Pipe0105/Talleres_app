import { ChangeEvent, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
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
} from "@mui/material";
import Grid from "@mui/material/Grid2"; // ✅ Usa la nueva versión
// ✅ Import explícito para evitar errores de tipo
import { Precio, Producto, Taller } from "../types";
import { Theme } from "@mui/material/styles";

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
    <Stack spacing={4} mt={4}>
      {/* ==== RESUMEN POR GRUPO ==== */}
      <Grid container spacing={3}>
        {resumenPorGrupo.map((grupo) => (
          <Grid item xs={12} sm={6} key={grupo.grupo}>
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
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No se encontraron registros para el filtro aplicado.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

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
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSearch(event.currentTarget.value)
            }
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
