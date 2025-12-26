export const normalizeWhitespace = (value: string) => value.replace(/\u00a0/g, " ");

const stripPdfAccents = (value: string) =>
  normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const escapePdfText = (value: string) => {
  const normalized = stripPdfAccents(value);
  let escaped = "";

  for (const char of normalized) {
    if (char === "\\") {
      escaped += "\\\\";
      continue;
    }
    if (char === "(") {
      escaped += "\\(";
      continue;
    }
    if (char === ")") {
      escaped += "\\)";
      continue;
    }

    const code = char.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) {
      escaped += char;
      continue;
    }
    if (code <= 0xff) {
      escaped += `\\${code.toString(8).padStart(3, "0")}`;
    }
  }

  return escaped;
};

export type PdfHighlight = { label: string; value: string };

export type PdfReportMetadata = {
  subtitle?: string;
  gemeratedAt?: string;
  filters?: string[];
  highlights?: PdfHighlight[];
};

export type PdfRow =
  | {
      type: "section";
      label: string;
    }
  | {
      type: "row";
      cells: string[];
    };

export const createSimplePdf = (
  title: string,
  header: string[],
  rows: PdfRow[],
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

  const wrapText = (text: string, fontSize: number, maxWidth: number = contentWidth) => {
    const normalized = normalizeWhitespace(text);
    const maxChars = Math.max(8, Math.floor(maxWidth / (fontSize * approxCharWidth)));
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
      metadata.subtitle ?? "Informe consolidado",
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
  const columnWidths = columnWeights.map((weight) => (weight / totalWeight) * contentWidth);
  const columnOffsets = columnWidths.reduce<number[]>((acc, width) => {
    const last = acc[acc.length - 1] ?? 0;
    acc.push(last + width);
    return acc;
  }, []);

  const addTableRow = (cells: string[], fontSize: number, rowIndex: number, isHeader = false) => {
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
      addRoundedRect(margin, rowTopY - rowHeight, contentWidth, rowHeight, backgroundColor);
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

  const estimateTableRowSpace = (cells: string[], fontSize: number) => {
    const cellPadding = 4;
    const wrappedCells = cells.map((cell, columnIndex) =>
      wrapText(cell, fontSize, columnWidths[columnIndex] - cellPadding * 2)
    );
    const maxLines = Math.max(1, ...wrappedCells.map((cell) => cell.length));
    const rowHeight = maxLines * (fontSize + 3) + cellPadding * 2;
    return rowHeight + 12;
  };

  const addSectionRow = (label: string) => {
    ensureSpace(26);
    addRoundedRect(margin, currentY - 20, contentWidth, 20, color.primaryDark);
    addTextLine(label, 10, margin + 8, currentY - 15, "F2", "1 1 1");
    currentY -= 26;
  };

  startPage(true);

  if (metadata.filters?.length) {
    addTextLine("Filtros", 12, margin, undefined, "F2", color.primaryDark);
    metadata.filters.forEach((filter) =>
      addWrappedText(`- ${filter}`, 10, margin + 8, contentWidth, "F1", color.textMuted)
    );
    addSeparator();
  }

  if (metadata.highlights?.length) {
    addTextLine("Resumen", 12, margin, undefined, "F2", color.primaryDark);
    metadata.highlights.forEach((item) => {
      ensureSpace(28);
      addRoundedRect(margin, currentY - 22, contentWidth, 20, color.neutral);
      addTextLine(`${item.label}`, 10, margin + 8, currentY - 18, "F2", color.textMuted);
      addTextLine(`${item.value}`, 11, margin + 200, currentY - 18, "F1");
      currentY -= 26;
    });
    addSeparator();
  }

  addTextLine("Detalle de registros", 12, margin, undefined, "F2", color.primaryDark);
  addSeparator();

  addTableRow(header, 11, 0, true);
  let dataRowIndex = 0;
  rows.forEach((row, index) => {
    if (currentY < margin + 60) {
      addSeparator();
      startPage(false);
      addTableRow(header, 11, 0, true);
    }
    if (row.type === "section") {
      const nextRow = rows[index + 1];
      if (nextRow?.type === "row") {
        const sectionSpace = 26;
        const nextRowSpace = estimateTableRowSpace(nextRow.cells, 10);
        ensureSpace(sectionSpace + nextRowSpace);
      }
      addSectionRow(row.label);
      return;
    }
    addTableRow(row.cells, 10, dataRowIndex);
    dataRowIndex += 1;
  });

  if (currentLines.length) {
    pages.push(currentLines);
  }

  const pageContentStreams = pages.map((pageLines) => pageLines.join("\n"));
  const pageContentBytes = pageContentStreams.map((content) => encoder.encode(content));

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
