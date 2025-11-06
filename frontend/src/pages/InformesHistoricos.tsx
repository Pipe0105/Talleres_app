import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getProductos, getTalleres } from "../api/talleresApi";
import { Producto, Taller } from "../types";
import TallerBreakdownCard from "../components/TallerBreakdownCard";
import {
  calcularGruposDeTalleres,
  construirMapaProductos,
  TallerGrupoCalculado,
} from "../utils/talleres";

const formatKg = (valor: number): string =>
  valor.toLocaleString("es-CL", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatPct = (valor: number): string =>
  valor.toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const InformesHistoricos = () => {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [talleresData, productosData] = await Promise.all([
          getTalleres(),
          getProductos(),
        ]);

        if (!isMounted) {
          return;
        }

        setTalleres(talleresData);
        setProductos(productosData);
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible cargar los informes históricos.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const productoMap = useMemo(
    () => construirMapaProductos(productos),
    [productos]
  );

  const gruposCalculados = useMemo(
    () => calcularGruposDeTalleres(talleres, productoMap),
    [talleres, productoMap]
  );

  const filteredBreakdowns = useMemo(() => {
    if (!search.trim()) {
      return gruposCalculados;
    }

    const term = search.toLowerCase();
    return gruposCalculados.filter((grupo) => {
      const baseMatch =
        grupo.grupo.toLowerCase().includes(term) ||
        grupo.productoPrincipal.toLowerCase().includes(term) ||
        (grupo.responsable && grupo.responsable.toLowerCase().includes(term)) ||
        (grupo.codigoPrincipal != null &&
          grupo.codigoPrincipal.toString().includes(term));

      if (baseMatch) {
        return true;
      }

      return grupo.cortes.some(
        (corte) =>
          corte.nombre.toLowerCase().includes(term) ||
          corte.codigo.toString().includes(term)
      );
    });
  }, [search, gruposCalculados]);

  const resumenGeneral = useMemo(() => {
    const totalInicial = filteredBreakdowns.reduce(
      (acum, item) => acum + item.pesoInicial,
      0
    );
    const totalProcesado = filteredBreakdowns.reduce(
      (acum, item) => acum + item.pesoProcesado,
      0
    );
    const totalMerma = filteredBreakdowns.reduce(
      (acum, item) => acum + item.mermaKg,
      0
    );

    return {
      totalInicial,
      totalProcesado,
      totalMerma,
      porcentajeProcesado:
        totalInicial > 0 ? (totalProcesado / totalInicial) * 100 : 0,
      porcentajeMerma: totalInicial > 0 ? (totalMerma / totalInicial) * 100 : 0,
    };
  }, [filteredBreakdowns]);

  const handleRetry = () => {
    setError(null);
    setRefreshToken((token) => token + 1);
  };

  const handleExport = () => {
    if (filteredBreakdowns.length === 0) {
      return;
    }

    const headers = [
      "Grupo",
      "Fecha",
      "Responsable",
      "Producto principal",
      "Código principal",
      "Corte",
      "Código corte",
      "Peso (kg)",
      "% sobre inicial",
      "Peso inicial (kg)",
      "Total procesado (kg)",
      "% total procesado",
      "Merma (kg)",
      "% merma",
    ];

    const rows = filteredBreakdowns.flatMap((grupo) =>
      grupo.cortes.map((corte) => [
        grupo.grupo,
        grupo.fecha,
        grupo.responsable,
        grupo.productoPrincipal,
        grupo.codigoPrincipal ?? "",
        corte.nombre,
        corte.codigo,
        corte.peso,
        corte.porcentaje,
        grupo.pesoInicial,
        grupo.pesoProcesado,
        grupo.porcentajeProcesado,
        grupo.mermaKg,
        grupo.mermaPorcentaje,
      ])
    );

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const text = typeof value === "number" ? value.toString() : value;
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "informes_historicos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={1.5}>
          <Typography variant="h4" component="h1">
            Informes Históricos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta la trazabilidad de los talleres registrados y revisa cómo
            se distribuyeron los cortes principales y secundarios en cada
            proceso.
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          mt={3}
          alignItems={{ md: "flex-end" }}
        >
          <TextField
            label="Buscar por grupo, producto o corte"
            placeholder="Ej. Ampolleta, Gordana, operario"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ width: { xs: "100%", md: 360 } }}
          />
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={filteredBreakdowns.length === 0}
          >
            Exportar CSV
          </Button>
        </Stack>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: "action.hover",
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Peso total inicial
            </Typography>
            <Typography variant="subtitle1">
              {formatKg(resumenGeneral.totalInicial)} kg
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Total procesado
            </Typography>
            <Typography variant="subtitle1">
              {formatKg(resumenGeneral.totalProcesado)} kg ·{" "}
              {formatPct(resumenGeneral.porcentajeProcesado)}%
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Merma acumulada
            </Typography>
            <Typography variant="subtitle1">
              {formatKg(resumenGeneral.totalMerma)} kg ·{" "}
              {formatPct(resumenGeneral.porcentajeMerma)}%
            </Typography>
          </Stack>
        </Box>
      </Paper>

      {error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      ) : loading ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Cargando datos históricos…
            </Typography>
          </Stack>
        </Paper>
      ) : filteredBreakdowns.length === 0 ? (
        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="body2" color="text.secondary">
            No se encontraron talleres que coincidan con la búsqueda.
          </Typography>
        </Paper>
      ) : (
        filteredBreakdowns.map((breakdown: TallerGrupoCalculado) => (
          <TallerBreakdownCard
            key={`${breakdown.grupo}-${breakdown.fecha}`}
            breakdown={breakdown}
          />
        ))
      )}
    </Stack>
  );
};

export default InformesHistoricos;
