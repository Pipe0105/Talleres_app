import { useEffect, useMemo, useState } from "react";
import { Stack, Typography } from "@mui/material";
import { useInformesHistoricos, UNKNOWN_BRANCH_LABEL } from "../hooks/useInformesHistoricos";
import { TallerListItem } from "../types";
import PageSection from "../components/PageSection";
import PageHeader from "../components/PageHeader";
import InformesDateFilterSection from "../components/informes/InformesDateFilterSection";
import InformesScopeSection from "../components/informes/InformesScopeSection";
import InformesDetalleSection from "../components/informes/InformesDetalleSection";
import InformeFilters from "../components/informes/InformeFilters";
import InformeExportPanel from "../components/informes/InformeExportPanel";
import { exportFieldDefinitions, pdfFieldDefinitions } from "../components/informes/exportFields";
import {
  groupCalculoByItem,
  calculateResumen,
  formatTallerId,
  groupCalculoByTaller,
  TallerCalculoWithMeta,
} from "../utils/informes/transformers";
import {
  SPECIES_LABELS,
  currencyFormatter,
  dateFormatter,
  escapeCsvValue,
  escapeHtmlValue,
  escapePdfText,
  formatCorteNombre,
  formatCurrencyOrNA,
  formatSpeciesLabel,
  normalizeWhitespace,
  porcentajeFormatter,
  pesoFormatter,
  slugify,
  stripPdfAccents,
} from "../utils/informes/formatters";
import {
  createSimplePdf,
  type PdfHighlight,
  type PdfReportMetadata,
  type PdfRow,
} from "../utils/informes/pdf";
import { parseWeightInput } from "../utils/weights";

type MaterialOption = {
  codigo: string;
  nombre: string | null;
  label: string;
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
  const {
    scope,
    setScope,
    loading,
    error,
    selectedTaller,
    setSelectedTaller,
    selectedSedes,
    setSelectedSedes,
    selectedMaterial,
    setSelectedMaterial,
    selectedCompareTalleres,
    setSelectedCompareTalleres,
    calculo,
    loadingCalculo,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    individualTallerOptions,
    availableSedes,
    materialOptions,
    selectedTallerIds,
    selectedSpeciesLabel,
    selectedTalleresCompletos,
    compareSelectionDetails,
    compareSelectionError,
    compareTallerSedesById,
  } = useInformesHistoricos();
  const [selectedFields, setSelectedFields] = useState<string[]>(
    exportFieldDefinitions.map((field) => field.key)
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minPeso, setMinPeso] = useState("");
  const [maxPeso, setMaxPeso] = useState("");

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
    const minPesoValue = minPeso.trim() ? parseWeightInput(minPeso) : Number.NaN;
    const maxPesoValue = maxPeso.trim() ? parseWeightInput(maxPeso) : Number.NaN;

    return calculo.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [row.nombre_corte, row.descripcion, row.item_code]
          .map((value) => normalizeWhitespace(value).toLowerCase())
          .some((value) => value.includes(normalizedQuery));

      const matchesMinPeso = Number.isNaN(minPesoValue) || row.peso >= minPesoValue;
      const matchesMaxPeso = Number.isNaN(maxPesoValue) || row.peso <= maxPesoValue;

      return matchesQuery && matchesMinPeso && matchesMaxPeso;
    });
  }, [calculo, maxPeso, minPeso, searchQuery]);

  const selectedFieldDefinitions = useMemo(
    () => exportFieldDefinitions.filter((field) => selectedFields.includes(field.key)),
    [selectedFields]
  );

  const formattedRows = useMemo(() => {
    if (!filteredCalculo.length) {
      return [];
    }

    return filteredCalculo.map((row) =>
      selectedFieldDefinitions.map((field) => normalizeWhitespace(field.getValue(row)))
    );
  }, [filteredCalculo, selectedFieldDefinitions]);

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
      return `material_${slugify(selectedMaterial.codigo)}_${sedesSlug}`;
    }

    if (scope === "comparar" && selectedCompareTalleres.length) {
      const compareSlug = selectedCompareTalleres.map((taller) => slugify(taller.id)).join("-");
      return `comparacion_talleres_${compareSlug}`;
    }

    return "detalle_taller";
  }, [
    availableSedes,
    scope,
    selectedCompareTalleres,
    selectedMaterial,
    selectedSedes,
    selectedTaller,
    selectedTallerIds.length,
  ]);

  const csvExcludedFields = new Set(["descripcion"]);

  type ExportRowType =
    | "title"
    | "meta"
    | "spacer"
    | "section"
    | "filter"
    | "summary-header"
    | "summary-row"
    | "group-summary-header"
    | "group-summary-row"
    | "detail-header"
    | "detail-row";

  const buildExportRows = () => {
    if (!filteredCalculo.length) {
      return null;
    }
    const principalSummaryKeys = new Set(["peso_inicial", "peso_final", "porcentaje_perdida"]);
    const principalSummaryFields = exportFieldDefinitions.filter((field) =>
      principalSummaryKeys.has(field.key)
    );

    const detailFields = selectedFieldDefinitions.filter(
      (field) =>
        field.key !== "corte_principal" &&
        !principalSummaryKeys.has(field.key) &&
        !csvExcludedFields.has(field.key)
    );

    if (!detailFields.length) {
      return null;
    }

    const detailHeaders = detailFields.map((field) => field.label);
    const groupedByPrincipal = new Map<string, TallerCalculoWithMeta[]>();
    filteredCalculo.forEach((row) => {
      const principalLabel = row.materialLabel?.trim() || "Sin corte principal";
      const group = groupedByPrincipal.get(principalLabel);
      if (group) {
        group.push(row);
      } else {
        groupedByPrincipal.set(principalLabel, [row]);
      }
    });

    const sedesSeleccionadas =
      scope === "sede" ? (selectedSedes.length ? selectedSedes : availableSedes) : selectedSedes;

    const scopeDescription =
      scope === "taller" && selectedTaller
        ? `Alcance: Taller ${selectedTaller.label}`
        : scope === "sede"
          ? `Alcance: ${sedesSeleccionadas.length} sede(s)`
          : scope === "material" && selectedMaterial
            ? `Alcance: Material ${selectedMaterial.label}`
            : scope === "comparar" && selectedCompareTalleres.length
              ? `Alcance: Comparación de ${selectedCompareTalleres
                  .map((taller) => taller.label)
                  .join(" vs ")}`
              : "Alcance: selección personalizada";
    const dateFromLabel = dateFrom ? dateFormatter.format(new Date(`${dateFrom}T00:00:00`)) : "";
    const dateToLabel = dateTo ? dateFormatter.format(new Date(`${dateTo}T00:00:00`)) : "";
    const dateRangeLabel =
      dateFromLabel && dateToLabel
        ? `Fecha: ${dateFromLabel} - ${dateToLabel}`
        : dateFromLabel
          ? `Fecha desde: ${dateFromLabel}`
          : dateToLabel
            ? `Fecha hasta: ${dateToLabel}`
            : null;

    const filtersSummary = [
      scopeDescription,
      selectedSpeciesLabel ? `Especie: ${selectedSpeciesLabel}` : null,
      sedesSeleccionadas.length ? `Sedes: ${sedesSeleccionadas.join(", ")}` : null,
      scope === "material" && selectedMaterial ? `Material: ${selectedMaterial.label}` : null,
      dateRangeLabel,
      `Columnas incluidas: ${detailHeaders.join(", ")}`,
      `Registros filtrados: ${filteredCalculo.length}`,
    ].filter(Boolean) as string[];

    const csvRows: string[][] = [];
    const rowTypes: ExportRowType[] = [];

    const pushRow = (row: string[], type: ExportRowType) => {
      csvRows.push(row);
      rowTypes.push(type);
    };

    const csvTitle =
      scope === "taller" && selectedTaller
        ? `Detalle del taller ${selectedTaller.label}`
        : scope === "comparar"
          ? "Comparación de talleres"
          : "Detalle consolidado";

    pushRow(["Informe", csvTitle], "title");
    pushRow(
      [
        "Generado",
        new Intl.DateTimeFormat("es-CO", {
          dateStyle: "full",
          timeStyle: "short",
        }).format(new Date()),
      ],
      "meta"
    );
    pushRow([""], "spacer");
    pushRow(["Filtros"], "section");
    filtersSummary.forEach((filter) => pushRow([filter], "filter"));
    pushRow([""], "spacer");
    const pushShiftedRow = (row: string[], type: ExportRowType) => pushRow(["", ...row], type);

    pushShiftedRow(["Resumen"], "section");
    pushShiftedRow(["Talleres incluidos", resumen.talleres.toString()], "summary-row");
    pushShiftedRow(
      [
        scope === "sede" || scope === "comparar" ? "Total talleres" : "Total cortes",
        scope === "sede" || scope === "comparar"
          ? resumen.talleres.toString()
          : resumen.cortes.toString(),
      ],
      "summary-row"
    );
    pushShiftedRow(
      ["Peso filtrado", `${pesoFormatter.format(resumen.totalPeso)} kg`],
      "summary-row"
    );
    pushShiftedRow(["Valor estimado", currencyFormatter.format(resumen.totalValor)], "summary-row");
    pushRow([""], "spacer");

    const principalSummaryHeaders = [
      "Corte principal",
      ...principalSummaryFields.map((field) => field.label),
    ];

    groupedByPrincipal.forEach((rows, principalLabel) => {
      const principalSummaryValues = rows.length
        ? principalSummaryFields.map((field) => normalizeWhitespace(field.getValue(rows[0])))
        : [];

      if (principalSummaryFields.length) {
        pushShiftedRow(principalSummaryHeaders, "group-summary-header");
        pushShiftedRow([principalLabel, ...principalSummaryValues], "group-summary-row");
      } else {
        pushShiftedRow(["Corte principal", principalLabel], "group-summary-row");
      }
      pushShiftedRow(detailHeaders, "detail-header");
      rows.forEach((row) => {
        pushShiftedRow(
          detailFields.map((field) => normalizeWhitespace(field.getValue(row))),
          "detail-row"
        );
      });
      pushRow([""], "spacer");
    });

    return { rows: csvRows, detailHeaders, rowTypes };
  };

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
    const exportRows = buildExportRows();

    if (!exportRows) {
      return;
    }

    const csvContent = `\ufeff${exportRows.rows
      .map((row) => row.map((value) => escapeCsvValue(value)).join(";"))
      .join("\n")}`;

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    downloadBlob(blob, `${exportFileName}.csv`);
  };

  const handleExportExcel = () => {
    const exportRows = buildExportRows();

    if (!exportRows) {
      return;
    }

    const maxColumns = exportRows.rows.reduce((max, row) => Math.max(max, row.length), 0);

    const baseCellStyle =
      "border:1px solid #e1e7ef;padding:6px 8px;font-family:Calibri, Arial, sans-serif;font-size:12px;";
    const baseCellStyleNoBorder =
      "border:none;padding:6px 8px;font-family:Calibri, Arial, sans-serif;font-size:12px;";
    const rowStyleMap: Record<Exclude<ExportRowType, "detail-row">, string> = {
      title: "background-color:#eef3f8;font-weight:bold;font-size:14px;",
      meta: "background-color:#f6f8fb;",
      spacer: "border:none;background-color:#ffffff;",
      section: "background-color:#e9f0f7;font-weight:bold;",
      filter: "background-color:#fbfcfe;",
      "summary-header": "background-color:#edf2f7;font-weight:bold;",
      "summary-row": "background-color:#f8fbff;",
      "group-summary-header": "background-color:#eef2f8;font-weight:bold;",
      "group-summary-row": "background-color:#f7f9fc;",
      "detail-header": "background-color:#e6eef7;font-weight:bold;",
    };
    let detailRowIndex = 0;
    const tableBody = exportRows.rows
      .map((row, rowIndex) => {
        const rowType = exportRows.rowTypes[rowIndex];
        const paddedRow = [...row, ...Array(Math.max(maxColumns - row.length, 0)).fill("")];
        const rowStyle =
          rowType === "detail-row"
            ? detailRowIndex++ % 2 === 0
              ? "background-color:#ffffff;"
              : "background-color:#f8f9fb;"
            : rowStyleMap[rowType];
        return `<tr>${paddedRow
          .map((value, cellIndex) => {
            const trimmedValue = value.trim();
            const isSpacerRow = rowType === "spacer";
            const emphasizedFirstCell =
              ["meta", "summary-row", "group-summary-row"].includes(rowType) &&
              cellIndex === 0 &&
              trimmedValue;
            const isEmptyCell = trimmedValue.length === 0;
            const cellStyle = [
              isSpacerRow
                ? "border:none;padding:4px;"
                : isEmptyCell
                  ? baseCellStyleNoBorder
                  : baseCellStyle,
              isEmptyCell ? "background-color:#ffffff;" : rowStyle,
              emphasizedFirstCell ? "font-weight:bold;" : "",
            ]
              .filter(Boolean)
              .join("");
            return `<td style="${cellStyle}">${escapeHtmlValue(value)}</td>`;
          })
          .join("")}</tr>`;
      })
      .join("");

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table style="border-collapse:collapse;"><tbody>${tableBody}</tbody></table></body></html>`;
    const blob = new Blob([htmlContent], {
      type: "application/vnd.ms-excel",
    });

    downloadBlob(blob, `${exportFileName}.xls`);
  };

  const handleExportPdf = () => {
    if (!formattedRows.length) {
      return;
    }

    const principalSummaryKeys = new Set(["peso_inicial", "peso_final", "porcentaje_perdida"]);
    const principalSummaryFields = pdfFieldDefinitions.filter((field) =>
      principalSummaryKeys.has(field.key)
    );
    const pdfDetailFields = pdfFieldDefinitions.filter(
      (field) =>
        field.key !== "corte_principal" &&
        !principalSummaryKeys.has(field.key) &&
        !csvExcludedFields.has(field.key)
    );
    if (!pdfDetailFields.length) {
      return;
    }

    const pdfHeaders = pdfDetailFields.map((field) => field.label);
    const groupedByPrincipal = new Map<string, TallerCalculoWithMeta[]>();
    filteredCalculo.forEach((row) => {
      const principalLabel = row.materialLabel?.trim() || "Sin corte principal";
      const group = groupedByPrincipal.get(principalLabel);
      if (group) {
        group.push(row);
      } else {
        groupedByPrincipal.set(principalLabel, [row]);
      }
    });

    const pdfRows: PdfRow[] = [];
    groupedByPrincipal.forEach((rows, principalLabel) => {
      const principalSummary = rows.length
        ? principalSummaryFields.map(
            (field) => `${field.label}: ${normalizeWhitespace(field.getValue(rows[0]))}`
          )
        : [];
      const sectionLabel = principalSummary.length
        ? `Corte principal: ${principalLabel} · ${principalSummary.join(" · ")}`
        : `Corte principal: ${principalLabel}`;
      pdfRows.push({ type: "section", label: sectionLabel });
      rows.forEach((row) => {
        pdfRows.push({
          type: "row",
          cells: pdfDetailFields.map((field) => normalizeWhitespace(field.getValue(row))),
        });
      });
    });

    const sedesSeleccionadas =
      scope === "sede" ? (selectedSedes.length ? selectedSedes : availableSedes) : selectedSedes;

    const scopeDescription =
      scope === "taller" && selectedTaller
        ? `Alcance: Taller ${selectedTaller.label}`
        : scope === "sede"
          ? `Alcance: ${sedesSeleccionadas.length} sede(s)`
          : scope === "material" && selectedMaterial
            ? `Alcance: Material ${selectedMaterial.label}`
            : scope === "comparar" && selectedCompareTalleres.length
              ? `Alcance: Comparación de ${selectedCompareTalleres
                  .map((taller) => taller.label)
                  .join(" vs ")}`
              : "Alcance: selección personalizada";
    const dateFromLabel = dateFrom ? dateFormatter.format(new Date(`${dateFrom}T00:00:00`)) : "";
    const dateToLabel = dateTo ? dateFormatter.format(new Date(`${dateTo}T00:00:00`)) : "";
    const dateRangeLabel =
      dateFromLabel && dateToLabel
        ? `Fecha: ${dateFromLabel} - ${dateToLabel}`
        : dateFromLabel
          ? `Fecha desde: ${dateFromLabel}`
          : dateToLabel
            ? `Fecha hasta: ${dateToLabel}`
            : null;

    const filtersSummary = [
      scopeDescription,
      selectedSpeciesLabel ? `Especie: ${selectedSpeciesLabel}` : null,
      sedesSeleccionadas.length ? `Sedes: ${sedesSeleccionadas.join(", ")}` : null,
      scope === "material" && selectedMaterial ? `Material: ${selectedMaterial.label}` : null,
      dateRangeLabel,
      `Columnas incluidas: ${pdfHeaders.join(", ")}`,
      `Registros filtrados: ${pdfRows.length}`,
    ].filter(Boolean) as string[];

    const pdfTitle =
      scope === "taller" && selectedTaller
        ? `Detalle del taller ${selectedTaller.label}`
        : scope === "comparar"
          ? "Comparación de talleres"
          : "Detalle consolidado";

    const pdfBlob = createSimplePdf(pdfTitle, pdfHeaders, pdfRows, {
      subtitle: "Informe consolidado",
      gemeratedAt: new Intl.DateTimeFormat("es-CO", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date()),
      filters: filtersSummary,
      highlights: [
        { label: "Talleres incluidos", value: resumen.talleres.toString() },
        {
          label: scope === "sede" || scope === "comparar" ? "Total talleres" : "Total cortes",
          value:
            scope === "sede" || scope === "comparar"
              ? resumen.talleres.toString()
              : resumen.cortes.toString(),
        },
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

  const isCompareInvalid = scope === "comparar" && Boolean(compareSelectionError);

  const isExportDisabled =
    loadingCalculo ||
    !formattedRows.length ||
    selectedFieldDefinitions.length === 0 ||
    (scope === "taller" && !selectedTaller) ||
    isCompareInvalid;

  const resumen = useMemo(() => {
    return calculateResumen(filteredCalculo);
  }, [filteredCalculo]);

  const groupedCalculo = useMemo(() => {
    if (scope === "comparar") {
      return groupCalculoByItem(filteredCalculo);
    }

    return groupCalculoByTaller(filteredCalculo, selectedTallerIds);
  }, [filteredCalculo, scope, selectedTallerIds]);

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
          Usa las tarjetas de filtros y exportacion para trabajar con los datos que más importan a
          tu equipo.
        </Typography>
      </PageSection>

      <InformesDateFilterSection
        dateFrom={dateFrom}
        dateTo={dateTo}
        loading={loading}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <InformesScopeSection
        scope={scope}
        selectedTaller={selectedTaller}
        selectedMaterial={selectedMaterial}
        selectedSedes={selectedSedes}
        selectedCompareTalleres={selectedCompareTalleres}
        selectedTallerIds={selectedTallerIds}
        availableSedes={availableSedes}
        individualTallerOptions={individualTallerOptions}
        materialOptions={materialOptions}
        selectedTalleresCompletos={selectedTalleresCompletos}
        compareSelectionDetails={compareSelectionDetails}
        compareSelectionError={compareSelectionError}
        compareTallerSedesById={compareTallerSedesById}
        loading={loading}
        error={error}
        onScopeChange={setScope}
        onSelectedTallerChange={setSelectedTaller}
        onSelectedMaterialChange={setSelectedMaterial}
        onSelectedSedesChange={setSelectedSedes}
        onSelectedCompareTalleresChange={setSelectedCompareTalleres}
        formatTallerId={formatTallerId}
      />

      <InformeFilters
        searchQuery={searchQuery}
        minPeso={minPeso}
        maxPeso={maxPeso}
        disabled={!selectedTallerIds.length || loadingCalculo || loading}
        onSearchChange={setSearchQuery}
        onMinPesoChange={setMinPeso}
        onMaxPesoChange={setMaxPeso}
      />

      <InformesDetalleSection
        scope={scope}
        selectedTallerIdsLength={selectedTallerIds.length}
        filteredCalculoLength={filteredCalculo.length}
        loadingCalculo={loadingCalculo}
        resumen={resumen}
        groupedCalculo={groupedCalculo}
        formatTallerId={formatTallerId}
        formatCorteNombre={formatCorteNombre}
        formatCurrencyOrNA={formatCurrencyOrNA}
        pesoFormatter={pesoFormatter}
        porcentajeFormatter={porcentajeFormatter}
        totalPesoLabel={pesoFormatter.format(resumen.totalPeso)}
        totalValorLabel={currencyFormatter.format(resumen.totalValor)}
      />

      <InformeExportPanel
        fields={exportFieldDefinitions}
        selectedFields={selectedFields}
        disabled={isExportDisabled}
        onToggleField={handleFieldToggle}
        onExportCsv={handleExportCsv}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
      />
    </Stack>
  );
};

export default InformesHistoricos;
