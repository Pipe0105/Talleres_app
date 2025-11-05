import { AppShell, Button, Container, Group, Text, Title } from "@mantine/core";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Talleres from "./pages/Talleres";

const App = () => {
  const location = useLocation();

  const navItems = [
    { label: "Inicio", to: "/", isActive: location.pathname === "/" },
    {
      label: "Talleres",
      to: "/talleres",
      isActive: location.pathname.startsWith("/talleres"),
    },
  ];

  return (
    <AppShell header={{ height: 88 }} padding="xl">
      <AppShell.Header
        style={{
          backdropFilter: "blur(12px)",
          background: "rgba(255, 255, 255, 0.9)",
          borderBottom: "1px solid var(--mantine-color-gray-3)",
        }}
      >
        {" "}
        <Container size="lg" h="100%">
          <Group justify="space-between" align="center" h="100%">
            <div>
              <Title order={1} size="h3">
                Talleres Cárnicos
              </Title>
              <Text size="sm" c="dimmed">
                Panel para visualizar y registrar talleres usando el mock JSON
              </Text>
            </div>
            <Group gap="xs">
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={Link}
                  to={item.to}
                  variant={item.isActive ? "filled" : "subtle"}
                  color="brand"
                  size="sm"
                >
                  {item.label}
                </Button>
              ))}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main
        style={{
          background:
            "linear-gradient(180deg, var(--mantine-color-gray-1) 0%, var(--mantine-color-white) 40%)",
        }}
      >
        <Container size="lg" py="xl">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/talleres" element={<Talleres />} />
          </Routes>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default App;
