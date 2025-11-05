import { Link } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const heroMetrics = [
  {
    label: "Órdenes coordinadas",
    value: "350+",
    helper: "desde faena hasta despacho",
  },
  {
    label: "Tiempo de respuesta",
    value: "2.3h",
    helper: "incidentes resueltos promedio",
  },
  {
    label: "Cumplimiento sanitario",
    value: "100%",
    helper: "documentación y certificados al día",
  },
];

const capabilityPillars = [
  {
    icon: "📡",
    title: "Monitoreo en vivo",
    desc: "Sensores e IoT conectados para trazabilidad total.",
  },
  {
    icon: "🤖",
    title: "Automatización inteligente",
    desc: "Flujos que liberan tareas críticas sin intervención manual.",
  },
  {
    icon: "📈",
    title: "Análisis predictivo",
    desc: "KPIs que anticipan cuellos de botella y optimizan rendimiento.",
  },
];

const maturityIndicators = [
  {
    label: "Eficiencia de producción",
    progress: 86,
    helper: "Control de mermas e integración de líneas",
  },
  {
    label: "Cumplimiento normativo",
    progress: 98,
    helper: "Auditorías y registros actualizados",
  },
  {
    label: "Sincronización logística",
    progress: 74,
    helper: "Despachos y cámaras en tiempo real",
  },
];

const testimonials = [
  {
    quote: "Ganamos visibilidad total de la cadena fría en tres plantas.",
    name: "Sandra Ríos",
    role: "Gerente de operaciones",
  },
  {
    quote: "Las alertas predictivas redujeron tiempos muertos en 18%.",
    name: "Ricardo Flores",
    role: "Director de planta",
  },
];

const Home = () => {
  const theme = useMantineTheme();

  return (
    <Container size="xl" py="xl">
      {/* === HERO === */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6 }}
      >
        <Card
          radius="xl"
          padding="xl"
          shadow="xl"
          withBorder
          bg={`linear-gradient(145deg, ${theme.colors.dark[8]}, ${theme.colors.dark[9]})`}
        >
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="md">
                <Group gap="sm">
                  <Badge size="lg" color="brand" variant="light">
                    Plataforma para talleres cárnicos
                  </Badge>
                  <Badge size="lg" variant="outline" color="gray.4">
                    Dashboard operativo
                  </Badge>
                </Group>

                <Title order={1} size="h2" fw={800}>
                  Controla calidad, logística y producción desde un solo panel
                </Title>
                <Text size="lg" c="dimmed" maw={600}>
                  Unifica la trazabilidad sanitaria, los equipos de planta y la
                  toma de decisiones con una vista centralizada y dinámica.
                </Text>

                <Group>
                  <Button
                    component={Link}
                    to="/talleres"
                    color="brand"
                    size="md"
                  >
                    Ver tablero en acción
                  </Button>
                  <Button
                    component="a"
                    href="mailto:contacto@talleres360.com"
                    variant="outline"
                    color="gray.2"
                    size="md"
                  >
                    Hablar con un asesor
                  </Button>
                </Group>

                <Group mt="lg">
                  {heroMetrics.map((m) => (
                    <Paper key={m.label} p="md" radius="md" withBorder>
                      <Stack gap={2}>
                        <Text fw={700} size="xl" c="white">
                          {m.value}
                        </Text>
                        <Text size="sm" c="gray.3">
                          {m.label}
                        </Text>
                        <Text size="xs" c="gray.5">
                          {m.helper}
                        </Text>
                      </Stack>
                    </Paper>
                  ))}
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <Paper
                radius="md"
                withBorder
                p="lg"
                style={{ backdropFilter: "blur(10px)" }}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600} size="sm" c="gray.4">
                        Estado actual
                      </Text>
                      <Text fw={700}>Taller Las Delicias</Text>
                    </div>
                    <Badge color="green" variant="dot" size="lg">
                      Operativo
                    </Badge>
                  </Group>
                  <Divider color="rgba(255,255,255,0.08)" />
                  <Text size="sm" c="gray.3">
                    • Cadena de frío estable • Lotes sanitarios validados • 6
                    alertas resueltas esta semana
                  </Text>
                  <Divider color="rgba(255,255,255,0.08)" />
                  <Stack gap={6}>
                    <Group justify="space-between">
                      <Text size="xs" c="gray.4">
                        Avance diario
                      </Text>
                      <Text size="xs" c="gray.2">
                        82%
                      </Text>
                    </Group>
                    <Progress value={82} radius="xl" color="brand" />
                  </Stack>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Card>
      </motion.div>

      {/* === CAPABILITIES === */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Stack mt="xl">
          <Title order={2} size="h3">
            Capacidades clave
          </Title>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {capabilityPillars.map((p) => (
              <Card
                key={p.title}
                withBorder
                radius="md"
                padding="lg"
                shadow="md"
              >
                <Stack gap="sm">
                  <ThemeIcon
                    color="brand"
                    size={44}
                    radius="md"
                    variant="light"
                  >
                    <Text size="xl">{p.icon}</Text>
                  </ThemeIcon>
                  <Text fw={600}>{p.title}</Text>
                  <Text size="sm" c="gray.4">
                    {p.desc}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </motion.div>

      {/* === MATURITY INDICATORS === */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Stack mt="xl">
          <Title order={2} size="h3">
            Indicadores de madurez operativa
          </Title>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {maturityIndicators.map((ind) => (
              <Card key={ind.label} withBorder radius="md" padding="md">
                <Stack gap={4}>
                  <Group justify="space-between">
                    <Text fw={600}>{ind.label}</Text>
                    <Text c="gray.3">{ind.progress}%</Text>
                  </Group>
                  <Progress value={ind.progress} radius="xl" color="brand" />
                  <Text size="xs" c="gray.4">
                    {ind.helper}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </motion.div>

      {/* === TESTIMONIALS === */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <Stack mt="xl">
          <Title order={2} size="h3">
            Historias reales de impacto
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {testimonials.map((t) => (
              <Card
                key={t.name}
                radius="md"
                padding="lg"
                withBorder
                shadow="md"
              >
                <Text size="sm" c="gray.3" style={{ fontStyle: "italic" }}>
                  “{t.quote}”
                </Text>
                <Divider my="sm" color="rgba(255,255,255,0.1)" />
                <Stack gap={0}>
                  <Text fw={600}>{t.name}</Text>
                  <Text size="xs" c="gray.4">
                    {t.role}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </motion.div>

      {/* === CTA FINAL === */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <Card
          mt="xl"
          radius="xl"
          padding="xl"
          shadow="xl"
          withBorder
          bg={`linear-gradient(135deg, ${theme.colors.brand[6]}, ${theme.colors.dark[8]})`}
        >
          <Stack align="center" ta="center">
            <Title order={2} size="h3" c="white">
              Potencia tus operaciones hoy mismo
            </Title>
            <Text size="sm" c="rgba(255,255,255,0.85)" maw={500}>
              Agenda una sesión con nuestro equipo y descubre cómo digitalizar
              controles, automatizar reportes y mantener la trazabilidad total.
            </Text>
            <Group gap="sm" mt="sm">
              <Button
                component={Link}
                to="/talleres"
                color="dark"
                variant="white"
              >
                Explorar tablero
              </Button>
              <Button
                component="a"
                href="mailto:contacto@talleres360.com"
                variant="filled"
                color="dark"
              >
                Hablar con un asesor
              </Button>
            </Group>
          </Stack>
        </Card>
      </motion.div>
    </Container>
  );
};

export default Home;
