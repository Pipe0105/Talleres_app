import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import TableRowsIcon from "@mui/icons-material/TableRows";
import GridOnIcon from "@mui/icons-material/GridOn";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { getTallerCalculo, getTalleres } from "../api/talleresApi";
import { TallerCalculoRow, TallerListItem } from "../types";
import TallerCalculoTable from "../components/TallerCalculoTable";

const pesoFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const porcentajeFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface ExportField {
  key: string;
  label: string;
  getValue: (row: TallerCalculoRow) => string;
}

const exportFieldDefinitions: ExportField[] = [
  {
    key: "nombre_corte",
    label: "Corte",
    getValue: (row) => row.nombre_corte,
  },
  {
    key: "descripcion",
    label: "Descripción",
    getValue: (row) => row.descripcion,
  },
  {
    key: "item_code",
    label: "Código de ítem",
    getValue: (row) => row.item_code,
  },
  {
    key: "peso",
    label: "Peso (KG)",
    getValue: (row) => pesoFormatter.format(row.peso),
  },
  {
    key: "porcentaje_real",
    label: "% real",
    getValue: (row) => `${porcentajeFormatter.format(row.porcentaje_real)}%`,
  },
  {
    key: "porcentaje_default",
    label: "% objetivo",
    getValue: (row) => `${porcentajeFormatter.format(row.porcentaje_default)}%`,
  },
  {
    key: "delta_pct",
    label: "Δ %",
    getValue: (row) => `${porcentajeFormatter.format(row.delta_pct)}%`,
  },
  {
    key: "precio_venta",
    label: "Precio de venta",
    getValue: (row) => currencyFormatter.format(row.precio_venta),
  },
  {
    key: "valor_estimado",
    label: "Valor estimado",
    getValue: (row) => currencyFormatter.format(row.valor_estimado),
  },
];

const normalizeWhitespace = (value: string) => value.replace(/\u00a0/g, " ");

const escapeCsvValue = (value: string) => {
  const normalized = normalizeWhitespace(value).replace(/\r?\n/g, " ");
  const needsQuotes = /[";\n]/.test(normalized);
  const escaped = normalized.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const escapeHtmlValue = (value: string) =>
  normalizeWhitespace(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapePdfText = (value: string) =>
  normalizeWhitespace(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const createSimplePdf = (title: string, header: string[], rows: string[][]) => {
  const encoder = new TextEncoder();
  const pages: string[][] = [];
  let currentLines: string[] = [];
  let currentY = 800;
  const lineHeight = 14;

  const addLine = (text: string, fontSize: number) => {
    currentLines.push("BT");
    currentLines.push(`/F1 ${fontSize} Tf`);
    currentLines.push(`50 ${currentY} Td`);
    currentLines.push(`(${escapePdfText(text)}) Tj`);
    currentLines.push("ET");
    currentY -= lineHeight;
  };

  const startPage = (isFirstPage: boolean) => {
    if (currentLines.length) {
      pages.push(currentLines);
    }
    currentLines = [];
    currentY = 800;
    addLine(
      isFirstPage ? title : `${title} (continuación)`,
      isFirstPage ? 16 : 14
    );
    currentY -= 6;
    addLine(header.join(" | "), 12);
    currentY -= 4;
  };

  startPage(true);

  rows.forEach((row) => {
    if (currentY < 60) {
      startPage(false);
    }
    addLine(row.join(" | "), 11);
  });

  if (currentLines.length) {
    pages.push(currentLines);
  }

  const pageContentStreams = pages.map((pageLines) => pageLines.join("\n"));
  const pageContentBytes = pageContentStreams.map((content) =>
    encoder.encode(content)
  );

  const fontObjectId = 3 + pages.length * 2;
  const pageObjectIds = pages.map((_, index) => 3 + index * 2);
  const contentObjectIds = pages.map((_, index) => 4 + index * 2);

  const objects = [
    {
      id: "1 0 obj",
      body: "<< /Type /Catalog /Pages 2 0 R >>",
    },
    {
      id: "2 0 obj",
      body: `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds
        .map((id) => `${id} 0 R`)
        .join(" ")}] >>`,
    },
    ...pages.flatMap((_, index) => {
      const pageId = pageObjectIds[index];
      const contentId = contentObjectIds[index];
      const streamLength = pageContentBytes[index].length;

      return [
        {
          id: `${pageId} 0 obj`,
          body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> >>`,
        },
        {
          id: `${contentId} 0 obj`,
          body: `<< /Length ${streamLength} >>\nstream\n${pageContentStreams[index]}\nendstream`,
        },
      ];
    }),
    {
      id: `${fontObjectId} 0 obj`,
      body: "<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>",
    },
  ];

  const headerBytes = encoder.encode("%PDF-1.4\n");
  const pdfChunks: Uint8Array[] = [headerBytes];
  const offsets: string[] = ["0000000000 65535 f \n"];
  let currentOffset = headerBytes.length;

  const padNumber = (value: number) => value.toString().padStart(10, "0");

  objects.forEach((object) => {
    const objectString = `${object.id}\n${object.body}\nendobj\n`;
    const bytes = encoder.encode(objectString);
    offsets.push(`${padNumber(currentOffset)} 00000 n \n`);
    pdfChunks.push(bytes);
    currentOffset += bytes.length;
  });

  const xrefOffset = currentOffset;
  const xrefString = `xref\n0 ${objects.length + 1}\n${offsets.join("")}`;
  const xrefBytes = encoder.encode(xrefString);
  pdfChunks.push(xrefBytes);
  currentOffset += xrefBytes.length;

  const trailerString = `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const trailerBytes = encoder.encode(trailerString);
  pdfChunks.push(trailerBytes);

  const totalLength = pdfChunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let position = 0;
  pdfChunks.forEach((chunk) => {
    merged.set(chunk, position);
    position += chunk.length;
  });

  return new Blob([merged], { type: "application/pdf" });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface TallerOption {
  id: string;
  label: string;
}

const InformesHistoricos = () => {
  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaller, setSelectedTaller] = useState<TallerOption | null>(
    null
  );
  const [calculo, setCalculo] = useState<TallerCalculoRow[] | null>(null);
  const [loadingCalculo, setLoadingCalculo] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(
    exportFieldDefinitions.map((field) => field.key)
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minPeso, setMinPeso] = useState("");
  const [maxPeso, setMaxPeso] = useState("");
  const [deltaFilter, setDeltaFilter] = useState<"all" | "above" | "below">(
    "all"
  );

  const tallerOptions = useMemo<TallerOption[]>(() => {
    return talleres.map((taller) => ({
      id: taller.id,
      label: `${taller.nombre_taller} · ${pesoFormatter.format(
        taller.total_peso
      )} kg`,
    }));
  }, [talleres]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const talleresData = await getTalleres();

        if (!isMounted) {
          return;
        }

        setTalleres(talleresData);
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible cargar los informes desde la API.");
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
  }, []);

  useEffect(() => {
    if (!selectedTaller) {
      setCalculo(null);
      return;
    }

    let isMounted = true;

    const fetchCalculo = async () => {
      try {
        setLoadingCalculo(true);
        const response = await getTallerCalculo(selectedTaller.id);
        if (!isMounted) {
          return;
        }
        setCalculo(response);
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            "No fue posible obtener el cálculo del taller seleccionado."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingCalculo(false);
        }
      }
    };

    void fetchCalculo();

    return () => {
      isMounted = false;
    };
  }, [selectedTaller]);

  useEffect(() => {
    setSelectedFields(exportFieldDefinitions.map((field) => field.key));
    setSearchQuery("");
    setMinPeso("");
    setMaxPeso("");
    setDeltaFilter("all");
  }, [selectedTaller]);

  const filteredCalculo = useMemo(() => {
    if (!calculo) {
      return [];
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const minPesoValue = parseFloat(minPeso);
    const maxPesoValue = parseFloat(maxPeso);

    return calculo.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [row.nombre_corte, row.descripcion, row.item_code]
          .map((value) => normalizeWhitespace(value).toLowerCase())
          .some((value) => value.includes(normalizedQuery));

      const matchesMinPeso =
        Number.isNaN(minPesoValue) || row.peso >= minPesoValue;
      const matchesMaxPeso =
        Number.isNaN(maxPesoValue) || row.peso <= maxPesoValue;

      const matchesDelta =
        deltaFilter === "all" ||
        (deltaFilter === "above" &&
          row.porcentaje_real >= row.porcentaje_default) ||
        (deltaFilter === "below" &&
          row.porcentaje_real < row.porcentaje_default);

      return matchesQuery && matchesMinPeso && matchesMaxPeso && matchesDelta;
    });
  }, [calculo, deltaFilter, maxPeso, minPeso, searchQuery]);

  const selectedFieldDefinitions = useMemo(
    () =>
      exportFieldDefinitions.filter((field) =>
        selectedFields.includes(field.key)
      ),
    [selectedFields]
  );

  const formattedRows = useMemo(() => {
    if (!filteredCalculo.length) {
      return [];
    }

    return filteredCalculo.map((row) =>
      selectedFieldDefinitions.map((field) =>
        normalizeWhitespace(field.getValue(row))
      )
    );
  }, [filteredCalculo, selectedFieldDefinitions]);

  const headers = useMemo(
    () => selectedFieldDefinitions.map((field) => field.label),
    [selectedFieldDefinitions]
  );

  const exportFileName = useMemo(() => {
    if (!selectedTaller) {
      return "detalle_taller";
    }
    return `taller_${selectedTaller.id}`;
  }, [selectedTaller]);

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields((prev) => {
      if (prev.includes(fieldKey)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((key) => key !== fieldKey);
      }
      return [...prev, fieldKey];
    });
  };

  const handleExportCsv = () => {
    if (!formattedRows.length) {
      return;
    }
    const csvRows = [
      headers.map((header) => escapeCsvValue(header)).join(";"),
      ...formattedRows.map((row) =>
        row.map((value) => escapeCsvValue(value)).join(";")
      ),
    ];

    const csvContent = `\ufeff${csvRows.join("\n")}`;
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    downloadBlob(blob, `${exportFileName}.csv`);
  };

  const handleExportExcel = () => {
    if (!formattedRows.length) {
      return;
    }

    const tableHead = headers
      .map((header) => `<th>${escapeHtmlValue(header)}</th>`)
      .join("");
    const tableBody = formattedRows
      .map(
        (row) =>
          `<tr>${row
            .map((value) => `<td>${escapeHtmlValue(value)}</td>`)
            .join("")}</tr>`
      )
      .join("");

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table border="1"><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table></body></html>`;
    const blob = new Blob([htmlContent], {
      type: "application/vnd.ms-excel",
    });

    downloadBlob(blob, `${exportFileName}.xls`);
  };

  const handleExportPdf = () => {
    if (!formattedRows.length) {
      return;
    }

    const pdfBlob = createSimplePdf(
      `Detalle del taller ${selectedTaller?.label ?? ""}`.trim(),
      headers,
      formattedRows
    );

    downloadBlob(pdfBlob, `${exportFileName}.pdf`);
  };

  const exportDisabled =
    !formattedRows.length || selectedFieldDefinitions.length === 0;

  return (
    <Stack spacing={4}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={1}>
          <Typography variant="h4" component="h1">
            Informes históricos de talleres
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consulta la información registrada de talleres anteriores. El
            detalle proviene de la vista consolidada en la base de datos y
            refleja los porcentajes reales versus los objetivos de cada corte.
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <div>
            <Typography variant="h6" component="h2">
              Selecciona un taller
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Busca por material o fecha para revisar el reparto de cortes y sus
              valores estimados.{" "}
            </Typography>
          </div>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Autocomplete
            options={tallerOptions}
            value={selectedTaller}
            onChange={(_, value) => setSelectedTaller(value)}
            loading={loading}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Taller"
                placeholder="Ej. Lomo vetado — 12/05/2024"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {loadingCalculo && (
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                Cargando detalle del taller…
              </Typography>
            </Stack>
          )}
          {!loadingCalculo && calculo && selectedTaller && (
            <Stack spacing={3}>
              <Stack spacing={2}>
                <div>
                  <Typography variant="h6" component="h3">
                    Filtra el detalle del informe
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filtra para encontrar el corte especifico
                  </Typography>
                </div>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{ width: "100%" }}
                >
                  <TextField
                    label="Buscar por corte, descripcion o codigo"
                    placeholder="Ej. bola, lomo"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    fullWidth
                  />
                  <TextField
                    select
                    label="Variacion vs objetivo"
                    value={deltaFilter}
                    onChange={(event) =>
                      setDeltaFilter(
                        event.target.value as "all" | "above" | "below"
                      )
                    }
                    helperText="Filtra segun si el porcentaje real esta sobre o bajo el objetivo"
                    sx={{ minWidth: { md: 260 } }}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="above">Sobre o igual al objetivo</MenuItem>
                    <MenuItem value="below">Por debajo del objetivo</MenuItem>
                  </TextField>
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Peso minimo (KG)"
                    type="number"
                    value={minPeso}
                    onChange={(event) => setMinPeso(event.target.value)}
                    inputProps={{ min: 0, step: "0.001" }}
                    helperText="Muestra cortes con peso igual o superor al valor"
                  />
                  <TextField
                    label="Peso maximo (KG)"
                    type="number"
                    value={maxPeso}
                    onChange={(event) => setMaxPeso(event.target.value)}
                    inputProps={{ min: 0, stepp: "0.001" }}
                    helperText="Muestra cortes con peso igual o inferior al valor"
                  />
                </Stack>
              </Stack>

              {!filteredCalculo.length ? (
                <Alert severity="info">
                  No se encontraron cortes que cumplan con los filtos
                  seleccionados.
                </Alert>
              ) : (
                <TallerCalculoTable
                  titulo={`Detaller del taller · ${selectedTaller.label}`}
                  calculo={filteredCalculo}
                  observaciones={
                    talleres.find((t) => t.id === selectedTaller.id)
                      ?.descripcion ?? null
                  }
                />
              )}

              <Stack spacing={2}>
                <div>
                  <Typography variant="h6" component="h3">
                    Exportar informe
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Selecciona los campos que deseas incluir y descarga el
                    detalle del taller en el formato que necesites.
                  </Typography>
                </div>

                <FormGroup row>
                  {exportFieldDefinitions.map((field) => (
                    <FormControlLabel
                      key={field.key}
                      control={
                        <Checkbox
                          checked={selectedFields.includes(field.key)}
                          onChange={() => handleFieldToggle(field.key)}
                          size="small"
                        />
                      }
                      label={field.label}
                    />
                  ))}
                </FormGroup>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ width: "100%" }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<TableRowsIcon />}
                    onClick={handleExportCsv}
                    disabled={exportDisabled}
                  >
                    Exportar CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<GridOnIcon />}
                    onClick={handleExportExcel}
                    disabled={exportDisabled}
                  >
                    Exportar Excel
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={handleExportPdf}
                    disabled={exportDisabled}
                  >
                    Exportar PDF
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          )}

          {!loading && !calculo && !selectedTaller && talleres.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No hay talleres registrados en el sistema. Registra uno desde la
              sección de talleres para visualizar sus detalles aquí.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default InformesHistoricos;
