import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  FileInput,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { getArchivos } from "../api/archivosApi";
import { Archivo, Taller } from "../types";

interface FileUploaderProps {
  taller: Taller | null;
}

interface LocalArchivo extends Archivo {
  localUrl?: string;
  esSimulado?: boolean;
}

const FileUploader = ({ taller }: FileUploaderProps) => {
  const [archivos, setArchivos] = useState<LocalArchivo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [comentarios, setComentarios] = useState("");
  const [creadoPor, setCreadoPor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const localUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchArchivos = async () => {
      if (!taller) {
        setArchivos([]);
        setError(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setArchivos([]);
        const data = await getArchivos(taller.id);
        if (isMounted) {
          setArchivos(data);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("No fue posible obtener los archivos para este taller.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchArchivos();

    return () => {
      isMounted = false;
    };
  }, [taller?.id]);

  useEffect(() => {
    return () => {
      localUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taller) {
      setError("Selecciona un taller para asociar archivos.");
      return;
    }
    if (!file) {
      setError("Debes elegir un archivo a subir.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    localUrlsRef.current.push(localUrl);
    const nuevoArchivo: LocalArchivo = {
      id: Date.now(),
      taller_id: taller.id,
      ruta: file.name,
      fecha_subida: new Date().toISOString(),
      creado_por: creadoPor || "operario-demo",
      comentarios: comentarios || "Archivo cargado de manera local",
      localUrl,
      esSimulado: true,
    };

    setArchivos((prev) => [...prev, nuevoArchivo]);
    setFile(null);
    setComentarios("");
    setCreadoPor("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const archivosOrdenados = useMemo(
    () =>
      [...archivos].sort(
        (a, b) =>
          new Date(b.fecha_subida).getTime() -
          new Date(a.fecha_subida).getTime()
      ),
    [archivos]
  );

  if (!taller) {
    return (
      <Paper
        withBorder
        radius="md"
        p="lg"
        style={{ borderStyle: "dashed" }}
        bg="var(--mantine-color-gray-0)"
      >
        <Text ta="center" size="sm" c="dimmed">
          Selecciona un taller en la tabla para visualizar y simular cargas de
          archivos.
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="lg" mt="lg">
      <Paper
        withBorder
        radius="md"
        shadow="xs"
        p="lg"
        component="form"
        onSubmit={handleSubmit}
      >
        <Stack gap="sm">
          <div>
            <Title order={4} size="h6">
              Subir archivo (simulado)
            </Title>
            <Text size="xs" c="dimmed" mt={4}>
              Esta acción solo actualiza el estado local de la interfaz para
              fines de prototipado.
            </Text>
          </div>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <FileInput
              label="Archivo"
              placeholder="Selecciona un archivo"
              value={file}
              onChange={(selected: File | null) => setFile(selected)}
              inputRef={fileInputRef}
              required
            />
            <TextInput
              label="Operario"
              placeholder="Ej. operario-demo"
              value={creadoPor}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setCreadoPor(event.currentTarget.value)
              }
            />
          </SimpleGrid>
          <Textarea
            label="Comentarios"
            placeholder="Detalle o contexto del archivo"
            minRows={2}
            value={comentarios}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setComentarios(event.currentTarget.value)
            }
          />
          {error && (
            <Alert color="red" variant="light" size="sm">
              {error}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button type="submit">Simular subida</Button>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder radius="md" shadow="sm">
        <Stack gap={0}>
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid var(--mantine-color-gray-3)",
            }}
          >
            <Title order={4} size="h6">
              Archivos de {taller.observaciones}
            </Title>
            {loading && (
              <Text size="xs" c="dimmed" mt={4}>
                Cargando archivos desde el mock…
              </Text>
            )}
          </div>
          <Stack gap="xs" p="md">
            {archivosOrdenados.map((archivo) => (
              <Paper key={archivo.id} radius="md" withBorder p="md" shadow="xs">
                <Group
                  justify="space-between"
                  align="flex-start"
                  wrap="nowrap"
                  gap="md"
                >
                  <div>
                    <Text fw={600}>{archivo.ruta}</Text>
                    <Text size="xs" c="dimmed">
                      Subido el{" "}
                      {new Date(archivo.fecha_subida).toLocaleString("es-CL")}
                      {archivo.esSimulado && " · Simulado"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {archivo.creado_por} — {archivo.comentarios}
                    </Text>
                  </div>
                  {archivo.localUrl && (
                    <Button
                      component="a"
                      href={archivo.localUrl}
                      target="_blank"
                      rel="noreferrer"
                      variant="light"
                      size="xs"
                    >
                      Ver archivo
                    </Button>
                  )}
                </Group>
              </Paper>
            ))}
            {archivosOrdenados.length === 0 && (
              <Text ta="center" size="xs" c="dimmed">
                Este taller aún no tiene archivos asociados.
              </Text>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default FileUploader;
