import { ReactNode } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

interface NavItem {
  label: string;
  to?: string;
  isActive?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
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
        elevation={0}
        sx={(theme) => ({
          backgroundColor: theme.palette.primary.main,
          borderRadius: 0,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0px 12px 32px rgba(4, 17, 37, 0.35)",
        })}
      >
        <Container
          maxWidth={false}
          sx={(theme) => ({
            position: "relative",
            maxWidth: theme.layout.contentMaxWidth,
            px: { xs: 2, md: 4 },
          })}
        >
          {" "}
          <Toolbar
            disableGutters
            sx={{
              py: { xs: 2.5, md: 3 },
              gap: 3,
              alignItems: "center",
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ flexGrow: 1 }}
            >
              <Box
                sx={(theme) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: theme.palette.secondary.main,
                  display: "grid",
                  placeItems: "center",
                  color: theme.palette.common.white,
                  boxShadow: "0px 12px 25px rgba(16,178,211,0.3)",
                  border: `2px solid ${alpha(theme.palette.common.white, 0.5)}`,
                })}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  letterSpacing={0.6}
                >
                  TD
                </Typography>
              </Box>
              <Box
                component={RouterLink}
                to="/"
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  "&:hover": { opacity: 0.85 },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 0.25 }}
                >
                  <Typography
                    variant="h6"
                    fontSize={26}
                    fontWeight={800}
                    color="inherit"
                  >
                    Talleres Desposte
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={(theme) => ({
                    color: alpha(theme.palette.common.white, 0.86),
                  })}
                >
                  Un panel especializado para visualizar y registrar talleres de
                  desposte.
                </Typography>
              </Box>
            </Stack>

            <Paper
              elevation={0}
              sx={(theme) => ({
                backgroundColor: alpha(theme.palette.common.white, 0.06),
                border: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
                px: 1.5,
                py: 1,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "100%",
                overflowX: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              })}
            >
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{
                  flexWrap: "nowrap",
                  whiteSpace: "nowrap",
                }}
              >
                {navItems.map((item) => (
                  <Button
                    key={item.to ?? item.label}
                    {...(item.to ? { component: RouterLink, to: item.to } : {})}
                    variant={item.isActive ? "contained" : "text"}
                    color={item.isActive ? "secondary" : "inherit"}
                    aria-current={item.isActive ? "page" : undefined}
                    startIcon={item.icon}
                    sx={(theme) => ({
                      fontWeight: 600,
                      textTransform: "none",
                      gap: 0.75,
                      px: 1.8,
                      py: 0.75,
                      minWidth: "auto",
                      fontSize: "0.86rem",
                      justifyContent: "center",
                      borderRadius: 999,
                      backgroundColor: item.isActive
                        ? alpha(theme.palette.common.white, 0.9)
                        : "transparent",
                      color: item.isActive
                        ? theme.palette.primary.main
                        : theme.palette.common.white,
                      boxShadow: item.isActive
                        ? theme.customShadows.surface
                        : "none",
                      "&:hover": {
                        backgroundColor: item.isActive
                          ? alpha(theme.palette.common.white, 0.9)
                          : alpha(theme.palette.common.white, 0.14),
                      },
                    })}
                    disabled={item.disabled}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Toolbar>
        </Container>
      </AppBar>

      <Box
        component="main"
        sx={(theme) => ({
          py: theme.layout.pagePaddingY,
          backgroundImage: theme.gradients.page,
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
