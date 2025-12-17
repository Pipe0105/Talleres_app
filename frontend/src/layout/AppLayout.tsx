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
import { Tabs, Tab } from "@mui/material";

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
              gap: { xs: 2, md: 3 },
              alignItems: { xs: "flex-start", md: "center" },
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{
                flexGrow: 1,
                width: "100%",
              }}
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
                    Panel Operativo
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={(theme) => ({
                    color: alpha(theme.palette.common.white, 0.86),
                  })}
                >
                  Panel principal para acceder a las herramientas disponibles.
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
                width: "100%",
                overflowX: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
                mt: { xs: 1.5, md: 0 },
              })}
            >
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  flexWrap: "wrap",
                  whiteSpace: "normal",
                  rowGap: 1,
                  justifyContent: { xs: "center", md: "flex-start" },
                  width: "100%",
                }}
              >
                <Tabs
                  value={navItems.findIndex((i) => i.isActive)}
                  variant="standard"
                  sx={(theme) => ({
                    minHeight: 36,
                    width: "100%",
                    overflow: "hidden",
                    "& .MuiTabs-flexContainer": {
                      justifyContent: "space-between",
                    },
                    "& .MuiTabs-indicator": {
                      display: "none",
                    },
                    "& .MuiTab-root": {
                      minHeight: 34,
                      px: 1.4,
                      py: 0.6,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: 999,
                      color: alpha(theme.palette.common.white, 0.85),
                      backgroundColor: alpha(theme.palette.common.white, 0.12),
                      border: `1px solid ${alpha(
                        theme.palette.common.white,
                        0.22
                      )}`,
                      transition: "all .15s ease",
                      whiteSpace: "nowrap",
                      "&.Mui-selected": {
                        color: theme.palette.primary.main,
                        backgroundColor: alpha(
                          theme.palette.common.white,
                          0.95
                        ),
                        borderColor: alpha(theme.palette.common.white, 0.85),
                        boxShadow:
                          "0 12px 24px rgba(4,17,37,0.28), inset 0 1px 0 rgba(255,255,255,0.45)",
                      },
                    },
                  })}
                >
                  {navItems.map((item) => (
                    <Tab
                      key={item.to ?? item.label}
                      label={item.label}
                      component={item.to ? RouterLink : "div"}
                      to={item.to}
                      disableRipple
                    />
                  ))}
                </Tabs>
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
          <Box>{children}</Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AppLayout;
