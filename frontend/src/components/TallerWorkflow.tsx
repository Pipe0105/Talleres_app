import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Paper, Stack } from "@mui/material";

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
import { EspecieKey, getItemNombre } from "../data/materialesTaller";
import PageHeader from "./PageHeader";
import TallerCalculoTable from "./TallerCalculoTable";

import MaterialSelector from "./taller/MaterialSelector";
import TallerForm from "./taller/TallerForm";
import TallerList from "./taller/TallerList";

const FINAL_CORTE_ID = "final";
const FINAL_CORTE_NAME = "Corte Final";

const parsePesoValue = (value?: string): number | null => {
  if (!value?.trim()) {
    return null;
  }
  const normalized = value.replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const createFinalCorte = (itemId: string): corte => ({
  id: FINAL_CORTE_ID,
  item_id: itemId,
  nombre_corte: FINAL_CORTE_NAME,
  porcentaje_default: 0,
});

const appendFinalCorte = (cortes: corte[], itemId: string): corte[] => {
  const hasFinal = cortes.some((corte) => corte.id === FINAL_CORTE_ID);
  return hasFinal ? cortes : [...cortes, createFinalCorte(itemId)];
};

const resolveItemLabel = (item: Item | null | undefined): string =>
  sanitizeInput(item ? getItemNombre(item) : "", { maxLength: 120 });

const TallerWorkflow = ({
  title,
  description,
  emptyMessage = "Aún no hay talleres registrados en la base de datos.",
}: {
  title: string;
  description: string;
  emptyMessage?: string;
}) => {
  // Datos base
  const [items, setItems] = useState<Item[]>([]);
  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [cortes, setCortes] = useState<corte[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedSpecies, setSelectedSpecies] = useState<EspecieKey | null>(
    null
  );
  const [selectedTallerId, setSelectedTallerId] = useState<string | null>(null);
  const [nombreTaller, setNombreTaller] = useState("");
  const [pesos, setPesos] = useState<Record<string, string>>({});
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorLocked, setSelectorLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCortes, setLoadingCortes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculo, setCalculo] = useState<TallerCalculoRow[] | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === Number(selectedItemId)) ?? null,
    [items, selectedItemId]
  );

  const selectedItemNombre = useMemo(
    () => selectedItem?.descripcion ?? "",
    [selectedItem]
  );

  const tallerSeleccionado = useMemo(() => {
    if (!selectedTallerId) return null;
    return talleres.find((taller) => taller.id === selectedTallerId) ?? null;
  }, [talleres, selectedTallerId]);

  const canSubmit = useMemo(
    () =>
      nombreTaller.trim() !== "" &&
      Boolean(selectedItemId) &&
      parsePesoValue(pesos[FINAL_CORTE_ID]) !== null,
    [nombreTaller, pesos, selectedItemId]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [itemsData, talleresData] = await Promise.all([
          getItems(),
          getTalleres(),
        ]);
        if (!isMounted) return;
        setItems(itemsData);
        setTalleres(talleresData);
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible cargar los datos iniciales del servidor.");
        }
      } finally {
        if (isMounted) setLoading(false);
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
        if (!isMounted) return;
        const cortesConFinal = appendFinalCorte(response, selectedItemId);
        setCortes(cortesConFinal);
        setPesos((prev) => {
          const next: Record<string, string> = {};
          cortesConFinal.forEach((corte) => {
            next[corte.id] = prev[corte.id] ?? "";
          });
          return next;
        });
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            "No fue posible cargar los cortes del material. Verifica tu sesión e inténtalo nuevamente."
          );
        }
      } finally {
        if (isMounted) setLoadingCortes(false);
      }
    };

    void fetchCortes();

    return () => {
      isMounted = false;
    };
  }, [selectedItemId]);

  useEffect(() => {
    if (!selectedItemId) return;
    const item = items.find(
      (candidate) => candidate.id === Number(selectedItemId)
    );
    if (item) {
      setNombreTaller((current) =>
        current?.trim() ? current : resolveItemLabel(item)
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
        if (!isMounted) return;
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

  // Handlers
  const handlePesoChange = useCallback((corteId: string, value: string) => {
    setPesos((prev) => ({ ...prev, [corteId]: value }));
    setError(null);
  }, []);

  const handleNombreChange = (value: string) => {
    setNombreTaller(sanitizeInput(value, { maxLength: 120 }));
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = items.find((candidate) => candidate.id === Number(itemId));
    if (item) {
      const normalizedName = resolveItemLabel(item);
      setSelectedSpecies(
        item.especie.trim().toLowerCase() === "cerdo" ? "cerdo" : "res"
      );
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

    const detalles = cortes
      .map((corte) => {
        const peso = parsePesoValue(pesos[corte.id]);
        return peso !== null
          ? { item_id: selectedItemId, corte_id: corte.id, peso }
          : null;
      })
      .filter(
        (detalle): detalle is NonNullable<typeof detalle> => detalle !== null
      );

    if (!canSubmit || !detalles.length) {
      setError(
        "Completa el nombre del taller e ingresa los pesos de los cortes antes de guardar."
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: CrearTallerPayload = {
      nombre_taller: nombreTaller.trim(),
      descripcion: resolveItemLabel(selectedItem) || null,
      detalles,
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
            selectedItem={selectedItem}
            selectedItemNombre={selectedItemNombre}
            nombreTaller={nombreTaller}
            loadingCortes={loadingCortes}
            error={error}
            submitting={submitting}
            onNombreChange={handleNombreChange}
            onPesoChange={handlePesoChange}
            onOpenSelector={() => setSelectorOpen(true)}
            onSubmit={handleSubmit}
          />

          <TallerList
            talleres={talleres}
            selectedTallerId={selectedTallerId}
            onSelect={(tallerId) => setSelectedTallerId(tallerId)}
            loading={loading}
            emptyMessage={emptyMessage}
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
