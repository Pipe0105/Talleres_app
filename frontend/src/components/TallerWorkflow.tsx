import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

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
  const [unidadBase, setUnidadBase] = useState("KG");
  const [observaciones, setObservaciones] = useState("");
  const [pesos, setPesos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingCortes, setLoadingCortes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTallerId, setSelectedTallerId] = useState<string | null>(null);
  const [calculo, setCalculo] = useState<TallerCalculoRow[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items]
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
        if (!isMounted) {
          return;
        }
        setItems(itemsData);
        setTalleres(talleresData);
        if (itemsData.length && !selectedItemId) {
          setSelectedItemId(itemsData[0].id);
        }
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
            "No fue posible obtener los cortes asociados al material seleccionado."
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

  const handlePesoChange = (
    corteId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = sanitizeInput(event.target.value, { maxLength: 18 });
    setPesos((prev) => ({ ...prev, [corteId]: value }));
  };

  const resetForm = () => {
    setPesos({});
    setObservaciones("");
    setUnidadBase("KG");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedItemId) {
      setError("Selecciona un material antes de registrar el taller.");
      return;
    }

    const detalles: CrearTallerPayload["detalles"] = cortes
      .map((corte) => {
        const raw = pesos[corte.id];
        if (!raw) {
          return null;
        }
        const parsed = Number(raw.replace(/,/g, "."));
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return null;
        }
        return { corte_id: corte.id, peso: parsed };
      })
      .filter(
        (detalle): detalle is { corte_id: string; peso: number } =>
          detalle !== null
      );

    if (!detalles.length) {
      setError(
        "Debes ingresar al menos un peso válido para registrar el taller."
      );
      return;
    }

    const payload: CrearTallerPayload = {
      item_id: selectedItemId,
      unidad_base: unidadBase || "KG",
      observaciones: observaciones
        ? sanitizeInput(observaciones, { maxLength: 300 })
        : undefined,
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
        <Stack spacing={1}>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </Paper>

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={4}
        alignItems="stretch"
      >
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{ flex: 1, p: { xs: 3, md: 4 } }}
        >
          <Stack spacing={3}>
            <div>
              <Typography variant="h6" component="h2">
                Registrar nuevo taller
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completa los campos para crear un nuevo taller asociado a un
                material y sus cortes configurados.
              </Typography>
            </div>

            <TextField
              select
              label="Material"
              value={selectedItemId}
              onChange={(event) => setSelectedItemId(event.target.value)}
              required
              disabled={loading || items.length === 0}
            >
              {items.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.descripcion} · {item.item_code}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Unidad base"
                value={unidadBase}
                onChange={(event) =>
                  setUnidadBase(
                    sanitizeInput(event.target.value, { maxLength: 12 })
                  )
                }
                helperText="Ej. KG o UND"
              />
              <TextField
                label="Observaciones"
                value={observaciones}
                onChange={(event) =>
                  setObservaciones(
                    sanitizeInput(event.target.value, { maxLength: 300 })
                  )
                }
                multiline
                minRows={2}
              />
            </Stack>

            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Pesos por corte
              </Typography>
              {loadingCortes ? (
                <Typography variant="body2" color="text.secondary">
                  Cargando cortes asociados…
                </Typography>
              ) : cortes.length ? (
                cortes.map((corte) => (
                  <TextField
                    key={corte.id}
                    label={`${
                      corte.nombre_corte
                    } · % objetivo ${corte.porcentaje_default.toFixed(2)}%`}
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                    value={pesos[corte.id] ?? ""}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handlePesoChange(corte.id, event)
                    }
                    helperText="Ingresa el peso en la unidad seleccionada"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay cortes registrados para este material. Registra cortes
                  en la API antes de crear talleres.
                </Typography>
              )}
            </Stack>

            {error && (
              <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting || loadingCortes}
            >
              {submitting ? "Registrando taller…" : "Registrar taller"}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ flex: 1, p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="h6" component="h2">
              Talleres registrados
            </Typography>
            {talleres.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {emptyMessage}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Material</TableCell>
                      <TableCell>Unidad</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {talleres.map((taller) => {
                      const item = itemMap.get(taller.item_id);
                      const fecha = new Date(taller.fecha);
                      return (
                        <TableRow
                          key={taller.id}
                          hover
                          selected={taller.id === selectedTallerId}
                          onClick={() => setSelectedTallerId(taller.id)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell>{fecha.toLocaleString("es-CO")}</TableCell>
                          <TableCell>
                            {item
                              ? `${item.descripcion} · ${item.item_code}`
                              : "Material"}
                          </TableCell>
                          <TableCell>{taller.unidad_base}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </Paper>
      </Stack>

      {calculo && selectedTallerId && (
        <TallerCalculoTable
          titulo="Cálculo del taller seleccionado"
          calculo={calculo}
          observaciones={
            talleres.find((t) => t.id === selectedTallerId)?.observaciones ??
            null
          }
          unidadBase={
            talleres.find((t) => t.id === selectedTallerId)?.unidad_base ?? "KG"
          }
        />
      )}
    </Stack>
  );
};

export default TallerWorkflow;
