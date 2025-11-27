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

  const parsePesoInput = (raw: string | undefined | null): number | null => {
    if (raw === undefined || raw === null) {
      return null;
    }

    const cleaned = raw
      .replace(/[^0-9.,-]+/g, "")
      .replace(/\s+/g, "")
      .replace(/[.,](?=\d{3}(?:\D|$))/g, "")
      .replace(/,/g, ".");

    if (!cleaned) {
      return null;
    }

    const parsed = Number.parseFloat(cleaned);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  };

  const resetForm = () => {
    setPesos({});
    setNombreTaller(() => {
      return resolveItemLabel(selectedItem);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedItemId) {
      setError("Selecciona un material antes de registrar el taller.");
      return;
    }

    const corteById = cortes.reduce((map, corte) => {
      map.set(corte.id, corte);
      return map;
    }, new Map<string, corte>());

    const detalles: CrearTallerPayload["detalles"] = Object.entries(pesos)
      .map(([corteId, rawPeso]) => {
        const corte = corteById.get(corteId);
        const parsed = parsePesoInput(rawPeso);

        if (!corte || parsed === null) {
          return null;
        }

        return {
          item_id: corte.item_id,
          corte_id: corte.id,
          peso: parsed,
        } satisfies CrearTallerPayload["detalles"][number];
      })
      .filter((detalle): detalle is CrearTallerPayload["detalles"][number] =>
        Boolean(detalle)
      );

    if (!detalles.length) {
      setError(
        "Debes ingresar al menos un peso válido para registrar el taller."
      );
      return;
    }

    const nombreNormalizado = sanitizeInput(nombreTaller, { maxLength: 120 });
    if (!nombreNormalizado) {
      setError("Ingresa un nombre valido para el taller");
      return;
    }

    const payload: CrearTallerPayload = {
      nombre_taller: nombreNormalizado,
      detalles,
    };

    try {
      setSubmitting(true);
      setError(null);
      const nuevoTaller = await createTaller(payload);
      setSelectedTallerId(nuevoTaller.id);
      resetForm();
      const refreshedTalleres = await getTalleres();
      setTalleres(refreshedTalleres);
      setSelectorLocked(false);
    } catch (err) {
      console.error(err);
      setError(
        "No fue posible registrar el taller. Verifica los datos e inténtalo nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={4}>
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
            nombreTaller={nombreTaller}
            loadingCortes={loadingCortes}
            submitting={submitting}
            error={error}
            secondaryCuts={secondaryCuts}
            onSubmit={handleSubmit}
            onNombreChange={handleNombreChange}
            onPesoChange={handlePesoChange}
            onOpenSelector={() => setSelectorOpen(true)}
            onSubcortePesoChange={handleSubcortePesoChange}
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
