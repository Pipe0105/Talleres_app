import { Card, Code, SimpleGrid, Stack, Text, Title } from "@mantine/core";

const Home = () => {
  return (
    <Stack gap="lg">
      <Card withBorder radius="lg" shadow="sm" padding="xl">
        <Title order={2}>Bienvenido al panel de Talleres</Title>
        <Text size="sm" mt="md">
          Este panel consume el JSON mockeado expuesto mediante json-server.
          Desde aquí podrás explorar los talleres registrados, revisar sus
          archivos asociados, verificar precios de productos y generar nuevos
          registros de manera simulada.
        </Text>
      </Card>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <Card withBorder padding="lg" radius="md" shadow="sm">
          <Title order={3} size="h4" c="brand.7">
            Mock API
          </Title>
          <Text size="sm" mt="sm" c="dimmed">
            Utiliza <Code>json-server</Code> sobre{" "}
            <Code>frontend/mock/db.json</Code> para entregar los datos de
            talleres, productos, precios y archivos.
          </Text>
        </Card>
        <Card withBorder padding="lg" radius="md" shadow="sm">
          <Title order={3} size="h4" c="brand.7">
            Mantine UI
          </Title>
          <Text size="sm" mt="sm" c="dimmed">
            La interfaz está construida con Mantine, aprovechando componentes
            accesibles y tematizables para mantener un diseño consistente.
          </Text>
        </Card>
        <Card withBorder padding="lg" radius="md" shadow="sm">
          <Title order={3} size="h4" c="brand.7">
            React Router
          </Title>
          <Text size="sm" mt="sm" c="dimmed">
            Navega entre la página de inicio y el tablero de talleres utilizando
            rutas cliente simples.
          </Text>
        </Card>
      </SimpleGrid>
    </Stack>
  );
};

export default Home;
