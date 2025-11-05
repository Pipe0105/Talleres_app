import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Code,
  Group,
  List,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";

const featureCards = [
  {
    title: "Mock API lista para usar",
    description:
      "Los datos provienen de json-server utilizando el archivo mock/db.json, ideal para prototipar rápidamente.",
  },
  {
    title: "UI moderna con Mantine",
    description:
      "La interfaz se construye con componentes accesibles y personalizables de Mantine para mantener un estilo consistente.",
  },
  {
    title: "Ruteo con React Router",
    description:
      "Navega entre la página de inicio y el tablero de talleres utilizando rutas de cliente simples.",
  },
  {
    title: "Tipado con TypeScript",
    description:
      "El proyecto completo está escrito en TypeScript para contar con autocompletado y validaciones en tiempo de desarrollo.",
  },
];

const quickStartSteps = [
  {
    title: "Instala dependencias",
    description:
      'Ejecuta "npm install" dentro de la carpeta frontend para descargar todas las dependencias del proyecto.',
  },
  {
    title: "Levanta el mock de datos",
    description:
      'Inicia json-server con "npx json-server --watch mock/db.json --port 3001" para exponer los endpoints mockeados.',
  },
  {
    title: "Inicia la app",
    description:
      'Corre "npm run dev" y visita http://localhost:5173 para explorar los talleres desde tu navegador.',
  },
];
const Home = () => {
  return (
    <Stack gap="xl">
      <Card withBorder radius="lg" shadow="sm" padding="xl">
        <Stack gap="sm">
          <Title order={2}>Bienvenido al panel de Talleres</Title>
          <Text size="sm" c="dimmed">
            Explora la información de talleres cárnicos, administra archivos
            asociados y crea nuevos registros en un entorno seguro con datos
            simulados.
          </Text>
          <Group gap="sm">
            <Button component={Link} to="/talleres" color="brand">
              Ver talleres
            </Button>
            <Button
              component="a"
              href="https://mantine.dev/"
              target="_blank"
              rel="noreferrer"
              variant="light"
            >
              Documentación de Mantine
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Title order={3} size="h4">
          Guía rápida
        </Title>
        <List spacing="lg" mt="md">
          {quickStartSteps.map((step, index) => (
            <List.Item
              key={step.title}
              icon={
                <ThemeIcon color="brand" radius="xl" size={26}>
                  {index + 1}
                </ThemeIcon>
              }
            >
              <Stack gap={4}>
                <Text fw={600}>{step.title}</Text>
                <Text size="sm" c="dimmed">
                  {step.description}
                </Text>
              </Stack>
            </List.Item>
          ))}
        </List>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {featureCards.map((card) => (
          <Card
            key={card.title}
            withBorder
            padding="lg"
            radius="md"
            shadow="sm"
          >
            <Title order={4} size="h5" c="brand.7">
              {card.title}
            </Title>
            <Text size="sm" mt="sm" c="dimmed">
              {card.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <Card withBorder radius="md" padding="lg" shadow="sm">
        <Title order={4} size="h5">
          Recursos útiles
        </Title>
        <Text size="sm" mt="sm" c="dimmed">
          Consulta los endpoints disponibles en{" "}
          <Code>frontend/mock/db.json</Code> y revisa los componentes
          compartidos en <Code>src/components</Code> para extender el panel
          según tus necesidades.
        </Text>
      </Card>
    </Stack>
  );
};

export default Home;
