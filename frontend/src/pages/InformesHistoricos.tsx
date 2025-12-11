import { useEffect, useMemo, useState } from "react";
import { Alert, CircularProgress, Stack, Typography } from "@mui/material";
import { getTallerCalculo, getTalleres } from "../api/talleresApi";
import { TallerCalculoRow, TallerListItem } from "../types";
import TallerCalculoTable from "../components/TallerCalculoTable";
import PageSection from "../components/PageSection";
import PageHeader from "../components/PageHeader";
import TallerSelectionCard, {
  TallerOption,
} from "../components/informes/TallerSelectionCard";
import InformeFilters, {
  DeltaFilter,
} from "../components/informes/InformeFilters";
import InformeExportPanel, {
  ExportField,
} from "../components/informes/InformeExportPanel";

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

interface ExportFieldDefinition extends ExportField {
  getValue: (row: TallerCalculoRow) => string;
}

const exportFieldDefinitions: ExportFieldDefinition[] = [
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
  const [deltaFilter, setDeltaFilter] = useState<DeltaFilter>("all");

  const tallerOptions = useMemo<TallerOption[]>(() => {
    return talleres.map((taller) => ({
      id: taller.id,
      label: `${taller.nombre_taller} · ${pesoFormatter.format(
        taller.total_peso
      )} kg`,
    }));
  }, [talleres]);

  const fetchTalleres = async () => {
    try {
      setLoading(true);
      const talleresData = await getTalleres();
      setTalleres(talleresData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No fue posible cargar los informes desde la API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTalleres();
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

  return (
    <Stack spacing={3} className="animate-fade-up">
      <PageSection
        title={
          <PageHeader
            title="Informes históricos de talleres"
            description="Consulta la información registrada de talleres anteriores. El detalle proviene de la vista consolidada en la base de datos y refleja los porcentajes reales versus los objetivos de cada corte."
          />
        }
        description={null}
      >
        <Typography variant="body2" color="text.secondary">
          Usa las tarjetas de filtros y exportación para trabajar con los datos
          que más importan a tu equipo.
        </Typography>
      </PageSection>

      <TallerSelectionCard
        options={tallerOptions}
        value={selectedTaller}
        loading={loading}
        error={error}
        onChange={setSelectedTaller}
        onRetry={fetchTalleres}
        helperText="Selecciona el taller que deseas revisar para habilitar los filtros y exportaciones."
      />

      <InformeFilters
        searchQuery={searchQuery}
        minPeso={minPeso}
        maxPeso={maxPeso}
        deltaFilter={deltaFilter}
        disabled={!selectedTaller || loadingCalculo}
        onSearchChange={setSearchQuery}
        onMinPesoChange={setMinPeso}
        onMaxPesoChange={setMaxPeso}
        onDeltaFilterChange={setDeltaFilter}
      />

      <PageSection
        title="Detalle del taller seleccionado"
        description="Visualiza el desempeño por corte con los filtros aplicados."
      >
        <Stack spacing={2.5}>
          {!selectedTaller ? (
            <Alert severity="info">
              Selecciona un taller para ver su cálculo consolidado y los
              indicadores de porcentaje.
            </Alert>
          ) : loadingCalculo ? (
            <Stack spacing={1} alignItems="center" justifyContent="center">
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Obteniendo el cálculo del taller seleccionado...
              </Typography>
            </Stack>
          ) : error ? (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          ) : !calculo || calculo.length === 0 ? (
            <Alert severity="info">
              No se encontró cálculo para el taller seleccionado.
            </Alert>
          ) : !filteredCalculo.length ? (
            <Alert severity="info">
              No se encontraron cortes que cumplan con los filtros
              seleccionados.
            </Alert>
          ) : (
            <TallerCalculoTable
              titulo={`Detalle del taller · ${selectedTaller.label}`}
              calculo={filteredCalculo}
              observaciones={
                talleres.find((t) => t.id === selectedTaller.id)?.descripcion ??
                null
              }
            />
          )}
        </Stack>
      </PageSection>

      <InformeExportPanel
        fields={exportFieldDefinitions}
        selectedFields={selectedFields}
        disabled={
          !formattedRows.length ||
          selectedFieldDefinitions.length === 0 ||
          !selectedTaller ||
          loadingCalculo
        }
        onToggleField={handleFieldToggle}
        onExportCsv={handleExportCsv}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
      />
    </Stack>
  );
};

export default InformesHistoricos;
