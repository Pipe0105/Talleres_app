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
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { getArchivos } from "../api/archivosApi";
import { Archivo, Taller } from "../types";
import {
  isSafeFileSize,
  isSafeFileType,
  sanitizeInput,
} from "../utils/security";

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
  const localUrlsRef = useRef<string[]>([]);

  const ALLOWED_TYPES = useRef<readonly string[]>([
    "image/jpeg",
    "image/png",
    "application/pdf",
  ]);
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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
      ruta: sanitizeInput(file.name, { maxLength: 160 }),
      fecha_subida: new Date().toISOString(),
      creado_por:
        sanitizeInput(creadoPor, { maxLength: 60 }) || "operario-demo",
      comentarios:
        sanitizeInput(comentarios, { maxLength: 300 }) ||
        "Archivo cargado de manera local",
      localUrl,
      esSimulado: true,
    };

    setArchivos((prev) => [...prev, nuevoArchivo]);
    setFile(null);
    setComentarios("");
    setCreadoPor("");
    setError(null);
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
      <Box
        sx={(theme) => ({
          mt: 3,
          px: 3,
          py: 4,
          borderRadius: 3,
          border: `1px dashed ${theme.palette.divider}`,
          textAlign: "center",
          bgcolor: "background.paper",
        })}
      >
        <Typography variant="body2" color="text.secondary">
          Selecciona un taller en la tabla para visualizar y simular cargas de
          archivos.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3} mt={3}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{ p: { xs: 3, md: 4 } }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Subir archivo (simulado)</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Esta acción solo actualiza el estado local de la interfaz para
              fines de prototipado.
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Archivo
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                >
                  Seleccionar archivo
                  <input
                    type="file"
                    hidden
                    accept={ALLOWED_TYPES.current.join(",")}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const selected = event.target.files?.[0] ?? null;
                      if (!selected) {
                        setFile(null);
                        return;
                      }

                      if (
                        selected.type &&
                        !isSafeFileType(selected.type, ALLOWED_TYPES.current)
                      ) {
                        setError(
                          "Formato no permitido. Usa imágenes JPG/PNG o PDF."
                        );
                        setFile(null);
                        return;
                      }

                      if (!isSafeFileSize(selected.size, MAX_FILE_SIZE_BYTES)) {
                        setError("El archivo no debe superar los 5 MB.");
                        setFile(null);
                        return;
                      }

                      setError(null);
                      setFile(selected);
                    }}
                  />
                </Button>
                {file && (
                  <Typography variant="caption" color="text.secondary">
                    {file.name}
                  </Typography>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Operario"
                placeholder="Ej. operario-demo"
                value={creadoPor}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setCreadoPor(
                    sanitizeInput(event.currentTarget.value, { maxLength: 60 })
                  )
                }
                inputProps={{ maxLength: 60, autoComplete: "off" }}
              />
            </Grid>
          </Grid>
          <TextField
            label="Comentarios"
            placeholder="Detalle o contexto del archivo"
            multiline
            minRows={3}
            value={comentarios}
            onChange={(
              event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) =>
              setComentarios(
                sanitizeInput(event.currentTarget.value, { maxLength: 300 })
              )
            }
            inputProps={{ maxLength: 300, autoComplete: "off" }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction="row" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              disabled={!file || !!error}
            >
              Simular subida
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">
              Archivos de {taller.observaciones}
            </Typography>
            {loading && (
              <Typography variant="caption" color="text.secondary">
                Cargando archivos desde el mock…
              </Typography>
            )}
          </Box>
          <Stack spacing={1.5}>
            {archivosOrdenados.map((archivo) => (
              <Paper
                key={archivo.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  borderRadius: 2,
                }}
              >
                <Avatar
                  sx={{ bgcolor: "primary.light", color: "primary.main" }}
                >
                  {archivo.ruta.slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">{archivo.ruta}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Subido el{" "}
                    {new Date(archivo.fecha_subida).toLocaleString("es-CL")}
                    {archivo.esSimulado && " · Simulado"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {archivo.creado_por} — {archivo.comentarios}
                  </Typography>
                </Box>
                {archivo.localUrl && (
                  <IconButton
                    component="a"
                    href={archivo.localUrl}
                    target="_blank"
                    rel="noreferrer"
                    color="primary"
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                )}
              </Paper>
            ))}
            {archivosOrdenados.length === 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                textAlign="center"
              >
                Este taller aún no tiene archivos asociados.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default FileUploader;
