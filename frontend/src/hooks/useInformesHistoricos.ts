import { useEffect, useMemo, useState } from "react";
import { getItems, getTallerCalculo, getTalleres } from "../api/talleresApi";
import type { TallerOption } from "../components/informes/TallerSelectionCard";
import { TALLER_MATERIALES } from "../data/talleres";
import type { TallerCalculoRow, TallerListItem } from "../types";

const pesoFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
});

const LOCAL_MATERIAL_NAMES = TALLER_MATERIALES.reduce<Record<string, string>>((acc, material) => {
  acc[material.codigo] = material.nombre;
  return acc;
}, {});

export const UNKNOWN_BRANCH_LABEL = "Sin sede asignada";

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

export type InformeScope = "taller" | "sede" | "material" | "comparar";

export type TallerCalculoWithMeta = TallerCalculoRow & {
  tallerId: number;
  tallerNombre: string;
  sede: string | null;
  material: string | null;
  materialNombre: string | null;
  materialLabel: string;
  tallerGrupoId: number | null;
  groupKey: string;
  displayId: number;
  peso_inicial: number;
  peso_final: number;
  porcentaje_perdida: number | null;
  peso_subcortes: number;
  pesoInicial: number;
  pesoFinal: number;
  porcentajePerdida: number | null;
};

export type MaterialOption = {
  codigo: string;
  nombre: string | null;
  label: string;
};

export const useInformesHistoricos = () => {
  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [scope, setScope] = useState<InformeScope>("taller");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaller, setSelectedTaller] = useState<TallerOption | null>(null);
  const [selectedSedes, setSelectedSedes] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption | null>(null);
  const [selectedCompareTalleres, setSelectedCompareTalleres] = useState<TallerOption[]>([]);
  const [calculo, setCalculo] = useState<TallerCalculoWithMeta[] | null>(null);
  const [loadingCalculo, setLoadingCalculo] = useState(false);
  const [materialNames, setMaterialNames] = useState<Record<string, string>>({});
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

  const sedesByTallerId = useMemo(() => {
    const map = new Map<string, string>();
    talleresFiltrados.forEach((taller) => {
      map.set(String(taller.id), taller.sede ?? UNKNOWN_BRANCH_LABEL);
    });
    return map;
  }, [talleresFiltrados]);

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

  const compareTallerSedesById = useMemo(() => {
    const map: Record<string, string[]> = {};
    individualTallerOptions.forEach((option) => {
      const sedes = new Set<string>();
      option.tallerIds.forEach((id) => {
        const sede = sedesByTallerId.get(id);
        if (sede) {
          sedes.add(sede);
        }
      });
      map[option.id] = Array.from(sedes.values());
    });
    return map;
  }, [individualTallerOptions, sedesByTallerId]);

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

    if (scope === "comparar") {
      return selectedCompareTalleres
        .flatMap((taller) => taller.tallerIds)
        .filter((id) => filteredTallerIds.has(id));
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
    selectedCompareTalleres,
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

    if (scope !== "comparar") {
      setSelectedCompareTalleres([]);
    }

    if (scope === "taller") {
      setSelectedSedes([]);
    }
  }, [scope]);

  const compareSelectionDetails = useMemo(() => {
    return selectedCompareTalleres.map((option) => {
      const sedes = new Set<string>();
      talleresFiltrados.forEach((taller) => {
        if (option.tallerIds.includes(String(taller.id))) {
          sedes.add(taller.sede ?? UNKNOWN_BRANCH_LABEL);
        }
      });

      return {
        id: option.id,
        label: option.label,
        sedes: Array.from(sedes.values()),
      };
    });
  }, [selectedCompareTalleres, talleresFiltrados]);

  const compareSelectionError = useMemo(() => {
    if (scope !== "comparar") {
      return null;
    }

    if (selectedCompareTalleres.length < 2) {
      return null;
    }

    const [first, second] = compareSelectionDetails;
    if (!first || !second) {
      return null;
    }

    const firstSedes = new Set(first.sedes);
    const hasOverlap = second.sedes.some((sede) => firstSedes.has(sede));

    return hasOverlap ? "Selecciona talleres de sedes distintas para comparar." : null;
  }, [compareSelectionDetails, scope, selectedCompareTalleres.length]);

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
            const materialCodigo = meta?.codigo_principal?.trim() ?? null;
            const materialNombre = materialCodigo ? (materialNames[materialCodigo] ?? null) : null;
            const materialLabel =
              materialNombre ?? materialCodigo ?? meta?.nombre_taller ?? `Taller ${tallerId}`;
            const grupoId = meta?.taller_grupo_id ?? null;
            const displayId = grupoId ?? Number(tallerId);
            const groupKey = grupoId ? `grupo-${grupoId}` : `taller-${tallerId}`;
            const pesoInicial = meta?.peso_inicial ?? 0;
            const pesoFinal = meta?.peso_final ?? 0;
            const porcentajePerdida = meta?.porcentaje_perdida ?? null;
            const totalSubcortesPeso = data.reduce((acc, row) => acc + row.peso, 0);

            return data.map((row) => ({
              ...row,
              tallerId: Number(tallerId),
              tallerNombre: meta?.nombre_taller ?? `Taller ${tallerId}`,
              sede: meta?.sede ?? null,
              materialNombre,
              materialLabel,
              tallerGrupoId: grupoId,
              groupKey,
              displayId,
              peso_inicial: pesoInicial,
              peso_final: pesoFinal,
              porcentaje_perdida: porcentajePerdida,
              peso_subcortes: totalSubcortesPeso,
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

  return {
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
  };
};
