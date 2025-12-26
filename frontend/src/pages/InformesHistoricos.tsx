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
  buildTallerCalculoWithMeta,
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
      return `material_${slugify(selectedMaterial.codigo)}_${sedesSlug}`;
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

  const csvExcludedFields = new Set(["descripcion"]);

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
    if (!filteredCalculo.length) {
      return;
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
      return;
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

    const csvTitle =
      scope === "taller" && selectedTaller
        ? `Detalle del taller ${selectedTaller.label}`
        : "Detalle consolidado";

    csvRows.push(["Informe", csvTitle]);
    csvRows.push([
      "Generado",
      new Intl.DateTimeFormat("es-CO", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date()),
    ]);
    csvRows.push([""]);
    csvRows.push(["Filtros"]);
    filtersSummary.forEach((filter) => csvRows.push([filter]));
    csvRows.push([""]);
    const pushShiftedRow = (row: string[]) => csvRows.push(["", ...row]);

    pushShiftedRow(["Resumen"]);
    pushShiftedRow(["Talleres incluidos", resumen.talleres.toString()]);
    pushShiftedRow([
      scope === "sede" ? "Total talleres" : "Total cortes",
      scope === "sede" ? resumen.talleres.toString() : resumen.cortes.toString(),
    ]);
    pushShiftedRow(["Peso filtrado", `${pesoFormatter.format(resumen.totalPeso)} kg`]);
    pushShiftedRow(["Valor estimado", currencyFormatter.format(resumen.totalValor)]);
    csvRows.push([""]);

    const principalSummaryHeaders = [
      "Corte principal",
      ...principalSummaryFields.map((field) => field.label),
    ];

    groupedByPrincipal.forEach((rows, principalLabel) => {
      const principalSummaryValues = rows.length
        ? principalSummaryFields.map((field) => normalizeWhitespace(field.getValue(rows[0])))
        : [];

      if (principalSummaryFields.length) {
        pushShiftedRow(principalSummaryHeaders);
        pushShiftedRow([principalLabel, ...principalSummaryValues]);
      } else {
        pushShiftedRow(["Corte principal", principalLabel]);
      }
      pushShiftedRow(detailHeaders);
      rows.forEach((row) => {
        pushShiftedRow(detailFields.map((field) => normalizeWhitespace(field.getValue(row))));
      });
      csvRows.push([""]);
    });

    const csvContent = `\ufeff${csvRows
      .map((row) => row.map((value) => escapeCsvValue(value)).join(";"))
      .join("\n")}`;

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    downloadBlob(blob, `${exportFileName}.csv`);
  };

  const handleExportExcel = () => {
    if (!formattedRows.length) {
      return;
    }

    const tableHeadRows = [
      selectedSpeciesLabel
        ? `<tr><th colspan="${headers.length}">Especie: ${escapeHtmlValue(
            selectedSpeciesLabel
          )}</th></tr>`
        : null,
      `<tr>${headers.map((header) => `<th>${escapeHtmlValue(header)}</th>`).join("")}</tr>`,
    ]
      .filter(Boolean)
      .join("");
    const tableBody = formattedRows
      .map((row) => `<tr>${row.map((value) => `<td>${escapeHtmlValue(value)}</td>`).join("")}</tr>`)
      .join("");

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table border="1"><thead>${tableHeadRows}</thead><tbody>${tableBody}</tbody></table></body></html>`;
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
          label: scope === "sede" ? "Total talleres" : "Total cortes",
          value: scope === "sede" ? resumen.talleres.toString() : resumen.cortes.toString(),
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

  const isExportDisabled =
    loadingCalculo ||
    !formattedRows.length ||
    selectedFieldDefinitions.length === 0 ||
    (scope === "taller" && !selectedTaller);

  const resumen = useMemo(() => {
    return calculateResumen(filteredCalculo);
  }, [filteredCalculo]);

  const groupedCalculo = useMemo(() => {
    return groupCalculoByTaller(filteredCalculo, selectedTallerIds);
  }, [filteredCalculo, selectedTallerIds]);

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
        selectedTallerIds={selectedTallerIds}
        availableSedes={availableSedes}
        individualTallerOptions={individualTallerOptions}
        materialOptions={materialOptions}
        selectedTalleresCompletos={selectedTalleresCompletos}
        loading={loading}
        error={error}
        onScopeChange={setScope}
        onSelectedTallerChange={setSelectedTaller}
        onSelectedMaterialChange={setSelectedMaterial}
        onSelectedSedesChange={setSelectedSedes}
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
