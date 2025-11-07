import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Button,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  createTaller,
  getPrecios,
  getProductos,
  getTalleres,
} from "../api/talleresApi";
import Dashboard from "../components/Dashboard";
import FileUploader from "../components/FileUploader";
import PageSection from "../components/PageSection";
import TallerForm from "../components/TallerForm";
import { NewTaller, Precio, Producto, Taller } from "../types";
import TallerBreakdownCard from "../components/TallerBreakdownCard";
import {
  construirMapaDeGrupos,
  construirMapaProductos,
  TallerGrupoCalculado,
} from "../utils/talleres";

import { safeNumberFromStorage, safeStorage } from "../utils/storage";
import { sanitizeSearchQuery } from "../utils/security";

const STORAGE_KEYS = {
  selectedTaller: "talleres.selectedTallerId",
  search: "talleres.dashboardSearch",
} as const;

const Talleres = () => {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [selectedTallerId, setSelectedTallerId] = useState<number | null>(() =>
    safeNumberFromStorage(STORAGE_KEYS.selectedTaller)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [dashboardSearch, setDashboardSearch] = useState<string>(
    () => safeStorage.getItem(STORAGE_KEYS.search) ?? ""
  );

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [talleresData, productosData, preciosData] = await Promise.all([
          getTalleres(),
          getProductos(),
          getPrecios(),
        ]);

        if (!isMounted) return;

        setTalleres(talleresData);
        setProductos(productosData);
        setPrecios(preciosData);
        setError(null);
        setSelectedTallerId((current) => {
          if (current) {
            return talleresData.find((t) => t.id === current)?.id ?? null;
          }
          return talleresData[0]?.id ?? null;
        });
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible cargar los datos del mock API.");
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
  }, [refreshToken]);

  const selectedTaller = useMemo(
    () => talleres.find((taller) => taller.id === selectedTallerId) ?? null,
    [selectedTallerId, talleres]
  );

  const productoMap = useMemo(
    () => construirMapaProductos(productos),
    [productos]
  );
  const gruposPorNombre = useMemo(
    () => construirMapaDeGrupos(talleres, productoMap),
    [talleres, productoMap]
  );
  const selectedBreakdown: TallerGrupoCalculado | null = useMemo(() => {
    if (!selectedTaller) {
      return null;
    }
    return gruposPorNombre.get(selectedTaller.grupo) ?? null;
  }, [selectedTaller, gruposPorNombre]);

  const handleTallerCreated = async (payload: NewTaller) => {
    try {
      const nuevoTaller = await createTaller(payload);
      setTalleres((prev) =>
        [...prev, nuevoTaller].sort(
          (a, b) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
            b.id - a.id
        )
      );
      setSelectedTallerId(nuevoTaller.id);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo registrar el nuevo taller.");
    }
  };

  const handleRetry = () => {
    setError(null);
    setSelectedTallerId(null);
    setLoading(true);
    setRefreshToken((token) => token + 1);
  };

  useEffect(() => {
    if (selectedTallerId) {
      safeStorage.setItem(
        STORAGE_KEYS.selectedTaller,
        String(selectedTallerId)
      );
    } else {
      safeStorage.removeItem(STORAGE_KEYS.selectedTaller);
    }
  }, [selectedTallerId]);

  useEffect(() => {
    const sanitized = sanitizeSearchQuery(dashboardSearch);
    safeStorage.setItem(STORAGE_KEYS.search, sanitized);
  }, [dashboardSearch]);

  const handleSearchChange = (value: string) => {
    setDashboardSearch(sanitizeSearchQuery(value));
  };
  return (
    <Stack spacing={4}>
      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}>
          <PageSection
            spacing={3}
            title={
              <Typography variant="h5" component="h2">
                Talleres registrados
              </Typography>
            }
            description={
              <Typography variant="body2" color="text.secondary">
                Información proveniente del archivo <code>mock/db.json</code>.
              </Typography>
            }
          >
            {loading ? (
              <Typography variant="body2" color="text.secondary">
                Cargando datos del servidor mock…
              </Typography>
            ) : error ? (
              <Alert severity="error">
                <AlertTitle>Error al cargar</AlertTitle>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {error}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={handleRetry}
                >
                  Reintentar
                </Button>
              </Alert>
            ) : (
              <Dashboard
                talleres={talleres}
                productos={productos}
                precios={precios}
                selectedTallerId={selectedTallerId}
                onSelectTaller={setSelectedTallerId}
                searchQuery={dashboardSearch}
                onSearchChange={handleSearchChange}
              />
            )}
          </PageSection>
        </Grid>
        <Grid item xs={12} lg={5}>
          <TallerForm productos={productos} onCreated={handleTallerCreated} />
        </Grid>
      </Grid>
      <PageSection
        spacing={2.5}
        title={
          <Typography variant="h6" component="h3">
            Archivos asociados
          </Typography>
        }
        description={
          <Typography variant="body2" color="text.secondary">
            Visualiza documentos o imágenes ligados al taller seleccionado. El
            formulario de subida se comporta de manera local para fines de
            prototipado.
          </Typography>
        }
      >
        <FileUploader taller={selectedTaller} />
      </PageSection>
      <Stack spacing={3}>
        <Typography variant="h6" component="h3">
          Resultados del taller seleccionado
        </Typography>
        {selectedBreakdown ? (
          <TallerBreakdownCard breakdown={selectedBreakdown} />
        ) : (
          <PageSection padding="compact">
            <Typography variant="body2" color="text.secondary">
              Selecciona un taller en la tabla para visualizar el reparto de
              cortes y porcentajes.
            </Typography>
          </PageSection>
        )}
      </Stack>
    </Stack>
  );
};

export default Talleres;
