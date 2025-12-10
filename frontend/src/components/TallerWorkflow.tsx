import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Paper, Stack, Typography } from "@mui/material";

import {
  createTaller,
  getCortesPorItem,
  getItems,
  getTallerCalculo,
  getTalleres,
} from "../api/talleresApi";
import {
  corte,
  CrearTallerPayload,
  Item,
  TallerCalculoRow,
  TallerListItem,
} from "../types";
import { sanitizeInput } from "../utils/security";
import TallerCalculoTable from "./TallerCalculoTable";

import MaterialSelector from "./taller/MaterialSelector";
import TallerForm from "./taller/TallerForm";
import TallerList from "./taller/TallerList";

import PageHeader from "./PageHeader";
import {
  EspecieKey,
  getItemNombre,
  resolveMaterialOptions,
  ResolvedMaterialOption,
} from "../data/materialesTaller";

interface TallerWorkflowProps {
  title: string;
  description: string;
  emptyMessage?: string;
}

const TallerWorkflow = ({
  title,
  description,
  emptyMessage = "Aún no hay talleres registrados en la base de datos.",
}: TallerWorkflowProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [cortes, setCortes] = useState<corte[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedSpecies, setSelectedSpecies] = useState<EspecieKey | null>(
    null
  );
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [nombreTaller, setNombreTaller] = useState("");
  const [pesos, setPesos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingCortes, setLoadingCortes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTallerId, setSelectedTallerId] = useState<string | null>(null);
  const [calculo, setCalculo] = useState<TallerCalculoRow[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectorLocked, setSelectorLocked] = useState(false);

  const normalizeCorteName = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^0-9A-Za-z]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

  const resolveMaterialOptionLabel = useCallback(
    (option: ResolvedMaterialOption | null | undefined) =>
      (option?.config.label ?? option?.item?.descripcion ?? "").trim(),
    []
  );

  const resolveItemLabel = useCallback(
    (item: Item | null | undefined) =>
      sanitizeInput(item ? getItemNombre(item) : "", { maxLength: 120 }),
    []
  );

  const tallerSeleccionado = useMemo(() => {
    if (!selectedTallerId) {
      return null;
    }
    return talleres.find((taller) => taller.id === selectedTallerId) ?? null;
  }, [talleres, selectedTallerId]);

  const corteNameMap = useMemo(() => {
    const entries = cortes.map(
      (corte) => [normalizeCorteName(corte.nombre_corte), corte.id] as const
    );

    return new Map(entries);
  }, [cortes]);

  const resolveCorteIdByLabel = useCallback(
    (label: string) => {
      const normalizedLabel = normalizeCorteName(label);
      const directMatch = corteNameMap.get(normalizedLabel);
      if (directMatch) {
        return directMatch;
      }

      const fallbackMatch = cortes.find((corte) => {
        const normalizedCorte = normalizeCorteName(corte.nombre_corte);
        return (
          normalizedCorte.includes(normalizedLabel) ||
          normalizedLabel.includes(normalizedCorte)
        );
      });

      return fallbackMatch?.id;
    },
    [corteNameMap, cortes]
  );

  const selectedItem = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    return items.find((item) => item.id === Number(selectedItemId)) ?? null;
  }, [items, selectedItemId]);

  const selectedItemNombre = useMemo(
    () => selectedItem?.descripcion ?? "",
    [selectedItem]
  );

  const selectedItemLabel = useMemo(
    () => resolveItemLabel(selectedItem),
    [resolveItemLabel, selectedItem]
  );

  const parsePesoValue = useCallback((value?: string) => {
    if (!value?.trim()) {
      return null;
    }
    const normalized = value.replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }, []);

  const canSubmit = useMemo(() => {
    if (!selectedItem || !selectedItemId || !nombreTaller.trim()) {
      return false;
    }

    if (!cortes.length) {
      return false;
    }

    if (!cortes.length) {
      return false;
    }

    return cortes.every((corte) => parsePesoValue(pesos[corte.id]) !== null);
  }, [
    cortes,
    nombreTaller,
    parsePesoValue,
    pesos,
    selectedItem,
    selectedItemId,
  ]);

  const secondaryCuts = useMemo(() => {
    if (!selectedSpecies) {
      return [];
    }

    const resolvedOptions = resolveMaterialOptions(items, selectedSpecies);
    const selectedOption = resolvedOptions.find(
      (option) => option.item && String(option.item.id) === selectedItemId
    );

    if (!selectedOption?.children?.length) {
      return [];
    }

    const seen = new Set<string>();

    return selectedOption.children
      .map((child) => resolveMaterialOptionLabel(child))
      .filter((label): label is string => {
        if (!label) {
          return false;
        }

        const key = label.toUpperCase();

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
  }, [items, selectedItemId, selectedSpecies, resolveMaterialOptionLabel]);

  const normalizeSpecies = (value: string): EspecieKey =>
    value.trim().toLowerCase() === "cerdo" ? "cerdo" : "res";

  const primaryCorteLabel = useMemo(() => {
    const normalizedSelected = normalizeCorteName(
      selectedItemNombre || selectedItemLabel || ""
    );

    const primaryMatch = cortes.find((corte) => {
      const normalizedCorte = normalizeCorteName(corte.nombre_corte);
      return (
        normalizedCorte === normalizedSelected ||
        normalizedCorte.includes(normalizedSelected) ||
        normalizedCorte.includes(normalizedCorte)
      );
    });

    return (
      primaryMatch?.nombre_corte ||
      selectedItemNombre ||
      selectedItemLabel ||
      ""
    );
  }, [cortes, selectedItemLabel, selectedItemNombre]);

  const resolvedSecondaryCuts = useMemo(
    () =>
      secondaryCuts.map((label) => {
        const corteId = resolveCorteIdByLabel(label);
        const matched = corteId
          ? cortes.find((corte) => corte.id === corteId)
          : null;
        return matched?.nombre_corte || label;
      }),
    [secondaryCuts, resolveCorteIdByLabel, cortes]
  );
  const finalCorteLabel = useMemo(() => {
    const finalMatch = cortes.find((corte) => {
      const normalized = normalizeCorteName(corte.nombre_corte);
      return /FINAL|SALIDA|DESP/.test(normalized);
    });

    return finalMatch?.nombre_corte || `${primaryCorteLabel} FINAL`.trim();
  }, [cortes, primaryCorteLabel]);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [itemsData, talleresData] = await Promise.all([
          getItems(),
          getTalleres(),
        ]);
        if (!isMounted) {
          return;
        }
        setItems(itemsData);
        setTalleres(talleresData);
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible cargar los datos iniciales del servidor.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedItemId) {
      setCortes([]);
      setPesos({});
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchCortes = async () => {
      try {
        setLoadingCortes(true);
        const response = await getCortesPorItem(selectedItemId);
        if (!isMounted) {
          return;
        }
        setCortes(response);
        setError(null);
        setPesos((prev) => {
          const next: Record<string, string> = {};
          response.forEach((corte) => {
            next[corte.id] = prev[corte.id] ?? "";
          });
          return next;
        });
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            "No fue posible cargar los cortes del material. Verifica tu sesión e inténtalo nuevamente."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingCortes(false);
        }
      }
    };

    void fetchCortes();

    return () => {
      isMounted = false;
    };
  }, [selectedItemId]);

  useEffect(() => {
    if (!selectedItemId) {
      return;
    }

    const selectedItem = items.find(
      (item) => item.id === Number(selectedItemId)
    );
    if (selectedItem) {
      setNombreTaller((current) =>
        current?.trim() ? current : resolveItemLabel(selectedItem)
      );
    }
  }, [items, selectedItemId]);

  useEffect(() => {
    if (!selectedTallerId) {
      setCalculo(null);
      return;
    }

    let isMounted = true;

    const fetchCalculo = async () => {
      try {
        const response = await getTallerCalculo(selectedTallerId);
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
      }
    };

    void fetchCalculo();

    return () => {
      isMounted = false;
    };
  }, [selectedTallerId]);

  const handlePesoChange = (corteId: string, value: string) => {
    const sanitized = sanitizeInput(value, { maxLength: 18 });
    setPesos((prev) => ({ ...prev, [corteId]: sanitized }));
    setError(null);
  };

  const handleNombreChange = (value: string) => {
    setNombreTaller(sanitizeInput(value, { maxLength: 120 }));
  };

  const handleSubcortePesoChange = (label: string, value: string) => {
    const corteId = resolveCorteIdByLabel(label);
    if (!corteId) {
      return;
    }
    handlePesoChange(corteId, value);
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = items.find((candidate) => candidate.id === Number(itemId));
    if (item) {
      setSelectedSpecies(normalizeSpecies(item.especie));
      const normalizedName = resolveItemLabel(item);
      setNombreTaller(normalizedName || nombreTaller);
    }
  };

  const handleSpeciesChange = (species: EspecieKey) => {
    setSelectedSpecies(species);
    setSelectedItemId("");
    setPesos({});
    setCortes([]);
    setNombreTaller("");
    setSelectorLocked(false);
  };

  const handleMaterialSelect = (itemId: string) => {
    handleSelectItem(itemId);
    setSelectorOpen(false);
    setSelectorLocked(true);
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();

    if (submitting || !selectedItem || !selectedItemId) {
      return;
    }

    const cortesParaGuardar = cortes
      .map((corte) => {
        const peso = parsePesoValue(pesos[corte.id]);
        return peso !== null
          ? { item_id: selectedItemId, corte_id: corte.id, peso }
          : null;
      })
      .filter(
        (detalle): detalle is NonNullable<typeof detalle> => detalle !== null
      );

    if (!canSubmit || !cortesParaGuardar.length) {
      setError(
        "Completa el nombre del taller e ingresa los pesos de los cortes antes de guardar."
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: CrearTallerPayload = {
      nombre_taller: nombreTaller.trim(),
      descripcion: selectedItemLabel || null,
      detalles: cortesParaGuardar,
    };

    try {
      const tallerCreado = await createTaller(payload);
      const [talleresData, calculoData] = await Promise.all([
        getTalleres(),
        getTallerCalculo(tallerCreado.id),
      ]);

      setTalleres(talleresData);
      setSelectedTallerId(tallerCreado.id);
      setCalculo(calculoData);
      setPesos({});
      setSelectorLocked(false);
    } catch (err) {
      console.error(err);
      setError(
        "No fue posible guardar el taller. Verifica los datos e inténtalo nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={4} component="form" onSubmit={handleSubmit}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <PageHeader title={title} description={description} />
      </Paper>

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <MaterialSelector
          items={items}
          selectedSpecies={selectedSpecies}
          onSpeciesChange={handleSpeciesChange}
          selectedItemId={selectedItemId}
          onSelectMaterial={handleMaterialSelect}
          open={selectorOpen}
          onOpen={() => setSelectorOpen(true)}
          onClose={() => setSelectorOpen(false)}
          loadingItems={loading}
          locked={selectorLocked}
        />
      </Paper>

      {selectedItem && (
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={4}
          alignItems="stretch"
        >
          <TallerForm
            cortes={cortes}
            pesos={pesos}
            selectedItemId={selectedItemId}
            selectedItem={selectedItem}
            selectedItemNombre={selectedItemNombre}
            primaryCorteLabel={primaryCorteLabel}
            nombreTaller={nombreTaller}
            loadingCortes={loadingCortes}
            error={error}
            secondaryCuts={resolvedSecondaryCuts}
            finalCorteLabel={finalCorteLabel}
            submitting={submitting}
            onNombreChange={handleNombreChange}
            onPesoChange={handlePesoChange}
            onOpenSelector={() => setSelectorOpen(true)}
            onSubcortePesoChange={handleSubcortePesoChange}
            onSubmit={handleSubmit}
          />
        </Stack>
      )}

      {calculo && selectedTallerId && tallerSeleccionado && (
        <TallerCalculoTable
          titulo={`Cálculo del taller · ${tallerSeleccionado.nombre_taller}`}
          calculo={calculo}
          observaciones={tallerSeleccionado.descripcion ?? null}
        />
      )}
    </Stack>
  );
};

export default TallerWorkflow;
