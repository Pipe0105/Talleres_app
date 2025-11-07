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
        backgroundImage: theme.gradients.page,
      })}
    >
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={(theme) => ({
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.customShadows.surface,
        })}
      >
        <Container
          maxWidth={false}
          sx={(theme) => ({
            maxWidth: theme.layout.contentMaxWidth,
            px: { xs: 2, md: 4 },
          })}
        >
          {" "}
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
                  aria-current={item.isActive ? "page" : undefined}
                  sx={{ fontWeight: 600 }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box
        component="main"
        sx={(theme) => ({
          py: theme.layout.pagePaddingY,
        })}
      >
        <Container
          maxWidth={false}
          sx={(theme) => ({
            maxWidth: theme.layout.contentMaxWidth,
            px: { xs: 2, md: 4 },
          })}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default AppLayout;
