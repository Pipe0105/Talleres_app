import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getItems, getTallerCalculo, getTalleres } from "../api/talleresApi";
import { TallerListItem } from "../types";
import PageSection from "../components/PageSection";
import PageHeader from "../components/PageHeader";
import type { TallerOption } from "../components/informes/TallerSelectionCard";
import InformeFilters from "../components/informes/InformeFilters";
import InformeExportPanel from "../components/informes/InformeExportPanel";
import {
  UNKNOWN_BRANCH_LABEL,
  exportFieldDefinitions,
  pdfFieldDefinitions,
} from "../components/informes/exportFields";
import { TALLER_MATERIALES } from "../data/talleres";
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
const LOCAL_MATERIAL_NAMES = TALLER_MATERIALES.reduce<Record<string, string>>((acc, material) => {
  acc[material.codigo] = material.nombre;
  return acc;
}, {});

type InformeScope = "taller" | "sede" | "material";

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
  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [scope, setScope] = useState<InformeScope>("taller");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaller, setSelectedTaller] = useState<TallerOption | null>(null);
  const [selectedSedes, setSelectedSedes] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption | null>(null);
  const [calculo, setCalculo] = useState<TallerCalculoWithMeta[] | null>(null);
  const [loadingCalculo, setLoadingCalculo] = useState(false);
  const [materialNames, setMaterialNames] = useState<Record<string, string>>({});
  const [selectedFields, setSelectedFields] = useState<string[]>(
    exportFieldDefinitions.map((field) => field.key)
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minPeso, setMinPeso] = useState("");
  const [maxPeso, setMaxPeso] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const talleresFiltrados = useMemo(() => {
    if (!dateFrom && !dateTo) {
      return talleres;
    }

    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return talleres.filter((taller) => {
      const createdAt = new Date(taller.creado_en);
      if (Number.isNaN(createdAt.getTime())) {
        return true;
      }

      if (fromDate && createdAt < fromDate) {
        return false;
      }

      if (toDate && createdAt > toDate) {
        return false;
      }

      return true;
    });
  }, [dateFrom, dateTo, talleres]);

  const filteredTallerIds = useMemo(
    () => new Set(talleresFiltrados.map((taller) => String(taller.id))),
    [talleresFiltrados]
  );
  const individualTallerOptions = useMemo<TallerOption[]>(() => {
    const grouped = new Map<
      string,
      {
        id: string;
        label: string;
        tallerIds: string[];
        totalPeso: number;
        createdAt: Date | null;
      }
    >();

    talleresFiltrados.forEach((taller) => {
      const groupKey = taller.taller_grupo_id
        ? `grupo-${taller.taller_grupo_id}`
        : `taller-${taller.id}`;
      const existing = grouped.get(groupKey);
      const createdAt = new Date(taller.creado_en);
      const validCreatedAt = Number.isNaN(createdAt.getTime()) ? null : createdAt;

      if (existing) {
        existing.tallerIds.push(String(taller.id));
        existing.totalPeso += taller.total_peso;
        if (validCreatedAt && (!existing.createdAt || validCreatedAt < existing.createdAt)) {
          existing.createdAt = validCreatedAt;
        }
        return;
      }

      grouped.set(groupKey, {
        id: groupKey,
        label: taller.nombre_taller,
        tallerIds: [String(taller.id)],
        totalPeso: taller.total_peso,
        createdAt: validCreatedAt,
      });
    });

    return Array.from(grouped.values()).map((option) => ({
      id: option.id,
      label: [
        option.label,
        option.createdAt ? dateFormatter.format(option.createdAt) : null,
        `${pesoFormatter.format(option.totalPeso)} kg`,
      ]
        .filter(Boolean)
        .join(" · "),
      tallerIds: option.tallerIds,
    }));
  }, [talleresFiltrados]);

  const availableSedes = useMemo(() => {
    const sedeSet = new Set<string>();
    talleresFiltrados.forEach((taller) => {
      const sedeLabel = taller.sede ?? UNKNOWN_BRANCH_LABEL;
      sedeSet.add(sedeLabel);
    });
    return Array.from(sedeSet).sort();
  }, [talleresFiltrados]);

  const materialOptions = useMemo(() => {
    const materials = new Set<string>();
    talleresFiltrados.forEach((taller) => {
      const material = taller.codigo_principal?.trim();
      if (material) {
        materials.add(material);
      }
    });
    return Array.from(materials)
      .map((codigo) => {
        const nombre = materialNames[codigo] ?? null;
        return {
          codigo,
          nombre,
          label: nombre ? `${codigo} · ${nombre}` : codigo,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [materialNames, talleresFiltrados]);

  const selectedTallerIds = useMemo(() => {
    if (scope === "taller") {
      return selectedTaller
        ? selectedTaller.tallerIds.filter((id) => filteredTallerIds.has(id))
        : [];
    }

    let filtered = talleresFiltrados;
    const normalizedSedes =
      scope === "sede" ? (selectedSedes.length ? selectedSedes : availableSedes) : selectedSedes;

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
      filtered = filtered.filter((taller) => taller.codigo_principal === selectedMaterial.codigo);
    }

    return filtered.map((taller) => String(taller.id));
  }, [
    availableSedes,
    filteredTallerIds,
    scope,
    selectedMaterial,
    selectedSedes,
    selectedTaller,
    talleresFiltrados,
  ]);

  const selectedTalleres = useMemo(
    () => talleresFiltrados.filter((taller) => selectedTallerIds.includes(String(taller.id))),
    [selectedTallerIds, talleresFiltrados]
  );

  const selectedSpeciesLabel = useMemo(() => {
    const especies = selectedTalleres
      .map((taller) => formatSpeciesLabel(taller.especie))
      .filter(Boolean) as string[];
    const uniqueSpecies = new Set(especies);

    if (!uniqueSpecies.size) {
      return null;
    }

    if (uniqueSpecies.size === 1) {
      return uniqueSpecies.values().next().value ?? null;
    }

    return "Varias especies";
  }, [selectedTalleres]);

  const selectedTalleresCompletos = useMemo(() => {
    const grupos = new Map<number, TallerListItem>();
    selectedTalleres.forEach((taller) => {
      if (taller.taller_grupo_id) {
        grupos.set(taller.taller_grupo_id, taller);
      }
    });
    return Array.from(grupos.entries())
      .map(([grupoId, taller]) => ({
        id: grupoId,
        nombre: taller.nombre_taller,
        sede: taller.sede ?? null,
      }))
      .sort((a, b) => a.id - b.id);
  }, [selectedTalleres]);

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
    const materiales = Array.from(
      new Set(talleres.map((taller) => taller.codigo_principal?.trim()).filter(Boolean))
    ) as string[];

    if (!materiales.length) {
      setMaterialNames({});
      return;
    }

    let isMounted = true;

    const fetchMaterialNames = async () => {
      try {
        const entries = await Promise.all(
          materiales.map(async (codigo) => {
            try {
              const response = await getItems({ q: codigo, page_size: 5 });
              const match = response.items.find(
                (item) => item.codigo_producto?.toUpperCase() === codigo.toUpperCase()
              );
              const nombre =
                match?.nombre ?? response.items[0]?.nombre ?? LOCAL_MATERIAL_NAMES[codigo] ?? "";
              return [codigo, nombre] as const;
            } catch (error) {
              return [codigo, LOCAL_MATERIAL_NAMES[codigo] ?? ""] as const;
            }
          })
        );

        if (!isMounted) {
          return;
        }

        const resolved: Record<string, string> = {};
        entries.forEach(([codigo, nombre]) => {
          if (nombre) {
            resolved[codigo] = nombre;
          }
        });
        setMaterialNames(resolved);
      } catch (error) {
        if (isMounted) {
          setMaterialNames({});
        }
      }
    };

    void fetchMaterialNames();

    return () => {
      isMounted = false;
    };
  }, [talleres]);

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
            const meta = talleres.find((taller) => String(taller.id) === tallerId);
            return buildTallerCalculoWithMeta({
              rows: data,
              meta,
              tallerId,
              materialNames,
            });
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

        const hasFailures = responses.some((result) => result.status === "rejected");

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
          setError("No fue posible obtener el cálculo de los talleres seleccionados.");
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
  }, [materialNames, selectedTallerIds, talleres]);

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

      <PageSection
        title="Filtrar talleres por fecha"
        description="Acota la lista de talleres antes de seleccionar el informe."
        padding="compact"
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Fecha desde"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            helperText="Filtra por fecha"
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Fecha hasta"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            helperText="Filtra por fecha"
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
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
              isOptionEqualToValue={(option, optionValue) => option.id === optionValue.id}
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
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Material principal"
                      placeholder="Ej: codigo o nombre del ítem"
                      helperText="Elige el material que deseas comparar entre sedes."
                    />
                  )}
                />
              ) : null}

              <Autocomplete
                multiple
                disableCloseOnSelect
                value={
                  scope === "sede" && selectedSedes.length === 0 ? availableSedes : selectedSedes
                }
                options={availableSedes}
                onChange={(_, values) => setSelectedSedes(values)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key ?? option} label={option} size="small" {...tagProps} />;
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
              {selectedTalleresCompletos.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {selectedTalleresCompletos.map((taller) => (
                    <Chip
                      key={taller.id}
                      label={`Taller completo ${formatTallerId(taller.id)} · ${taller.nombre}${
                        taller.sede ? ` · ${taller.sede}` : ""
                      }`}
                      size="small"
                    />
                  ))}
                </Stack>
              ) : selectedTallerIds.length ? (
                <Typography variant="body2" color="text.secondary">
                  No hay talleres completos disponibles en el alcance seleccionado.
                </Typography>
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

          {selectedTallerIds.length && !loadingCalculo && filteredCalculo.length === 0 ? (
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
                    {scope === "sede" ? "Total talleres" : "Total cortes"}
                  </Typography>
                  <Typography variant="h6">
                    {scope === "sede" ? resumen.talleres : resumen.cortes}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="overline" color="text.secondary">
                    Peso filtrado
                  </Typography>
                  <Typography variant="h6">{pesoFormatter.format(resumen.totalPeso)} kg</Typography>
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

              <Stack spacing={2}>
                {groupedCalculo.map((group) => {
                  const singleMaterial = group.materiales.length === 1 ? group.materiales[0] : null;

                  return (
                    <Accordion key={`taller-${group.groupKey}`} variant="outlined" disableGutters>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                          "& .MuiAccordionSummary-content": { my: 1 },
                        }}
                      >
                        <Stack spacing={0.2}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {group.groupLabel}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Typography variant="caption" color="text.secondary">
                              ID: {formatTallerId(group.displayId)}
                            </Typography>
                            {singleMaterial?.material ? (
                              <Typography variant="caption" color="text.secondary">
                                Código: {singleMaterial.material}
                              </Typography>
                            ) : null}
                            {group.materiales.length > 1 ? (
                              <Typography variant="caption" color="text.secondary">
                                Cortes principales: {group.materiales.length}
                              </Typography>
                            ) : null}
                            {group.sede ? (
                              <Typography variant="caption" color="text.secondary">
                                Sede: {group.sede}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack
                          spacing={2.5}
                          divider={
                            <Divider
                              flexItem
                              sx={{
                                border: "none",
                                height: 1.5,
                                backgroundImage:
                                  "repeating-linear-gradient(to right, #C7C7C7 0 8px, transparent 8px 18px)",
                              }}
                            />
                          }
                        >
                          {group.materiales.map((material) => (
                            <Stack key={material.tallerId} spacing={1.5}>
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                                divider={<Divider flexItem orientation="vertical" />}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                                }}
                              >
                                <Stack spacing={0.25}>
                                  <Typography variant="overline" color="text.secondary">
                                    Corte principal
                                  </Typography>
                                  <Typography variant="subtitle2">{material.label}</Typography>
                                  {material.material ? (
                                    <Typography variant="caption" color="text.secondary">
                                      Código: {material.material}
                                    </Typography>
                                  ) : null}
                                </Stack>
                                <Stack spacing={0.25}>
                                  <Typography variant="overline" color="text.secondary">
                                    Peso inicial
                                  </Typography>
                                  <Typography variant="body1" fontWeight={600}>
                                    {pesoFormatter.format(material.pesoInicial)} kg
                                  </Typography>
                                </Stack>
                                <Stack spacing={0.25}>
                                  <Typography variant="overline" color="text.secondary">
                                    Subcortes
                                  </Typography>
                                  <Typography variant="body1" fontWeight={600}>
                                    {pesoFormatter.format(
                                      material.rows.reduce((acc, row) => acc + row.peso, 0)
                                    )}{" "}
                                    kg
                                  </Typography>
                                </Stack>
                                <Stack spacing={0.25}>
                                  <Typography variant="overline" color="text.secondary">
                                    Peso final
                                  </Typography>
                                  <Typography variant="body1" fontWeight={600}>
                                    {pesoFormatter.format(material.pesoFinal)} kg
                                  </Typography>
                                </Stack>
                                <Stack spacing={0.25}>
                                  <Typography variant="overline" color="text.secondary">
                                    % pérdida
                                  </Typography>
                                  <Typography variant="body1" fontWeight={600}>
                                    {material.porcentajePerdida === null
                                      ? "N/D"
                                      : `${porcentajeFormatter.format(
                                          material.porcentajePerdida
                                        )}%`}
                                  </Typography>
                                </Stack>
                              </Stack>
                              <Typography variant="overline" color="text.secondary">
                                Subcortes de {material.label}
                              </Typography>

                              <Stack spacing={1}>
                                {material.rows.map((row, index) => (
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
                                      backgroundColor:
                                        index % 2 === 0
                                          ? "rgba(76, 175, 80, 0.06)"
                                          : "rgba(255, 152, 0, 0.06)",
                                    }}
                                  >
                                    <Stack spacing={0.25}>
                                      <Typography variant="subtitle2">
                                        {formatCorteNombre(row.nombre_corte)}
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
                                          {formatCurrencyOrNA(row.valor_estimado)}
                                        </Typography>
                                      </Stack>
                                    </Stack>
                                  </Stack>
                                ))}
                              </Stack>
                            </Stack>
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      </PageSection>

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
