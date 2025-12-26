import { ExportField } from "./InformeExportPanel";

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

const formatCurrencyOrNA = (value: number | null) =>
  value == null ? "N/D" : currencyFormatter.format(value);

const normalizeWhitespace = (value: string) => value.replace(/\u00a0/g, " ");

const formatCorteNombre = (value: string) => normalizeWhitespace(value).toUpperCase();

const UNKNOWN_BRANCH_LABEL = "Sin sede asignada";

interface ExportFieldDefinition<Row = ExportFieldRow> extends ExportField {
  getValue: (row: Row) => string;
}

const formatTallerId = (id: number) => id.toString().padStart(2, "0");

type ExportFieldRow = {
  displayId: number;
  tallerNombre: string;
  sede: string | null;
  materialLabel: string;
  nombre_corte: string;
  item_code: string;
  peso: number;
  peso_inicial: number;
  peso_subcortes: number;
  peso_final: number;
  porcentaje_perdida: number | null;
  porcentaje_real: number;
  precio_venta: number | null;
  valor_estimado: number | null;
};

const baseExportFieldDefinitions: ExportFieldDefinition[] = [
  {
    key: "taller_id",
    label: "ID taller",
    getValue: (row) => formatTallerId(row.displayId),
  },
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
    key: "corte_principal",
    label: "Corte principal",
    getValue: (row) => row.materialLabel,
  },
  {
    key: "nombre_corte",
    label: "Corte",
    getValue: (row) => formatCorteNombre(row.nombre_corte),
  },
  {
    key: "item_code",
    label: "Codigo de item",
    getValue: (row) => row.item_code,
  },
  {
    key: "peso",
    label: "Peso (KG)",
    getValue: (row) => pesoFormatter.format(row.peso),
  },
  {
    key: "peso_inicial",
    label: "Peso inicial (KG)",
    getValue: (row) => pesoFormatter.format(row.peso_inicial),
  },
  {
    key: "peso_subcortes",
    label: "Peso subcortes (KG)",
    getValue: (row) => pesoFormatter.format(row.peso_subcortes),
  },
  {
    key: "peso_final",
    label: "Peso final (KG)",
    getValue: (row) => pesoFormatter.format(row.peso_final),
  },
  {
    key: "porcentaje_perdida",
    label: "% pérdida",
    getValue: (row) =>
      row.porcentaje_perdida === null || Number.isNaN(row.porcentaje_perdida)
        ? "N/D"
        : `${porcentajeFormatter.format(row.porcentaje_perdida)}%`,
  },
  {
    key: "porcentaje_real",
    label: "% real",
    getValue: (row) => `${porcentajeFormatter.format(row.porcentaje_real)}%`,
  },
  {
    key: "precio_venta",
    label: "Precio de venta",
    getValue: (row) => formatCurrencyOrNA(row.precio_venta),
  },
  {
    key: "valor_estimado",
    label: "Valor estimado",
    getValue: (row) => formatCurrencyOrNA(row.valor_estimado),
  },
];

const exportFieldDefinitions = baseExportFieldDefinitions;
const pdfFieldDefinitions: ExportFieldDefinition[] = exportFieldDefinitions;

export {
  ExportFieldDefinition,
  UNKNOWN_BRANCH_LABEL,
  baseExportFieldDefinitions,
  currencyFormatter,
  exportFieldDefinitions,
  formatCorteNombre,
  formatCurrencyOrNA,
  formatTallerId,
  normalizeWhitespace,
  pdfFieldDefinitions,
  porcentajeFormatter,
  pesoFormatter,
};
