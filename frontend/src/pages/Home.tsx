import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Code,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Timeline,
  Title,
} from "@mantine/core";

const featureCards = [
  {
    title: "Mock API lista para usar",
    description:
      "Datos listos para pruebas rápidas gracias a json-server y al archivo mock/db.json incluido en el repositorio.",
    icon: "🗂️",
  },
  {
    title: "UI moderna con Mantine",
    description:
      "Componentes accesibles, coherentes y fáciles de personalizar para crear vistas profesionales sin esfuerzo.",
    icon: "🎨",
  },
  {
    title: "Ruteo con React Router",
    description:
      "Navega entre el inicio y el tablero de talleres con rutas de cliente simples y fluidas.",
    icon: "🧭",
  },
  {
    title: "Tipado con TypeScript",
    description:
      "Autocompletado y validaciones para mantener la calidad del código durante todo el desarrollo.",
    icon: "🛡️",
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

const stats = [
  { label: "Talleres mock", value: "12" },
  { label: "Categorías cubiertas", value: "6" },
  { label: "Archivos adjuntos", value: "20+" },
];

const quickLinks = [
  {
    label: "Ver talleres",
    description:
      "Explora y filtra los registros disponibles en la tabla interactiva.",
    action: (
      <Button component={Link} to="/talleres" color="brand" fullWidth>
        Ir al tablero
      </Button>
    ),
  },
  {
    label: "Documentación",
    description:
      "Revisa los componentes de Mantine para extender la interfaz a tu medida.",
    action: (
      <Button
        component="a"
        href="https://mantine.dev/"
        target="_blank"
        rel="noreferrer"
        variant="light"
        color="brand"
        fullWidth
      >
        Abrir Mantine
      </Button>
    ),
  },
  {
    label: "Datos mock",
    description: "Consulta la estructura y contenido base en mock/db.json.",
    action: (
      <Button
        component="a"
        href="/mock/db.json"
        target="_blank"
        rel="noreferrer"
        variant="outline"
        color="brand"
        fullWidth
      >
        Abrir archivo
      </Button>
    ),
  },
];
const Home = () => {
  return (
    <Stack gap="xl">
      <Card
        radius="xl"
        padding="xl"
        withBorder
        shadow="md"
        bg="linear-gradient(135deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-brand-8) 60%, #172554 100%)"
        style={{ color: "var(--mantine-color-white)" }}
      >
        <Stack gap="md">
          <Group gap="xs">
            <Badge color="white" variant="light" radius="sm">
              Entorno demo
            </Badge>
          </Group>
          <Title order={1} size="h2" fw={700}>
            Gestiona talleres cárnicos con una experiencia cuidada
          </Title>
          <Text size="md" maw={600} c="rgba(255,255,255,0.85)">
            Centraliza la información de los talleres, prueba flujos de registro
            y experimenta con datos ficticios en un panel moderno construido con
            Mantine.
          </Text>
          <Group gap="sm" wrap="wrap">
            <Button
              component={Link}
              to="/talleres"
              color="dark"
              variant="filled"
            >
              Explorar talleres
            </Button>
            <Button
              component="a"
              href="https://mantine.dev/"
              target="_blank"
              rel="noreferrer"
              variant="white"
              color="dark"
            >
              Conocer Mantine
            </Button>
          </Group>
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            withBorder
            radius="lg"
            padding="lg"
            shadow="sm"
          >
            <Text size="sm" c="dimmed">
              {stat.label}
            </Text>
            <Title order={3} mt="xs">
              {stat.value}
            </Title>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Card withBorder radius="lg" padding="xl" shadow="sm">
          <Title order={3} size="h4">
            Inicia en minutos
          </Title>
          <Timeline color="brand" active={quickStartSteps.length} mt="lg">
            {quickStartSteps.map((step) => (
              <Timeline.Item key={step.title} title={step.title}>
                <Text size="sm" c="dimmed">
                  {step.description}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>

        <Stack gap="lg">
          <Card withBorder radius="lg" padding="xl" shadow="sm">
            <Title order={3} size="h4">
              Acciones rápidas
            </Title>
            <SimpleGrid cols={1} mt="md" spacing="md">
              {quickLinks.map((link) => (
                <Card key={link.label} withBorder radius="md" padding="md">
                  <Stack gap="xs">
                    <Text fw={600}>{link.label}</Text>
                    <Text size="sm" c="dimmed">
                      {link.description}
                    </Text>
                    {link.action}
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Card>

          <Card withBorder radius="lg" padding="xl" shadow="sm">
            <Title order={3} size="h4">
              Recursos útiles
            </Title>
            <Text size="sm" mt="sm" c="dimmed">
              Consulta los endpoints disponibles en{" "}
              <Code>frontend/mock/db.json</Code>, explora los componentes
              compartidos en <Code>src/components</Code> y continúa el
              desarrollo siguiendo el estilo del tema global.
            </Text>
          </Card>
        </Stack>
      </SimpleGrid>

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Title order={3} size="h4" mb="md">
          Características destacadas
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {featureCards.map((card) => (
            <Card key={card.title} withBorder radius="md" padding="lg">
              <ThemeIcon color="brand" variant="light" size={44} radius="md">
                <Text size="lg">{card.icon}</Text>
              </ThemeIcon>
              <Stack gap="xs" mt="md">
                <Text fw={600}>{card.title}</Text>
                <Text size="sm" c="dimmed">
                  {card.description}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Card>
    </Stack>
  );
};

export default Home;
