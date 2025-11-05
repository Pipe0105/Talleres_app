import { Link } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Timeline,
  Title,
  useMantineTheme,
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
  {
    label: "Proyectos gestionados",
    value: "30+",
    helper: "Entre plantas y sucursales",
  },
  {
    label: "Colaboradores conectados",
    value: "120",
    helper: "Equipos en línea y en planta",
  },
  {
    label: "Alertas automatizadas",
    value: "50+",
    helper: "Recordatorios operativos activos",
  },
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

const testimonials = [
  {
    quote:
      "La plataforma nos permitió coordinar producción, logística y calidad desde un único panel. Hoy reaccionamos antes a cualquier incidencia.",
    name: "Sandra Ríos",
    role: "Gerente de operaciones, Cárnicos del Sur",
  },
  {
    quote:
      "El seguimiento en tiempo real y las alertas automáticas redujeron tiempos muertos en un 18% durante el primer trimestre.",
    name: "Ricardo Flores",
    role: "Director de planta, Frío Express",
  },
];

const supportHighlights = [
  {
    title: "Acompañamiento experto",
    description:
      "Configura indicadores y flujos con la guía de consultores especializados en la industria cárnica.",
  },
  {
    title: "Integraciones seguras",
    description:
      "Conecta tu ERP, sensores IoT o sistemas de trazabilidad para lograr una visión 360°.",
  },
  {
    title: "Soporte continuo",
    description:
      "Recibe asistencia prioritaria y entrenamientos personalizados para mantener a tu equipo alineado.",
  },
];

const Home = () => {
  const theme = useMantineTheme();

  return (
    <Stack gap="xl">
      <Card
        radius="xl"
        padding="xl"
        withBorder
        shadow="lg"
        bg="linear-gradient(130deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-brand-8) 55%, #0f172a 100%)"
        style={{
          color: "var(--mantine-color-white)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          component="span"
          style={{
            position: "absolute",
            inset: "auto -35% -60px auto",
            width: "340px",
            height: "340px",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.24) 0%, transparent 65%)",
            transform: "rotate(12deg)",
          }}
        />
        <Stack gap="lg" pos="relative">
          <Group gap="sm" wrap="wrap">
            <Badge color="white" variant="light" radius="sm">
              Entorno demo guiado
            </Badge>
            <Badge
              color="dark"
              variant="filled"
              radius="sm"
              bg="rgba(15,23,42,0.4)"
            >
              Industria cárnica
            </Badge>
          </Group>
          <Stack gap="sm">
            <Title order={1} size="h1" fw={700} lh={1.1}>
              Operaciones cárnicas con foco en datos y coordinación ágil
            </Title>
            <Text size="lg" maw={620} c="rgba(255,255,255,0.82)">
              Integra producción, calidad y logística en una sola plataforma.
              Diseñada para equipos que necesitan visibilidad en tiempo real y
              decisiones confiables.
            </Text>
          </Stack>
          <Group gap="sm" wrap="wrap">
            <Button
              component={Link}
              to="/talleres"
              color="dark"
              variant="filled"
              size="md"
            >
              Explorar tablero de talleres
            </Button>
            <Button
              component="a"
              href="#demo"
              variant="white"
              color="dark"
              size="md"
            >
              Solicitar demo personalizada
            </Button>
          </Group>
        </Stack>
      </Card>

      <Grid gutter="lg">
        {stats.map((stat) => (
          <Grid.Col key={stat.label} span={{ base: 12, sm: 4 }}>
            <Card withBorder radius="lg" padding="lg" shadow="sm">
              <Text size="sm" c="dimmed">
                {stat.label}
              </Text>
              <Title order={2} mt="xs">
                {stat.value}
              </Title>
              <Text size="xs" c="dimmed">
                {stat.helper}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Grid gutter="xl" align="stretch">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack h="100%" justify="space-between" gap="lg">
              <div>
                <Group gap="xs">
                  <Badge variant="light" color="brand" radius="sm">
                    Implementación guiada
                  </Badge>
                </Group>
                <Title order={2} size="h3" mt="md">
                  Cómo se adapta a tu operación
                </Title>
                <Text size="sm" c="dimmed" mt="sm">
                  Sigue un flujo claro para incorporar tus talleres, alinear a
                  los equipos y comenzar a automatizar tareas críticas.
                </Text>
              </div>
              <Timeline
                color="brand"
                active={quickStartSteps.length}
                bulletSize={20}
                lineWidth={2}
              >
                {quickStartSteps.map((step) => (
                  <Timeline.Item
                    key={step.title}
                    title={<Text fw={600}>{step.title}</Text>}
                  >
                    <Text size="sm" c="dimmed">
                      {step.description}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="lg" h="100%">
              <Paper radius="md" p="lg" withBorder>
                <Title order={4} size="h4">
                  Acciones rápidas
                </Title>
                <SimpleGrid cols={1} mt="md" spacing="sm">
                  {quickLinks.map((link) => (
                    <Card key={link.label} withBorder radius="md" padding="md">
                      <Stack gap={6}>
                        <Text fw={600}>{link.label}</Text>
                        <Text size="sm" c="dimmed">
                          {link.description}
                        </Text>
                        {link.action}
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Paper>
              <Paper id="recursos" radius="md" p="lg" withBorder>
                <Title order={4} size="h4">
                  ¿Por qué elegirnos?
                </Title>
                <Text size="sm" mt="sm" c="dimmed">
                  Somos aliados de productores que buscan estandarizar procesos,
                  asegurar la trazabilidad sanitaria y potenciar la
                  productividad de sus equipos. Contáctanos para recibir un plan
                  adaptado a tu operación.
                </Text>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Card>

      <Stack gap="lg">
        <Title order={2} size="h3">
          Beneficios clave para tu equipo
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {featureCards.map((card) => (
            <Card
              key={card.title}
              withBorder
              radius="md"
              padding="lg"
              shadow="xs"
            >
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
      </Stack>

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Grid gutter="lg" align="stretch">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <Title order={2} size="h3">
                Acompañamos cada paso
              </Title>
              <Text size="sm" c="dimmed">
                Nuestro equipo combina experiencia técnica y conocimiento del
                sector para implementar procesos sólidos, sin interrumpir tu
                operación diaria.
              </Text>
              <Stack gap="md">
                {supportHighlights.map((item) => (
                  <Card key={item.title} withBorder padding="md" radius="md">
                    <Text fw={600}>{item.title}</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {item.description}
                    </Text>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="md">
              <Title order={3} size="h4">
                Historias de éxito
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {testimonials.map((testimonial) => (
                  <Card
                    key={testimonial.name}
                    radius="md"
                    padding="lg"
                    withBorder
                    shadow="xs"
                  >
                    <Text size="sm" c="dimmed" style={{ fontStyle: "italic" }}>
                      “{testimonial.quote}”
                    </Text>
                    <Divider my="sm" />
                    <Stack gap={0}>
                      <Text fw={600}>{testimonial.name}</Text>
                      <Text size="xs" c="dimmed">
                        {testimonial.role}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </Stack>
          </Grid.Col>
        </Grid>
      </Card>

      <Card
        radius="xl"
        padding="xl"
        shadow="lg"
        withBorder
        bg={`linear-gradient(135deg, ${theme.colors.brand[5]} 0%, ${theme.colors.brand[7]} 45%, #0b1120 100%)`}
        style={{
          color: "var(--mantine-color-white)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          component="span"
          style={{
            position: "absolute",
            inset: "-40px auto auto -50px",
            width: "320px",
            height: "320px",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
            filter: "blur(0.3px)",
          }}
        />
        <Stack gap="sm" pos="relative">
          <Title order={2} size="h3">
            Empieza hoy con Talleres Cárnicos 360°
          </Title>
          <Text size="sm" c="rgba(255,255,255,0.82)" maw={520}>
            Agenda una demostración con nuestro equipo y descubre cómo
            automatizar reportes, estandarizar la producción y mantener el
            control sanitario al día.
          </Text>
          <Group gap="sm" wrap="wrap">
            <Button
              component={Link}
              to="/talleres"
              variant="white"
              color="dark"
            >
              Ver tablero en acción
            </Button>
            <Button
              component="a"
              href="mailto:contacto@talleres360.com"
              color="dark"
              variant="filled"
            >
              Hablar con un asesor
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};

export default Home;
