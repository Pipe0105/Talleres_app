import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { NewTaller, Producto } from "../types";

interface TallerFormProps {
  productos: Producto[];
  onCreated: (nuevoTaller: NewTaller) => Promise<void>;
}

interface FormState {
  productoId: string;
  fecha: Date | null;
  pesoInicial: string;
  pesoTaller: string;
  grupo: string;
  observaciones: string;
  creadoPor: string;
}

const initialState: FormState = {
  productoId: "",
  fecha: null,
  pesoInicial: "",
  pesoTaller: "",
  grupo: "",
  observaciones: "",
  creadoPor: "",
};

const TallerForm = ({ productos, onCreated }: TallerFormProps) => {
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const productosOptions = useMemo(
    () =>
      productos.map((producto) => ({
        value: producto.id.toString(),
        label: `${producto.nombre} · ${producto.codigo}`,
      })),
    [productos]
  );

  const isDisabled = submitting || productos.length === 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.productoId || !formState.fecha || !formState.pesoTaller) {
      setError("Producto, fecha y peso del taller son obligatorios.");
      return;
    }

    const producto = productos.find(
      (item) => item.id === Number(formState.productoId)
    );

    if (!producto) {
      setError("El producto seleccionado no es válido.");
      return;
    }

    const pesoInicial = formState.pesoInicial
      ? Number.parseFloat(formState.pesoInicial)
      : null;
    const pesoTaller = Number.parseFloat(formState.pesoTaller);

    if (Number.isNaN(pesoTaller)) {
      setError("Debes ingresar un peso de taller numérico.");
      return;
    }

    const rendimiento =
      pesoInicial && pesoInicial > 0
        ? Number((pesoTaller / pesoInicial).toFixed(6))
        : null;

    const nuevoTaller: NewTaller = {
      producto_id: producto.id,
      codigo: producto.codigo,
      fecha: dayjs(formState.fecha).format("DD/MM/YYYY"),
      grupo: formState.grupo || `${producto.nombre.replace(/\s+/g, "_")}_Group`,
      observaciones:
        formState.observaciones || `Taller generado para ${producto.nombre}`,
      peso_inicial: pesoInicial,
      peso_taller: Number(pesoTaller.toFixed(3)),
      rendimiento,
      creado_por: formState.creadoPor || "operario-demo",
    };

    try {
      setSubmitting(true);
      setError(null);
      await onCreated(nuevoTaller);
      setFormState(initialState);
      setSuccessMessage("Taller creado en el mock correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al crear el taller.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper withBorder radius="lg" shadow="sm" p="xl" component="section">
      <Title order={3} size="h4">
        Nuevo taller
      </Title>
      <Text size="sm" c="dimmed" mt="xs">
        Completa el formulario para simular el registro de un nuevo taller en el
        json-server.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack gap="md" mt="lg">
          <Select
            label="Producto"
            placeholder="Selecciona un producto…"
            data={productosOptions}
            value={formState.productoId}
            onChange={(value: string | null) =>
              setFormState((prev) => ({
                ...prev,
                productoId: value ?? "",
              }))
            }
            required
            disabled={isDisabled}
            searchable
            nothingFoundMessage="Sin coincidencias"
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <DateInput
              label="Fecha"
              placeholder="Selecciona una fecha"
              value={formState.fecha}
              onChange={(value: Date | null) =>
                setFormState((prev) => ({
                  ...prev,
                  fecha: value,
                }))
              }
              valueFormat="DD/MM/YYYY"
              required
              disabled={isDisabled}
            />
            <TextInput
              label="Grupo"
              placeholder="Ej. Ampolleta_Group"
              value={formState.grupo}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({
                  ...prev,
                  grupo: event.currentTarget.value,
                }))
              }
              disabled={isDisabled}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Peso inicial (kg)"
              type="number"
              min={0}
              step={0.001}
              placeholder="Ej. 35.2"
              value={formState.pesoInicial}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({
                  ...prev,
                  pesoInicial: event.currentTarget.value,
                }))
              }
              disabled={isDisabled}
            />
            <TextInput
              label="Peso taller (kg)"
              type="number"
              min={0}
              step={0.001}
              placeholder="Ej. 31.8"
              value={formState.pesoTaller}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({
                  ...prev,
                  pesoTaller: event.currentTarget.value,
                }))
              }
              required
              disabled={isDisabled}
            />
          </SimpleGrid>

          <Textarea
            label="Observaciones"
            placeholder="Notas relevantes del taller"
            minRows={3}
            value={formState.observaciones}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setFormState((prev) => ({
                ...prev,
                observaciones: event.currentTarget.value,
              }))
            }
            disabled={isDisabled}
          />

          <TextInput
            label="Operario"
            placeholder="Ej. operario1"
            value={formState.creadoPor}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFormState((prev) => ({
                ...prev,
                creadoPor: event.currentTarget.value,
              }))
            }
            disabled={isDisabled}
          />

          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert color="green" variant="light">
              {successMessage}
            </Alert>
          )}

          <Button
            type="submit"
            color="brand"
            disabled={isDisabled}
            loading={submitting}
            fullWidth
          >
            {productos.length === 0
              ? "Cargando productos…"
              : "Registrar taller"}
          </Button>
          {productos.length === 0 && (
            <Text ta="center" size="xs" c="dimmed">
              Espera a que cargue el listado de productos para habilitar el
              formulario.
            </Text>
          )}
        </Stack>
      </form>
    </Paper>
  );
};

export default TallerForm;
