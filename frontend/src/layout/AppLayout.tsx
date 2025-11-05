import { ReactNode } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

interface NavItem {
  label: string;
  to: string;
  isActive?: boolean;
}

interface AppLayoutProps {
  navItems: NavItem[];
  children: ReactNode;
}

export const AppLayout = ({ navItems, children }: AppLayoutProps) => {
  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        bgcolor: "background.default",
        backgroundImage: `linear-gradient(180deg, ${theme.palette.grey[100]} 0%, ${theme.palette.background.default} 40%)`,
      })}
    >
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={(theme) => ({
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 2, gap: 3 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                Talleres Cárnicos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Panel para visualizar y registrar talleres usando el mock JSON
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  variant={item.isActive ? "contained" : "text"}
                  color={item.isActive ? "primary" : "inherit"}
                  sx={{ fontWeight: 600 }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ py: { xs: 4, md: 6 } }}>
        <Container maxWidth="xl">{children}</Container>
      </Box>
    </Box>
  );
};

export default AppLayout;
