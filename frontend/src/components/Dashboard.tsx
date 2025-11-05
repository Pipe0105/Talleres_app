import { ChangeEvent, useMemo, useState } from "react";
import {
  Button,
  Card,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Precio, Producto, Taller } from "../types";

interface DashboardProps {
  talleres: Taller[];
  productos: Producto[];
  precios: Precio[];
  selectedTallerId: number | null;
  onSelectTaller?: (tallerId: number) => void;
}

const Dashboard = ({
  talleres,
  productos,
  precios,
  selectedTallerId,
  onSelectTaller,
}: DashboardProps) => {
  const [search, setSearch] = useState("");

  const productoMap = useMemo(
    () =>
      new Map(productos.map((producto) => [producto.id, producto] as const)),
    [productos]
  );

  const precioMap = useMemo(() => {
    const map = new Map<number, Precio>();

    precios.forEach((precio) => {
      const current = map.get(precio.producto_id);
      if (!current) {
        map.set(precio.producto_id, precio);
        return;
      }

      const currentDate = new Date(current.fecha_vigencia_desde).getTime();
      const candidateDate = new Date(precio.fecha_vigencia_desde).getTime();

      if (candidateDate > currentDate) {
        map.set(precio.producto_id, precio);
      }
    });

    return map;
  }, [precios]);

  const filteredTalleres = useMemo(() => {
    if (!search.trim()) {
      return talleres;
    }
    const term = search.toLowerCase();
    return talleres.filter((taller) => {
      const producto = productoMap.get(taller.producto_id);
      return (
        taller.grupo.toLowerCase().includes(term) ||
        taller.observaciones.toLowerCase().includes(term) ||
        producto?.nombre.toLowerCase().includes(term) ||
        producto?.codigo.toString().includes(term)
      );
    });
  }, [search, talleres, productoMap]);

  const resumenPorGrupo = useMemo(() => {
    const map = new Map<
      string,
      {
        totalPeso: number;
        totalRendimiento: number;
        cantidad: number;
        conRendimiento: number;
      }
    >();

    filteredTalleres.forEach((taller) => {
      const entry = map.get(taller.grupo) ?? {
        totalPeso: 0,
        totalRendimiento: 0,
        cantidad: 0,
        conRendimiento: 0,
      };
      entry.totalPeso += taller.peso_taller;
      if (typeof taller.rendimiento === "number") {
        entry.totalRendimiento += taller.rendimiento;
        entry.conRendimiento += 1;
      }
      entry.cantidad += 1;
      map.set(taller.grupo, entry);
    });

    return Array.from(map.entries()).map(([grupo, valores]) => ({
      grupo,
      totalPeso: valores.totalPeso,
      rendimientoPromedio:
        valores.conRendimiento > 0
          ? valores.totalRendimiento / valores.conRendimiento
          : null,
      cantidad: valores.cantidad,
    }));
  }, [filteredTalleres]);

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {resumenPorGrupo.map((grupo) => (
          <Card key={grupo.grupo} withBorder radius="md" shadow="xs" p="lg">
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Grupo
            </Text>
            <Title order={3} size="h4" mt={4}>
              {grupo.grupo.replace(/_/g, " ")}
            </Title>
            <Stack gap={4} mt="md">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Registros
                </Text>
                <Text fw={600}>{grupo.cantidad}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Peso total
                </Text>
                <Text fw={600}>{grupo.totalPeso.toFixed(2)} kg</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Rendimiento medio
                </Text>
                <Text fw={600}>
                  {grupo.rendimientoPromedio
                    ? `${(grupo.rendimientoPromedio * 100).toFixed(2)}%`
                    : "Sin datos"}
                </Text>
              </Group>
            </Stack>
          </Card>
        ))}
        {resumenPorGrupo.length === 0 && (
          <Paper withBorder radius="md" p="lg">
            <Text size="sm" c="dimmed">
              No se encontraron registros para el filtro aplicado.
            </Text>
          </Paper>
        )}
      </SimpleGrid>

      <Stack gap="md">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          <Title order={3} size="h4">
            Detalle de talleres
          </Title>
          <TextInput
            placeholder="Buscar por grupo, producto o código"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSearch(event.currentTarget.value)
            }
            maw={340}
          />
        </Group>
        <Paper withBorder radius="lg" shadow="sm">
          <ScrollArea>
            <Table
              striped
              highlightOnHover
              verticalSpacing="sm"
              horizontalSpacing="md"
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Producto</Table.Th>
                  <Table.Th>Grupo</Table.Th>
                  <Table.Th>Peso inicial</Table.Th>
                  <Table.Th>Peso taller</Table.Th>
                  <Table.Th>Rendimiento</Table.Th>
                  <Table.Th>Precio unitario</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredTalleres.map((taller) => {
                  const producto = productoMap.get(taller.producto_id);
                  const precio = precioMap.get(taller.producto_id);
                  const isSelected = selectedTallerId === taller.id;

                  return (
                    <Table.Tr
                      key={taller.id}
                      bg={
                        isSelected ? "var(--mantine-color-brand-0)" : undefined
                      }
                    >
                      <Table.Td fw={500}>
                        {new Date(taller.fecha).toLocaleDateString("es-CL")}
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>
                          {producto?.nombre ?? "Producto desconocido"}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Código {taller.codigo}
                        </Text>
                      </Table.Td>
                      <Table.Td>{taller.grupo.replace(/_/g, " ")}</Table.Td>
                      <Table.Td>
                        {taller.peso_inicial
                          ? `${taller.peso_inicial} kg`
                          : "—"}
                      </Table.Td>
                      <Table.Td>{taller.peso_taller} kg</Table.Td>
                      <Table.Td>
                        {typeof taller.rendimiento === "number"
                          ? `${(taller.rendimiento * 100).toFixed(2)}%`
                          : "—"}
                      </Table.Td>
                      <Table.Td>
                        {precio
                          ? new Intl.NumberFormat("es-CL", {
                              style: "currency",
                              currency: "CLP",
                            }).format(precio.precio_unitario)
                          : "—"}
                      </Table.Td>
                      <Table.Td>
                        {onSelectTaller && (
                          <Button
                            size="xs"
                            variant={isSelected ? "filled" : "light"}
                            color="brand"
                            onClick={() => onSelectTaller(taller.id)}
                          >
                            {isSelected ? "Seleccionado" : "Ver detalle"}
                          </Button>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {filteredTalleres.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      <Text ta="center" size="sm" c="dimmed">
                        No hay talleres que coincidan con tu búsqueda.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      </Stack>
    </Stack>
  );
};

export default Dashboard;
