import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { getTallerCalculo, getTalleres } from "../api/talleresApi";
import { TallerCalculoRow, TallerListItem } from "../types";
import PageSection from "../components/PageSection";
import PageHeader from "../components/PageHeader";
import type { TallerOption } from "../components/informes/TallerSelectionCard";
import InformeFilters from "../components/informes/InformeFilters";
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

type InformeScope = "taller" | "sede" | "material";

type TallerCalculoWithMeta = TallerCalculoRow & {
  tallerId: number;
  tallerNombre: string;
  sede: string | null;
  material: string | null;
};

const UNKNOWN_BRANCH_LABEL = "Sin sede asignada";

interface ExportFieldDefinition extends ExportField {
  getValue: (row: TallerCalculoWithMeta) => string;
}

const exportFieldDefinitions: ExportFieldDefinition[] = [
  {
    key: "taller_nombre",
    label: "Taller",
    getValue: (row) => row.tallerNombre,
  },
  {
    key: "sede",
    label: "Sede",
    getValue: (row) => row.sede ?? UNKNOWN_BRANCH_LABEL,
  },
  {
    key: "material",
    label: "Material",
    getValue: (row) => row.material ?? "Sin material",
  },
  {
    key: "nombre_corte",
    label: "Corte",
    getValue: (row) => row.nombre_corte,
  },
  {
    key: "descripcion",
    label: "Descripcion",
    getValue: (row) => row.descripcion,
  },
  {
    key: "item_code",
    label: "Codigo de ítem",
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

type PdfHighlight = { label: string; value: string };

type PdfReportMetadata = {
  subtitle?: string;
  gemeratedAt?: string;
  filters?: string[];
  highlights?: PdfHighlight[];
};

const slugify = (value: string) =>
  normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const createSimplePdf = (
  title: string,
  header: string[],
  rows: string[][],
  metadata: PdfReportMetadata = {}
) => {
  const encoder = new TextEncoder();
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const approxCharWidth = 0.48;
  const headerBandHeight = 54;
  const color = {
    primary: "0.11 0.36 0.63",
    primaryDark: "0.08 0.26 0.48",
    neutral: "0.96 0.97 0.99",
    neutralDarker: "0.88 0.90 0.94",
    textMuted: "0.35 0.35 0.40",
  } as const;
  const pages: string[][] = [];
  let currentLines: string[] = [];
  let currentY = pageHeight - margin;

  const wrapText = (
    text: string,
    fontSize: number,
    maxWidth: number = contentWidth
  ) => {
    const normalized = normalizeWhitespace(text);
    const maxChars = Math.max(
      8,
      Math.floor(maxWidth / (fontSize * approxCharWidth))
    );
    const words = normalized.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;
      if (nextLine.length <= maxChars) {
        currentLine = nextLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const addTextLine = (
    text: string,
    fontSize: number,
    x: number = margin,
    yOverride?: number,
    font: "F1" | "F2" = "F1",
    colorValue = "0 0 0"
  ) => {
    const targetY = typeof yOverride === "number" ? yOverride : currentY;
    currentLines.push(`${colorValue} rg`);
    currentLines.push("BT");
    currentLines.push(`/${font} ${fontSize} Tf`);
    currentLines.push(`${x} ${targetY} Td`);
    currentLines.push(`(${escapePdfText(text)}) Tj`);
    currentLines.push("ET");
    currentLines.push("0 0 0 rg");
    if (typeof yOverride !== "number") {
      currentY -= fontSize + 2;
    }
  };

  const addSeparator = (offset = 6) => {
    const separatorY = currentY - offset;
    currentLines.push(`${color.textMuted} RG`);
    currentLines.push(`${margin} ${separatorY} m`);
    currentLines.push(`${pageWidth - margin} ${separatorY} l`);
    currentLines.push("S");
    currentLines.push("0 0 0 RG");
    currentY = separatorY - 10;
  };

  const addRoundedRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor?: string,
    strokeColor?: string
  ) => {
    if (fillColor) {
      currentLines.push(`${fillColor} rg`);
    }
    if (strokeColor) {
      currentLines.push(`${strokeColor} RG`);
    }
    currentLines.push(`${x} ${y} ${width} ${height} re`);
    if (fillColor && strokeColor) {
      currentLines.push("B");
    } else if (fillColor) {
      currentLines.push("f");
    } else if (strokeColor) {
      currentLines.push("S");
    }
    currentLines.push("0 0 0 rg");
    currentLines.push("0 0 0 RG");
  };

  const startPage = (isFirstPage: boolean) => {
    if (currentLines.length) {
      pages.push(currentLines);
    }
    currentLines = [];
    currentY = pageHeight - margin;

    const headerBottomY = currentY - headerBandHeight;
    addRoundedRect(
      margin,
      headerBottomY,
      contentWidth,
      headerBandHeight,
      color.primary,
      color.primaryDark
    );

    addTextLine(
      isFirstPage ? title : `${title} (continuacion)`,
      isFirstPage ? 18 : 16,
      margin + 12,
      currentY - 22,
      "F2",
      "1 1 1"
    );

    addTextLine(
      metadata.subtitle ?? "Informe consolidado de operaciones",
      11,
      margin + 12,
      currentY - 38,
      "F1",
      "0.92 0.95 1"
    );

    currentY = headerBottomY - 18;

    if (metadata.gemeratedAt) {
      addTextLine(
        `Generado: ${metadata.gemeratedAt}`,
        10,
        margin,
        undefined,
        "F1",
        color.textMuted
      );
      currentY -= 4;
    }
    addSeparator();
  };

  const ensureSpace = (spaceNeeded: number) => {
    if (currentY - spaceNeeded < margin) {
      startPage(false);
    }
  };

  const addWrappedText = (
    text: string,
    fontSize: number,
    x: number = margin,
    maxWidth: number = contentWidth,
    font: "F1" | "F2" = "F1",
    colorValue = "0 0 0"
  ) => {
    const lines = wrapText(text, fontSize, maxWidth);
    ensureSpace(lines.length * (fontSize + 2));
    lines.forEach((line, index) => {
      const y = currentY - index * (fontSize + 2);
      addTextLine(line, fontSize, x, y, font, colorValue);
    });
    currentY -= lines.length * (fontSize + 2) + 2;
  };

  const getColumnWeights = (columns: string[]) =>
    columns.map((column) => {
      const normalized = column.toLowerCase();
      if (normalized.includes("descrip")) {
        return 2.1;
      }
      if (normalized.includes("valor")) {
        return 1.5;
      }
      if (normalized.includes("precio")) {
        return 1.4;
      }
      if (normalized.includes("código")) {
        return 1.3;
      }
      if (normalized.includes("taller")) {
        return 1.2;
      }
      if (normalized.includes("sede")) {
        return 1.15;
      }
      if (normalized.includes("material")) {
        return 1.15;
      }
      if (normalized.includes("peso")) {
        return 1.1;
      }
      if (normalized.includes("%")) {
        return 0.95;
      }
      return 1.05;
    });

  const columnWeights = getColumnWeights(header);
  const totalWeight = columnWeights.reduce((acc, weight) => acc + weight, 0);
  const columnWidths = columnWeights.map(
    (weight) => (weight / totalWeight) * contentWidth
  );
  const columnOffsets = columnWidths.reduce<number[]>((acc, width) => {
    const last = acc[acc.length - 1] ?? 0;
    acc.push(last + width);
    return acc;
  }, []);

  const addTableRow = (
    cells: string[],
    fontSize: number,
    rowIndex: number,
    isHeader = false
  ) => {
    const cellPadding = 4;
    const wrappedCells = cells.map((cell, columnIndex) =>
      wrapText(cell, fontSize, columnWidths[columnIndex] - cellPadding * 2)
    );
    const maxLines = Math.max(1, ...wrappedCells.map((cell) => cell.length));
    const rowHeight = maxLines * (fontSize + 3) + cellPadding * 2;
    ensureSpace(rowHeight + 12);

    const rowTopY = currentY - cellPadding;

    const backgroundColor = isHeader
      ? color.neutralDarker
      : rowIndex % 2 === 0
      ? color.neutral
      : undefined;

    if (backgroundColor) {
      addRoundedRect(
        margin,
        rowTopY - rowHeight,
        contentWidth,
        rowHeight,
        backgroundColor
      );
    }

    wrappedCells.forEach((cellLines, columnIndex) => {
      const x = margin + (columnOffsets[columnIndex - 1] ?? 0);
      cellLines.forEach((line, lineIndex) => {
        const y = rowTopY - fontSize - lineIndex * (fontSize + 3);
        addTextLine(
          line,
          fontSize,
          x + cellPadding,
          y,
          isHeader ? "F2" : "F1",
          isHeader ? color.primaryDark : "0 0 0"
        );
      });
    });

    const rowBottomY = rowTopY - rowHeight;
    const separatorY = rowBottomY - 6;
    currentLines.push(`${color.neutralDarker} RG`);
    currentLines.push(`${margin} ${separatorY} m`);
    currentLines.push(`${pageWidth - margin} ${separatorY} l`);
    currentLines.push("S");
    currentLines.push("0 0 0 RG");
    currentY = separatorY - 6;
  };

  startPage(true);

  if (metadata.filters?.length) {
    addTextLine(
      "Filtros aplicados",
      12,
      margin,
      undefined,
      "F2",
      color.primaryDark
    );
    metadata.filters.forEach((filter) =>
      addWrappedText(
        `• ${filter}`,
        10,
        margin + 8,
        contentWidth,
        "F1",
        color.textMuted
      )
    );
    addSeparator();
  }

  if (metadata.highlights?.length) {
    addTextLine(
      "Resumen ejecutivo",
      12,
      margin,
      undefined,
      "F2",
      color.primaryDark
    );
    metadata.highlights.forEach((item) => {
      ensureSpace(28);
      addRoundedRect(margin, currentY - 22, contentWidth, 20, color.neutral);
      addTextLine(
        `${item.label}`,
        10,
        margin + 8,
        currentY - 18,
        "F2",
        color.textMuted
      );
      addTextLine(`${item.value}`, 11, margin + 200, currentY - 18, "F1");
      currentY -= 26;
    });
    addSeparator();
  }

  addTextLine("Detalle", 12, margin, undefined, "F2", color.primaryDark);
  addSeparator();

  addTableRow(header, 11, 0, true);
  rows.forEach((row, index) => {
    if (currentY < margin + 60) {
      addSeparator();
      startPage(false);
      addTextLine(
        "Detalle (continúa)",
        12,
        margin,
        undefined,
        "F2",
        color.primaryDark
      );
      addSeparator();
      addTableRow(header, 11, 0, true);
    }
    addTableRow(row, 10, index);
  });

  if (currentLines.length) {
    pages.push(currentLines);
  }

  const pageContentStreams = pages.map((pageLines) => pageLines.join("\n"));
  const pageContentBytes = pageContentStreams.map((content) =>
    encoder.encode(content)
  );

  const fontObjectIdStart = 3 + pages.length * 2;
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
          body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontObjectIdStart} 0 R /F2 ${
            fontObjectIdStart + 1
          } 0 R >> >> >>`,
        },
        {
          id: `${contentId} 0 obj`,
          body: `<< /Length ${streamLength} >>
stream
${pageContentStreams[index]}
endstream`,
        },
      ];
    }),
    {
      id: `${fontObjectIdStart} 0 obj`,
      body: "<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>",
    },
    {
      id: `${fontObjectIdStart + 1} 0 obj`,
      body: "<< /Type /Font /Subtype /Type1 /Name /F2 /BaseFont /Helvetica-Bold >>",
    },
  ];

  const headerBytes = encoder.encode("%PDF-1.4\n");
  const pdfChunks: Uint8Array[] = [headerBytes];
  const offsets: string[] = ["0000000000 65535 f \n"];
  let currentOffset = headerBytes.length;

  const padNumber = (value: number) => value.toString().padStart(10, "0");

  objects.forEach((object) => {
    const objectString = `${object.id}
${object.body}
endobj
`;
    const bytes = encoder.encode(objectString);
    offsets.push(`${padNumber(currentOffset)} 00000 n \n`);
    pdfChunks.push(bytes);
    currentOffset += bytes.length;
  });

  const xrefOffset = currentOffset;
  const xrefString = `xref
0 ${objects.length + 1}
${offsets.join("")}`;
  const xrefBytes = encoder.encode(xrefString);
  pdfChunks.push(xrefBytes);
  currentOffset += xrefBytes.length;

  const trailerString = `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;
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
  const [scope, setScope] = useState<InformeScope>("taller");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaller, setSelectedTaller] = useState<TallerOption | null>(
    null
  );
  const [selectedSedes, setSelectedSedes] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [calculo, setCalculo] = useState<TallerCalculoWithMeta[] | null>(null);
  const [loadingCalculo, setLoadingCalculo] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(
    exportFieldDefinitions.map((field) => field.key)
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minPeso, setMinPeso] = useState("");
  const [maxPeso, setMaxPeso] = useState("");
  const individualTallerOptions = useMemo<TallerOption[]>(() => {
    return talleres.map((taller) => ({
      id: String(taller.id),
      label: `${taller.nombre_taller} · ${pesoFormatter.format(
        taller.total_peso
      )} kg`,
    }));
  }, [talleres]);

  const availableSedes = useMemo(() => {
    const sedeSet = new Set<string>();
    talleres.forEach((taller) => {
      const sedeLabel = taller.sede ?? UNKNOWN_BRANCH_LABEL;
      sedeSet.add(sedeLabel);
    });
    return Array.from(sedeSet).sort();
  }, [talleres]);

  const materialOptions = useMemo(() => {
    const materials = new Set<string>();
    talleres.forEach((taller) => {
      const material = taller.codigo_principal?.trim();
      if (material) {
        materials.add(material);
      }
    });
    return Array.from(materials).sort();
  }, [talleres]);

  const selectedTallerIds = useMemo(() => {
    if (scope === "taller") {
      return selectedTaller ? [selectedTaller.id] : [];
    }

    let filtered = talleres;
    const normalizedSedes =
      scope === "sede"
        ? selectedSedes.length
          ? selectedSedes
          : availableSedes
        : selectedSedes;

    if (normalizedSedes.length) {
      filtered = filtered.filter((taller) => {
        const sedeLabel = taller.sede ?? UNKNOWN_BRANCH_LABEL;
        return normalizedSedes.includes(sedeLabel);
      });
    }

    if (scope === "material") {
      if (!selectedMaterial) {
        return [];
      }
      filtered = filtered.filter(
        (taller) => taller.codigo_principal === selectedMaterial
      );
    }

    return filtered.map((taller) => String(taller.id));
  }, [
    availableSedes,
    scope,
    selectedMaterial,
    selectedSedes,
    selectedTaller,
    talleres,
  ]);

  const selectedTalleres = useMemo(
    () =>
      talleres.filter((taller) =>
        selectedTallerIds.includes(String(taller.id))
      ),
    [selectedTallerIds, talleres]
  );

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
    if (scope !== "taller") {
      setSelectedTaller(null);
    }

    if (scope !== "material") {
      setSelectedMaterial(null);
    }

    if (scope === "taller") {
      setSelectedSedes([]);
    }
  }, [scope]);

  useEffect(() => {
    if (!selectedTallerIds.length) {
      setCalculo(null);
      return;
    }

    let isMounted = true;

    const fetchCalculo = async () => {
      try {
        setLoadingCalculo(true);
        const responses = await Promise.allSettled(
          selectedTallerIds.map(async (tallerId) => {
            const data = await getTallerCalculo(tallerId);
            const meta = talleres.find(
              (taller) => String(taller.id) === tallerId
            );

            return data.map((row) => ({
              ...row,
              tallerId: Number(tallerId),
              tallerNombre: meta?.nombre_taller ?? `Taller ${tallerId}`,
              sede: meta?.sede ?? null,
              material: meta?.codigo_principal ?? null,
            }));
          })
        );
        if (!isMounted) {
          return;
        }

        const fulfilledResults = responses.filter(
          (result): result is PromiseFulfilledResult<TallerCalculoWithMeta[]> =>
            result.status === "fulfilled"
        );

        const merged = fulfilledResults.flatMap((result) => result.value);
        setCalculo(merged);

        const hasFailures = responses.some(
          (result) => result.status === "rejected"
        );

        if (hasFailures) {
          setError(
            "Algunos talleres no pudieron cargarse. Verifica la conexion e inténtalo de nuevo."
          );
        } else {
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            "No fue posible obtener el cálculo de los talleres seleccionados."
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
  }, [selectedTallerIds, talleres]);

  useEffect(() => {
    setSelectedFields(exportFieldDefinitions.map((field) => field.key));
    setSearchQuery("");
    setMinPeso("");
    setMaxPeso("");
  }, [selectedTallerIds]);

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

      return matchesQuery && matchesMinPeso && matchesMaxPeso;
    });
  }, [calculo, maxPeso, minPeso, searchQuery]);

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
    if (!selectedTallerIds.length) {
      return "detalle_taller";
    }

    if (scope === "taller" && selectedTaller) {
      return `taller_${selectedTaller.id}`;
    }

    if (scope === "sede") {
      const sedesSlug = (selectedSedes.length ? selectedSedes : availableSedes)
        .map((value) => slugify(value))
        .join("-");
      return `talleres_sede_${sedesSlug || "todas"}`;
    }

    if (scope === "material" && selectedMaterial) {
      const sedesSlug = (selectedSedes.length ? selectedSedes : ["todas_sedes"])
        .map((value) => slugify(value))
        .join("-");
      return `material_${slugify(selectedMaterial)}_${sedesSlug}`;
    }

    return "detalle_taller";
  }, [
    availableSedes,
    scope,
    selectedMaterial,
    selectedSedes,
    selectedTaller,
    selectedTallerIds.length,
  ]);

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

    const sedesSeleccionadas =
      scope === "sede"
        ? selectedSedes.length
          ? selectedSedes
          : availableSedes
        : selectedSedes;

    const scopeDescription =
      scope === "taller" && selectedTaller
        ? `Alcance: Taller ${selectedTaller.label}`
        : scope === "sede"
        ? `Alcance: ${sedesSeleccionadas.length} sede(s)`
        : scope === "material" && selectedMaterial
        ? `Alcance: Material ${selectedMaterial}`
        : "Alcance: seleccion personalizada";

    const filtersSummary = [
      scopeDescription,
      sedesSeleccionadas.length
        ? `Sedes: ${sedesSeleccionadas.join(", ")}`
        : null,
      scope === "material" && selectedMaterial
        ? `Material: ${selectedMaterial}`
        : null,
      `Columnas incluidas: ${headers.join(", ")}`,
      `Registros filtrados: ${formattedRows.length}`,
    ].filter(Boolean) as string[];

    const pdfTitle =
      scope === "taller" && selectedTaller
        ? `Detalle del taller ${selectedTaller.label}`
        : "Detalle de los talleres seleccionados";

    const pdfBlob = createSimplePdf(pdfTitle, headers, formattedRows, {
      subtitle: "Informe gerencial consolidado",
      gemeratedAt: new Intl.DateTimeFormat("es-CO", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date()),
      filters: filtersSummary,
      highlights: [
        { label: "Talleres incluidos", value: resumen.talleres.toString() },
        { label: "Total cortes", value: resumen.cortes.toString() },
        {
          label: "Peso filtrado",
          value: `${pesoFormatter.format(resumen.totalPeso)} kg`,
        },
        {
          label: "Valor estimado",
          value: currencyFormatter.format(resumen.totalValor),
        },
      ],
    });

    downloadBlob(pdfBlob, `${exportFileName}.pdf`);
  };

  const resumen = useMemo(() => {
    const totalPeso = filteredCalculo.reduce((acc, row) => acc + row.peso, 0);
    const totalValor = filteredCalculo.reduce(
      (acc, row) => acc + row.valor_estimado,
      0
    );
    const talleresContados = new Set(filteredCalculo.map((row) => row.tallerId))
      .size;

    return {
      totalPeso,
      totalValor,
      cortes: filteredCalculo.length,
      talleres: talleresContados,
    };
  }, [filteredCalculo]);

  return (
    <Stack spacing={3} className="animate-fade-up">
      <PageSection
        title={
          <PageHeader
            title="Informes historicos de talleres"
            description="Consulta la informacion registrada de talleres anteriores. El detalle proviene de la vista consolidada en la base de datos y refleja los porcentajes reales de cada corte."
          />
        }
        description={null}
      >
        <Typography variant="body2" color="text.secondary">
          Usa las tarjetas de filtros y exportacion para trabajar con los datos
          que más importan a tu equipo.
        </Typography>
      </PageSection>

      <PageSection
        title="Alcance del informe"
        description="Elige si quieres analizar un taller individual, todas las operaciones de una sede o comparar un material entre sedes."
        spacing={2.5}
      >
        <Stack spacing={2.5}>
          <ToggleButtonGroup
            value={scope}
            exclusive
            onChange={(_, value) => {
              if (value) {
                setScope(value);
              }
            }}
            aria-label="Alcance del informe"
            size="small"
          >
            <ToggleButton value="taller">Taller individual</ToggleButton>
            <ToggleButton value="sede">Sede</ToggleButton>
            <ToggleButton value="material">Material</ToggleButton>
          </ToggleButtonGroup>

          {scope === "taller" ? (
            <Autocomplete
              value={selectedTaller}
              options={individualTallerOptions}
              loading={loading}
              onChange={(_, selected) => setSelectedTaller(selected)}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, optionValue) =>
                option.id === optionValue.id
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Taller"
                  placeholder="Ej: Material o rango de fechas"
                  helperText="Selecciona un taller específico o cambia el alcance para comparar varios."
                />
              )}
            />
          ) : (
            <Stack spacing={1.5}>
              {scope === "material" ? (
                <Autocomplete
                  value={selectedMaterial}
                  options={materialOptions}
                  onChange={(_, value) => setSelectedMaterial(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Material principal"
                      placeholder="Ej: codigo del ítem"
                      helperText="Elige el material que deseas comparar entre sedes."
                    />
                  )}
                />
              ) : null}

              <Autocomplete
                multiple
                disableCloseOnSelect
                value={
                  scope === "sede" && selectedSedes.length === 0
                    ? availableSedes
                    : selectedSedes
                }
                options={availableSedes}
                onChange={(_, values) => setSelectedSedes(values)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key ?? option}
                        label={option}
                        size="small"
                        {...tagProps}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sedes"
                    placeholder="Selecciona una o más sedes"
                    helperText={
                      scope === "sede"
                        ? "Si no eliges sedes se incluirán todas."
                        : "Usa sedes para acotar la comparacion del material."
                    }
                  />
                )}
              />

              <Typography variant="body2" color="text.secondary">
                {scope === "material" && !selectedMaterial
                  ? "Selecciona un material para ver los talleres disponibles."
                  : selectedTallerIds.length
                  ? `Se incluirán ${selectedTallerIds.length} talleres en el informe.`
                  : "Ajusta los filtros de alcance para incluir talleres en el informe."}
              </Typography>

              {selectedTalleres.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {selectedTalleres.map((taller) => (
                    <Chip
                      key={taller.id}
                      label={`${taller.nombre_taller}${
                        taller.sede ? ` · ${taller.sede}` : ""
                      }`}
                      size="small"
                    />
                  ))}
                </Stack>
              ) : null}
            </Stack>
          )}

          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </PageSection>

      <InformeFilters
        searchQuery={searchQuery}
        minPeso={minPeso}
        maxPeso={maxPeso}
        disabled={!selectedTallerIds.length || loadingCalculo || loading}
        onSearchChange={setSearchQuery}
        onMinPesoChange={setMinPeso}
        onMaxPesoChange={setMaxPeso}
      />

      <PageSection
        title="Detalle de los talleres seleccionados"
        description="Visualiza el desempeño por corte con los filtros aplicados."
      >
        <Stack spacing={2.5}>
          {!selectedTallerIds.length ? (
            <Alert severity="info">
              Selecciona un taller o ajusta el alcance para ver su detalle.
            </Alert>
          ) : null}

          {selectedTallerIds.length && loadingCalculo ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2">
                Cargando detalle de los talleres seleccionados...
              </Typography>
            </Stack>
          ) : null}

          {selectedTallerIds.length &&
          !loadingCalculo &&
          filteredCalculo.length === 0 ? (
            <Alert severity="warning">
              No se encontraron cortes que coincidan con los filtros aplicados.
            </Alert>
          ) : null}

          {filteredCalculo.length ? (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                divider={<Divider flexItem orientation="vertical" />}
                spacing={2.5}
              >
                <Stack spacing={0.5}>
                  <Typography variant="overline" color="text.secondary">
                    Total cortes
                  </Typography>
                  <Typography variant="h6">{resumen.cortes}</Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="overline" color="text.secondary">
                    Peso filtrado
                  </Typography>
                  <Typography variant="h6">
                    {pesoFormatter.format(resumen.totalPeso)} kg
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="overline" color="text.secondary">
                    Valor estimado
                  </Typography>
                  <Typography variant="h6">
                    {currencyFormatter.format(resumen.totalValor)}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1.5}>
                {filteredCalculo.map((row, index) => (
                  <Stack
                    key={`${row.tallerId}-${row.item_code}-${row.nombre_corte}-${row.peso}-${index}`}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">
                        {row.nombre_corte}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.descripcion}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Codigo: {row.item_code || "N/A"}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={2}
                      divider={<Divider flexItem orientation="vertical" />}
                    >
                      <Stack spacing={0.25}>
                        <Typography variant="overline" color="text.secondary">
                          Peso
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {pesoFormatter.format(row.peso)} kg
                        </Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="overline" color="text.secondary">
                          % Real
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {porcentajeFormatter.format(row.porcentaje_real)}%
                        </Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="overline" color="text.secondary">
                          Venta estimada
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {currencyFormatter.format(row.valor_estimado)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ) : null}
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
