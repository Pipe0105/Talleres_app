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
import TallerForm from "../components/TallerForm";
import { NewTaller, Precio, Producto, Taller } from "../types";

const Talleres = () => {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [selectedTallerId, setSelectedTallerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

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
  return (
    <Stack spacing={4}>
      <Grid container spacing={4}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={1.5}>
              <div>
                <Typography variant="h5" component="h2">
                  Talleres registrados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Información proveniente del archivo <code>mock/db.json</code>.
                </Typography>
              </div>
            </Stack>
            {loading ? (
              <Typography mt={4} variant="body2" color="text.secondary">
                Cargando datos del servidor mock…
              </Typography>
            ) : error ? (
              <Alert severity="error" sx={{ mt: 4 }}>
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
              />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <TallerForm productos={productos} onCreated={handleTallerCreated} />
        </Grid>
      </Grid>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h6" component="h3">
          Archivos asociados
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Visualiza documentos o imágenes ligados al taller seleccionado. El
          formulario de subida se comporta de manera local para fines de
          prototipado.
        </Typography>
        <FileUploader taller={selectedTaller} />
      </Paper>
    </Stack>
  );
};

export default Talleres;
