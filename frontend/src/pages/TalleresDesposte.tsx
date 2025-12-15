import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import {
  createTaller,
  getCortesPorItem,
  getItems,
  getTallerCalculo,
  getTalleres,
} from "../api/talleresApi";
import { CrearTallerPayload, TallerCalculoRow, TallerListItem } from "../types";

const numberFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const TalleresDesposte = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [cortes, setCortes] = useState<corte[]>([]);
  const [pesos, setPesos] = useState<Record<string, number>>({});
  const [calculo, setCalculo] = useState<TallerCalculoRow[]>([]);

  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingCortes, setLoadingCortes] = useState(false);
  const [loadingCalculo, setLoadingCalculo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => String(item.id) === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        setLoadingItems(true);
        const [itemsResponse, talleresResponse] = await Promise.all([
          getItems(),
          getTalleres(),
        ]);

        if (!isMounted) return;

        setItems(itemsResponse);
        setTalleres(talleresResponse);
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No se pudieron cargar los materiales y talleres.");
        }
      } finally {
        if (isMounted) {
          setLoadingItems(false);
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
      return;
    }

    let isMounted = true;

    const fetchCortes = async () => {
      try {
        setLoadingCortes(true);
        const response = await getCortesPorItem(selectedItemId);
        if (!isMounted) return;

        setCortes(response);
        setPesos((prev) => {
          const next: Record<string, number> = {};
          response.forEach((corte) => {
            const existing = prev[corte.id];
            next[corte.id] = typeof existing === "number" ? existing : 0;
          });
          return next;
        });
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(
            "No se pudieron cargar los cortes para el material seleccionado."
          );
          setCortes([]);
          setPesos({});
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

  const handlePesoChange = (corteId: string, value: string) => {
    const parsed = Number(value);
    setPesos((prev) => ({
      ...prev,
      [corteId]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const totalPeso = useMemo(
    () => cortes.reduce((sum, corte) => sum + (pesos[corte.id] ?? 0), 0),
    [cortes, pesos]
  );

  const handleSubmit = async () => {
    if (!selectedItem) {
      setError("Seleccione un material válido.");
      return;
    }

    const cortesPayload: CrearTallerPayload["cortes"] = cortes.map((corte) => ({
      item_id: selectedItem.id,
      corte_id: corte.id,
      peso: pesos[corte.id] ?? 0,
    }));

    const payload: CrearTallerPayload = {
      nombre_taller: selectedItem.descripcion || selectedItem.nombre,
      descripcion: selectedItem.descripcion,
      cortes: cortesPayload,
    };

    try {
      setSubmitting(true);
      const created = await createTaller(payload);
      setSuccess(`Taller "${created.nombre_taller}" creado exitosamente.`);
      setError(null);
      setCalculo([]);

      const [talleresResponse, calculoResponse] = await Promise.all([
        getTalleres(),
        getTallerCalculo(created.id),
      ]);

      setTalleres(talleresResponse);
      setCalculo(calculoResponse);
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el taller. Intente nuevamente.");
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCalculo = async (tallerId: string) => {
    try {
      setLoadingCalculo(true);
      const calculoResponse = await getTallerCalculo(tallerId);
      setCalculo(calculoResponse);
      setSuccess(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el cálculo del taller.");
    } finally {
      setLoadingCalculo(false);
    }
  };

  return (
    <Stack spacing={3} className="animate-fade-up">
      <PageHeader
        title="Talleres de desposte"
        descripcion="Registra los pesos de"
      />
    </Stack>
  );
};
