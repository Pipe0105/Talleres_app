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

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
});

const formatCurrencyOrNA = (value: number | null) =>
  value == null ? "N/D" : currencyFormatter.format(value);

const SPECIES_LABELS: Record<string, string> = {
  res: "Res",
  cerdo: "Cerdo",
};

const formatSpeciesLabel = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }
  const normalized = value.toLowerCase();
  return SPECIES_LABELS[normalized] ?? value;
};

const normalizeWhitespace = (value: string) => value.replace(/\u00a0/g, " ");

const formatCorteNombre = (value: string) => normalizeWhitespace(value).toUpperCase();

const escapeCsvValue = (value: string) => {
  const normalized = normalizeWhitespace(value).replace(/\r?\n/g, " ");
  const needsQuotes = /[";\n]/.test(normalized);
  const escaped = normalized.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const escapeHtmlValue = (value: string) =>
  normalizeWhitespace(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

const slugify = (value: string) =>
  normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export {
  pesoFormatter,
  porcentajeFormatter,
  currencyFormatter,
  dateFormatter,
  formatCurrencyOrNA,
  normalizeWhitespace,
  formatCorteNombre,
  escapeCsvValue,
  escapeHtmlValue,
  stripPdfAccents,
  escapePdfText,
  slugify,
  formatSpeciesLabel,
  SPECIES_LABELS,
};
