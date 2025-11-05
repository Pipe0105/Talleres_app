import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
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
    title: "Panel intuitivo",
    description:
      "Visualiza el estado de cada taller con métricas claras, filtros inteligentes y una navegación pensada para equipos operativos.",
    icon: "📊",
  },
  {
    title: "Gestión centralizada",
    description:
      "Concentra fichas de proveedores, pedidos y documentación en un solo lugar para asegurar trazabilidad en cada proceso.",
    icon: "🗂️",
  },
  {
    title: "Alertas oportunas",
    description:
      "Recibe recordatorios sobre entregas, vencimientos sanitarios y necesidades de abastecimiento antes de que se conviertan en urgencias.",
    icon: "🔔",
  },
  {
    title: "Colaboración ágil",
    description:
      "Comparte actualizaciones con tu equipo y coordina acciones en tiempo real para mantener la producción siempre alineada.",
    icon: "🤝",
  },
];

const quickStartSteps = [
  {
    title: "Registra tus talleres",
    description:
      "Carga la información esencial de cada planta y personaliza los indicadores clave según tu operación.",
  },
  {
    title: "Monitorea la operación",
    description:
      "Consulta dashboards claros, agenda actividades y mantén a tu equipo informado con actualizaciones constantes.",
  },
  {
    title: "Optimiza decisiones",
    description:
      "Identifica tendencias de producción, controla el inventario y toma decisiones basadas en datos confiables.",
  },
];

const stats = [
  { label: "Proyectos gestionados", value: "30+" },
  { label: "Colaboradores conectados", value: "120" },
  { label: "Alertas automatizadas", value: "50+" },
];

const quickLinks = [
  {
    label: "Explora el tablero",
    description:
      "Accede a la vista principal y descubre cómo organizamos la información de cada taller.",
    action: (
      <Button component={Link} to="/talleres" color="brand" fullWidth>
        Ir al tablero
      </Button>
    ),
  },
  {
    label: "Solicita una demostración",
    description:
      "Coordina una sesión guiada con nuestro equipo para adaptar la plataforma a tus procesos.",
    action: (
      <Button
        component="a"
        href="mailto:contacto@talleres360.com"
        variant="light"
        color="brand"
        fullWidth
      >
        Escribir ahora
      </Button>
    ),
  },
  {
    label: "Recursos para tu equipo",
    description:
      "Descarga material de buenas prácticas y casos de éxito de organizaciones similares a la tuya.",
    action: (
      <Button
        component="a"
        href="#recursos"
        variant="outline"
        color="brand"
        fullWidth
      >
        Ver recursos
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
            Centraliza la información de tus operaciones, acompaña al equipo en
            cada etapa y toma decisiones informadas con una plataforma diseñada
            para la industria cárnica.
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
            <Button component="a" href="#demo" variant="white" color="dark">
              Solicitar demo
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
            Cómo funciona
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

          <Card id="recursos" withBorder radius="lg" padding="xl" shadow="sm">
            <Title order={3} size="h4">
              ¿Por qué elegirnos?
            </Title>
            <Text size="sm" mt="sm" c="dimmed">
              Somos aliados de productores que buscan estandarizar procesos,
              asegurar la trazabilidad sanitaria y potenciar la productividad de
              sus equipos. Contáctanos para recibir un plan adaptado a tu
              operación.
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
