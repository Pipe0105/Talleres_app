import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
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
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
        <Stack gap="md">
          <Paper withBorder radius="lg" shadow="sm" p="xl">
            <Stack gap="xs">
              <div>
                <Title order={2} size="h4">
                  Talleres registrados
                </Title>
                <Text size="sm" c="dimmed">
                  Información proveniente del archivo <code>mock/db.json</code>.
                </Text>
              </div>
            </Stack>
            {loading ? (
              <Text mt="lg" size="sm" c="dimmed">
                Cargando datos del servidor mock…
              </Text>
            ) : error ? (
              <Alert mt="lg" color="red" variant="light">
                <Stack gap="xs">
                  <Text size="sm">{error}</Text>
                  <Button
                    onClick={handleRetry}
                    color="red"
                    variant="filled"
                    size="xs"
                    maw={160}
                  >
                    Reintentar
                  </Button>
                </Stack>
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
        </Stack>
        <TallerForm productos={productos} onCreated={handleTallerCreated} />
      </SimpleGrid>
      <Paper withBorder radius="lg" shadow="sm" p="xl">
        <Title order={3} size="h4">
          Archivos asociados
        </Title>
        <Text size="sm" c="dimmed" mt="xs">
          Visualiza documentos o imágenes ligados al taller seleccionado. El
          formulario de subida se comporta de manera local para fines de
          prototipado.
        </Text>
        <FileUploader taller={selectedTaller} />
      </Paper>
    </Stack>
  );
};

export default Talleres;
