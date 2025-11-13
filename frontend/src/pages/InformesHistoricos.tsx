import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getTallerCalculo, getTalleres } from "../api/talleresApi";
import { TallerCalculoRow, TallerListItem } from "../types";
import TallerCalculoTable from "../components/TallerCalculoTable";

const pesoFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

interface TallerOption {
  id: string;
  label: string;
}

const InformesHistoricos = () => {
  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaller, setSelectedTaller] = useState<TallerOption | null>(
    null
  );
  const [calculo, setCalculo] = useState<TallerCalculoRow[] | null>(null);
  const [loadingCalculo, setLoadingCalculo] = useState(false);

  const tallerOptions = useMemo<TallerOption[]>(() => {
    return talleres.map((taller) => ({
      id: taller.id,
      label: `${taller.nombre_taller} · ${pesoFormatter.format(
        taller.total_peso
      )} kg`,
    }));
  }, [talleres]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const talleresData = await getTalleres();

        if (!isMounted) {
          return;
        }

        setTalleres(talleresData);
        setError(null);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible cargar los informes desde la API.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTaller) {
      setCalculo(null);
      return;
    }

    let isMounted = true;

    const fetchCalculo = async () => {
      try {
        setLoadingCalculo(true);
        const response = await getTallerCalculo(selectedTaller.id);
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
  }, [selectedTaller]);

  return (
    <Stack spacing={4}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={1}>
          <Typography variant="h4" component="h1">
            Informes históricos de talleres
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consulta la información registrada de talleres anteriores. El
            detalle proviene de la vista consolidada en la base de datos y
            refleja los porcentajes reales versus los objetivos de cada corte.
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <div>
            <Typography variant="h6" component="h2">
              Selecciona un taller
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Busca por material o fecha para revisar el reparto de cortes y sus
              valores estimados.{" "}
            </Typography>
          </div>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Autocomplete
            options={tallerOptions}
            value={selectedTaller}
            onChange={(_, value) => setSelectedTaller(value)}
            loading={loading}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Taller"
                placeholder="Ej. Lomo vetado — 12/05/2024"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {loadingCalculo && (
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                Cargando detalle del taller…
              </Typography>
            </Stack>
          )}
          {!loadingCalculo && calculo && selectedTaller && (
            <TallerCalculoTable
              titulo={`Detalle del taller · ${selectedTaller.label}`}
              calculo={calculo}
              observaciones={
                talleres.find((t) => t.id === selectedTaller.id)?.descripcion ??
                null
              }
            />
          )}

          {!loading && !calculo && !selectedTaller && talleres.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No hay talleres registrados en el sistema. Registra uno desde la
              sección de talleres para visualizar sus detalles aquí.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default InformesHistoricos;
