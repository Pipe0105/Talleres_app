import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  MenuItem,
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
import { safeStorage } from "../utils/storage";
import { sanitizeSearchQuery } from "../utils/security";

const STORAGE_KEYS = {
  search: "informesHistoricos.search",
} as const;

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

const escapePdfText = (text: string): string =>
  text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const createSimplePdf = (lines: string[]): ArrayBuffer => {
  const encoder = new TextEncoder();
  const header = "%PDF-1.4\n";
  const lineHeight = 16;
  const startY = 812;
  const contentLines = ["BT", "/F1 12 Tf"];

  lines.forEach((line, index) => {
    const y = startY - index * lineHeight;
    contentLines.push(`1 0 0 1 40 ${y} Tm (${escapePdfText(line)}) Tj`);
  });

  contentLines.push("ET", "");
  const contentStream = contentLines.join("\n");
  const contentBytes = encoder.encode(contentStream);

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    [
      "3 0 obj\n",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\n",
      "endobj\n",
    ].join(""),
    `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  const headerBytes = encoder.encode(header);
  let offset = headerBytes.length;
  const offsets = [0];
  const objectBytes = objects.map((object) => {
    const bytes = encoder.encode(object);
    offsets.push(offset);
    offset += bytes.length;
    return bytes;
  });

  const xrefOffset = offset;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let index = 1; index <= 5; index += 1) {
    xref += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  const xrefBytes = encoder.encode(xref);
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const trailerBytes = encoder.encode(trailer);

  const totalLength =
    headerBytes.length +
    objectBytes.reduce((sum, bytes) => sum + bytes.length, 0) +
    xrefBytes.length +
    trailerBytes.length;

  const pdfBytes = new Uint8Array(totalLength);
  let position = 0;

  pdfBytes.set(headerBytes, position);
  position += headerBytes.length;
  objectBytes.forEach((bytes) => {
    pdfBytes.set(bytes, position);
    position += bytes.length;
  });
  pdfBytes.set(xrefBytes, position);
  position += xrefBytes.length;
  pdfBytes.set(trailerBytes, position);

  return pdfBytes.buffer;
};

const InformesHistoricos = () => {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() =>
    sanitizeSearchQuery(safeStorage.getItem(STORAGE_KEYS.search) ?? "")
  );
  const [refreshToken, setRefreshToken] = useState(0);
  const [exportFormat, setExportFormat] = useState<"csv" | "xls" | "pdf">(
    "csv"
  );

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

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.search, search);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(sanitizeSearchQuery(value));
  };

  const chartData = useMemo(() => {
    if (!filteredBreakdowns.length) {
      return [] as {
        label: string;
        procesado: number;
        merma: number;
        procesadoPct: number;
        mermaPct: number;
      }[];
    }
    return filteredBreakdowns.slice(0, 6).map((grupo) => ({
      label: grupo.grupo.replace(/_/g, " "),
      procesado: Number(grupo.pesoProcesado.toFixed(2)),
      merma: Number(grupo.mermaKg.toFixed(2)),
      procesadoPct:
        grupo.pesoInicial > 0
          ? Number(((grupo.pesoProcesado / grupo.pesoInicial) * 100).toFixed(2))
          : 0,
      mermaPct:
        grupo.pesoInicial > 0
          ? Number(((grupo.mermaKg / grupo.pesoInicial) * 100).toFixed(2))
          : 0,
    }));
  }, [filteredBreakdowns]);

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

    const formatValue = (value: string | number | null | undefined): string => {
      if (value == null) {
        return "";
      }
      return typeof value === "number" ? value.toString() : value;
    };

    const escapeHtml = (value: string): string =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (exportFormat === "csv") {
      const csv = [headers, ...rows]
        .map((row) =>
          row
            .map((value) => {
              const text = formatValue(value);
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
      return;
    }

    if (exportFormat === "xls") {
      const tableHeader = `<tr>${headers
        .map((header) => `<th>${escapeHtml(header)}</th>`)
        .join("")}</tr>`;
      const tableRows = rows
        .map(
          (row) =>
            `<tr>${row
              .map((value) => `<td>${escapeHtml(formatValue(value))}</td>`)
              .join("")}</tr>`
        )
        .join("");

      const worksheet = `<table>${tableHeader}${tableRows}</table>`;
      const blob = new Blob([`\ufeff${worksheet}`], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "informes_historicos.xls";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const pdfLines = [
      "Informes Históricos",
      "",
      headers.join(" | "),
      ...rows.map((row) => row.map((value) => formatValue(value)).join(" | ")),
    ];

    const pdfBuffer = createSimplePdf(pdfLines);
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "informes_historicos.pdf";
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
            onChange={(event) => handleSearchChange(event.target.value)}
            sx={{ width: { xs: "100%", md: 360 } }}
          />
          <TextField
            select
            label="Formato"
            value={exportFormat}
            onChange={(event) =>
              setExportFormat(event.target.value as "csv" | "xls" | "pdf")
            }
            sx={{ width: { xs: "100%", md: 200 } }}
          >
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="xls">XLS</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
          </TextField>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={filteredBreakdowns.length === 0}
          >
            Exportar
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
        <Stack spacing={3}>
          {chartData.length > 0 && (
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" gutterBottom>
                Procesado vs merma (primeros grupos)
              </Typography>
              <Stack spacing={2}>
                {chartData.map((item) => (
                  <Box key={item.label}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.procesado.toLocaleString("es-CL", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {" kg"}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(item.procesadoPct, 100)}
                      sx={{ mt: 0.5, borderRadius: 999 }}
                    />
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mt: 1 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Merma{" "}
                        {item.merma.toLocaleString("es-CL", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {" kg"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.mermaPct.toFixed(2)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(item.mermaPct, 100)}
                      color="error"
                      sx={{ mt: 0.5, borderRadius: 999 }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
          {filteredBreakdowns.map((breakdown: TallerGrupoCalculado) => (
            <TallerBreakdownCard
              key={`${breakdown.grupo}-${breakdown.fecha}`}
              breakdown={breakdown}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default InformesHistoricos;
