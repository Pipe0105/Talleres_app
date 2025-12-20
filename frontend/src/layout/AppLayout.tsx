import { ReactNode, useMemo } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HistoryEduRoundedIcon from "@mui/icons-material/HistoryEduRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ViewTimelineRoundedIcon from "@mui/icons-material/ViewTimelineRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import StoreMallDirectoryOutlinedIcon from "@mui/icons-material/StoreMallDirectoryOutlined";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useAuth } from "../context/AuthContext";

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
  const drawerWidth = 260;
  const { user } = useAuth();

  const navigationSections = useMemo(
    () => [
      {
        title: "Principal",
        items: navItems.filter((item) =>
          ["Talleres", "Talleres+", "Seguimiento", "Informes"].includes(item.label)
        ),
      },
      {
        title: "Gestión",
        items: navItems.filter((item) => ["Inventario", "Lista de precios"].includes(item.label)),
      },
      {
        title: "Configuración",
        items: navItems.filter((item) => ["Usuario", "Iniciar sesión"].includes(item.label)),
      },
    ],
    [navItems]
  );

  const getIconForLabel = (label: string) => {
    switch (label) {
      case "Talleres":
        return <DashboardRoundedIcon />;
      case "Talleres+":
        return <TimelineRoundedIcon />;
      case "Seguimiento":
        return <ViewTimelineRoundedIcon />;
      case "Informes":
        return <HistoryEduRoundedIcon />;
      case "Inventario":
        return <Inventory2OutlinedIcon />;
      case "Lista de precios":
        return <ListAltRoundedIcon />;
      case "Usuario":
        return <PeopleAltOutlinedIcon />;
      case "Iniciar sesión":
        return <PeopleAltOutlinedIcon />;
      default:
        return <StoreMallDirectoryOutlinedIcon />;
    }
  };

  const displayName = user?.full_name?.trim() || user?.email || "Invitado";

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        bgcolor: "background.default",
        backgroundImage: theme.gradients.page,
      })}
    >
      <AppBar
        position="fixed"
        elevation={0}
        color="transparent"
        sx={(theme) => ({
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
          backdropFilter: "blur(10px)",
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          boxShadow: "0px 10px 30px rgba(15,23,42,0.08)",
        })}
      >
        <Toolbar
          sx={{
            px: { xs: 2, md: 4 },
            gap: 2,
            minHeight: 80,
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton color="inherit" edge="start" component={RouterLink} to="/">
              <MenuRoundedIcon />
            </IconButton>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              component={RouterLink}
              to="/"
              sx={{ color: "inherit", textDecoration: "none" }}
            >
              <Box
                sx={(theme) => ({
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: theme.palette.primary.main,
                  display: "grid",
                  placeItems: "center",
                  color: theme.palette.common.white,
                  boxShadow: "0px 18px 36px rgba(0,178,144,0.25)",
                })}
              >
                <Typography variant="subtitle1" fontWeight={800}>
                  TD
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Panel Operativo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gestión de Talleres
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Paper
            sx={(theme) => ({
              px: 2.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: { xs: "45%", md: "50%" },
              maxWidth: 620,
              borderRadius: 999,
              border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              boxShadow: "0px 12px 32px rgba(15,23,42,0.08)",
            })}
            variant="outlined"
          >
            <SearchRoundedIcon color="disabled" />
            <InputBase
              fullWidth
              placeholder="Buscar talleres, reportes, precios..."
              sx={{ fontWeight: 600 }}
            />
          </Paper>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              color="primary"
              size="medium"
              component={RouterLink}
              to="/talleres"
              startIcon={<AddCircleRoundedIcon />}
              sx={{ borderRadius: 999, px: 2.5, fontWeight: 700 }}
            >
              Nuevo Taller
            </Button>
            <IconButton size="large" component={RouterLink} to="/talleres/seguimiento">
              <Badge color="secondary" variant="dot">
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>
            <Paper
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.75,
                height: 60,
                borderRadius: 999,
                border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                boxShadow: "0px 10px 24px rgba(15,23,42,0.08)",
                backgroundColor: alpha(theme.palette.background.paper, 0.96),
              })}
            >
              <Avatar
                sx={(theme) => ({
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(theme.palette.primary.main, 0.18),
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                })}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrador
                </Typography>
              </Box>
              <IconButton size="small" component={RouterLink} to="/perfil">
                <SettingsOutlinedIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex" }}>
        <Box
          component="aside"
          sx={(theme) => ({
            width: drawerWidth,
            position: "fixed",
            top: 80,
            left: 0,
            bottom: 0,
            borderRight: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.96),
            backdropFilter: "blur(8px)",
            px: 2.5,
            py: 3,
            display: { xs: "none", md: "block" },
          })}
        >
          <Stack spacing={4} height="100%">
            {navigationSections.map(
              (section) =>
                section.items.length > 0 && (
                  <Box key={section.title}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, letterSpacing: 0.5, mb: 1.5 }}
                      display="block"
                    >
                      {section.title}
                    </Typography>
                    <List disablePadding>
                      {section.items.map((item) => (
                        <ListItemButton
                          key={item.to ?? item.label}
                          {...(item.to ? { component: RouterLink, to: item.to } : {})}
                          selected={item.isActive}
                          sx={(theme) => ({
                            mb: 1,
                            borderRadius: 12,
                            "&.Mui-selected": {
                              backgroundColor: alpha(theme.palette.primary.main, 0.12),
                              color: theme.palette.primary.main,
                              boxShadow: "0px 12px 30px rgba(0,178,144,0.14)",
                            },
                          })}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 32,
                              color: item.isActive ? "primary.main" : "inherit",
                            }}
                          >
                            {item.icon ?? getIconForLabel(item.label)}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontWeight: 700 }}
                          />
                          <ChevronRightRoundedIcon fontSize="small" sx={{ opacity: 0.4 }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Box>
                )
            )}

            <Box mt="auto">
              <Paper
                sx={(theme) => ({
                  p: 2,
                  borderRadius: 14,
                  backgroundImage: theme.gradients.callout,
                  boxShadow: theme.customShadows.surface,
                  textAlign: "center",
                })}
              >
                <Typography variant="subtitle2" fontWeight={800} mb={1}>
                  ¿Necesitas ayuda?
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Consulta la guía de usuario para conocer las nuevas mejoras.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="small"
                  component={RouterLink}
                  to="/informes-historicos"
                >
                  Ver guía
                </Button>
              </Paper>
            </Box>
          </Stack>
        </Box>

        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            ml: { xs: 0, md: `${drawerWidth}px` },
            pt: 10,
            pb: theme.layout.pagePaddingY,
          })}
        >
          <Container
            maxWidth={false}
            sx={(theme) => ({
              maxWidth: theme.layout.contentMaxWidth + drawerWidth,
              px: { xs: 2, md: 4 },
            })}
          >
            <Box>{children}</Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
