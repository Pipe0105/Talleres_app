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
          background: `linear-gradient(
      120deg,
      ${theme.palette.primary.main} 0%,
      #0a1f44 55%,
      #041125 100%
    )`,
          backdropFilter: "blur(14px)",
          borderRadius: 0,
          borderBottom: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0px 6px 22px rgba(0,0,0,0.35)",
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
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: theme.gradients.callout,
                  display: "grid",
                  placeItems: "center",
                  color: theme.palette.common.white,
                  boxShadow: theme.customShadows.frosted,
                  border: `1px solid ${alpha(
                    theme.palette.common.white,
                    0.25
                  )}`,
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
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 0.25 }}
                >
                  <Typography
                    variant="h6"
                    fontSize={30}
                    fontWeight={700}
                    color="inherit"
                  >
                    Talleres Desposte
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ color: alpha("#f2f7ffff", 0.9) }}
                >
                  Un panel especializado para visualizar y registrar talleres de
                  desposte.
                </Typography>
              </Box>
            </Stack>

            <Paper
              elevation={0}
              sx={(theme) => ({
                backgroundColor: alpha(theme.palette.common.white, 0.12),
                border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                backdropFilter: "blur(10px)",
                px: 0.75,
                py: 0.5,
                borderRadius: 999,
                boxShadow: theme.customShadows.surface,
              })}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                {navItems.map((item) => (
                  <Button
                    key={item.to ?? item.label}
                    {...(item.to ? { component: RouterLink, to: item.to } : {})}
                    variant={item.isActive ? "contained" : "text"}
                    color={item.isActive ? "secondary" : "inherit"}
                    aria-current={item.isActive ? "page" : undefined}
                    startIcon={item.icon}
                    sx={(theme) => ({
                      fontWeight: 700,
                      gap: 1,
                      px: 1.75,
                      borderRadius: 999,
                      backgroundColor: item.isActive
                        ? "rgba(255, 255, 255, 0.70)"
                        : "transparent",
                      backdropFilter: item.isActive ? "blur(2px)" : "none",

                      color: item.isActive
                        ? theme.palette.primary.main
                        : theme.palette.common.white,
                      cursor: item.disabled ? "default" : undefined,
                      pointerEvents: item.disabled ? "none" : undefined,
                      "&.Mui-disabled": {
                        color: theme.palette.common.white,
                        opacity: 1,
                      },
                      boxShadow: item.isActive
                        ? theme.customShadows.surface
                        : "none",
                      "&:hover": {
                        backgroundColor: item.isActive
                          ? alpha(theme.palette.common.white, 0.92)
                          : alpha(theme.palette.common.white, 0.12),
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
