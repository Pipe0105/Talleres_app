import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputBase,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded";
import ArrowDropDownRoundedIcon from "@mui/icons-material/ArrowDropDownRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import TrendingFlatRoundedIcon from "@mui/icons-material/TrendingFlatRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import { getDashboardStats, getTalleres } from "../../api/talleresApi";
import { DashboardStats, TallerListItem } from "../../types";
import { useAuth } from "../../context/AuthContext";

type WorkshopStatus = "completado" | "pendiente";
type TallerConEstado = TallerListItem & { estado: WorkshopStatus; progreso: number };

const navigationPaths = {
  talleres: "/talleres",
  TalleresPlus: "/talleres-plus",
  seguimiento: "/talleres/seguimiento",
  historial: "/talleres/historial",
  informes: "/informes-historicos",
  listaPrecios: "/lista-precios",
  usuarios: "/usuarios",
};

type QuickAction = {
  label: string;
  icon: ReactNode;
  color: string;
  to: string;
  requiresAdmin?: boolean;
  requiresManager?: boolean;
};

const quickActions: QuickAction[] = [
  {
    label: "Nuevo Taller",
    icon: <AddCircleRoundedIcon />,
    color: "#00b290",
    to: navigationPaths.talleres,
  },
  {
    label: "Generar Informe",
    icon: <AssessmentRoundedIcon />,
    color: "#735cf5",
    to: navigationPaths.informes,
  },
  {
    label: "Actualizar Precios",
    icon: <TrendingFlatRoundedIcon />,
    color: "#ffb020",
    to: navigationPaths.listaPrecios,
    requiresManager: true,
  },
  {
    label: "Añadir usuario",
    icon: <GroupAddRoundedIcon />,
    color: "#2dd4bf",
    to: navigationPaths.usuarios,
    requiresAdmin: true,
  },
];

const StatCard = ({
  title,
  value,
  trend,
  trendUp,
  loading,
}: {
  title: string;
  value: string;
  trend?: string | null;
  trendUp?: boolean;
  loading?: boolean;
}) => {
  const showTrend = Boolean(trend);
  const isTrendUp = trendUp ?? true;

  return (
    <Paper
      sx={(theme) => ({
        p: 2.5,
        borderRadius: 4,
        height: "100%",
        border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
        boxShadow: "0px 12px 30px rgba(15,23,42,0.08)",
        backgroundColor: theme.palette.common.white,
      })}
    >
      <Stack spacing={1}>
        {showTrend ? (
          <Chip
            label={trend}
            size="small"
            icon={
              isTrendUp ? (
                <ArrowDropUpRoundedIcon color="success" />
              ) : (
                <ArrowDropDownRoundedIcon color="error" />
              )
            }
            sx={(theme) => ({
              alignSelf: "flex-end",
              backgroundColor: isTrendUp
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.error.main, 0.1),
              color: isTrendUp ? theme.palette.success.dark : theme.palette.error.dark,
              fontWeight: 700,
            })}
          />
        ) : (
          <Box sx={{ alignSelf: "flex-end", height: 24 }} />
        )}
        <Typography variant="h4" fontWeight={800} color="text.primary">
          {loading ? "…" : value}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {loading ? <LinearProgress sx={{ mt: 0.5, height: 6, borderRadius: 3 }} /> : null}
      </Stack>
    </Paper>
  );
};

const Home = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();
  const isAdmin = Boolean(user?.is_admin || user?.is_gerente);

  const [talleres, setTalleres] = useState<TallerListItem[]>([]);
  const [loadingTalleres, setLoadingTalleres] = useState(false);
  const [errorTalleres, setErrorTalleres] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WorkshopStatus | "todos">("todos");
  const [searcTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;

    const fetchTalleres = async () => {
      if (!isAdmin) return;
      try {
        setLoadingTalleres(true);
        const data = await getTalleres();
        if (!active) return;
        setTalleres(data);
        setErrorTalleres(null);
      } catch (error) {
        console.error("Error al obtener talleres recientes", error);
        if (!active) return;
        setErrorTalleres("No fue posible cargar los talleres. Intenta nuevamente");
      } finally {
        if (active) {
          setLoadingTalleres(false);
        }
      }
    };

    void fetchTalleres();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    let active = true;

    const fetchDashboardStats = async () => {
      if (!isAdmin) return;
      try {
        setLoadingStats(true);
        const data = await getDashboardStats();
        if (!active) return;
        setDashboardStats(data);
        setErrorStats(null);
      } catch (error) {
        console.error("Error al obtener las estadísticas del dashboard", error);
        if (!active) return;
        setErrorStats("No fue posible cargar las estadísticas de resumen.");
      } finally {
        if (active) {
          setLoadingStats(false);
        }
      }
    };

    void fetchDashboardStats();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const talleresConEstado = useMemo<TallerConEstado[]>(() => {
    const deriveEstado = (taller: TallerListItem): WorkshopStatus => {
      const processed = Math.max(taller.total_peso, taller.peso_final);
      const ratio = taller.peso_inicial > 0 ? processed / taller.peso_inicial : 0;

      if (ratio >= 0.99) return "completado";
      return "pendiente";
    };

    return talleres.map((taller) => ({
      ...taller,
      estado: deriveEstado(taller),
      progreso:
        taller.peso_inicial > 0
          ? Math.min(
              Math.max(Math.max(taller.total_peso, taller.peso_final) / taller.peso_inicial, 0),
              1
            )
          : 0,
    }));
  }, [talleres]);

  const statusCounts = useMemo(
    () =>
      talleresConEstado.reduce<Record<WorkshopStatus | "todos", number>>(
        (acc, taller) => {
          acc.todos += 1;
          acc[taller.estado] += 1;
          return acc;
        },
        { todos: 0, completado: 0, pendiente: 0 }
      ),
    [talleresConEstado]
  );

  const completedWorkshopsCount = useMemo(
    () => talleresConEstado.filter((taller) => taller.estado === "completado").length,
    [talleresConEstado]
  );

  const completadosHoy = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    return talleresConEstado.filter((taller) => {
      const createdAt = new Date(taller.creado_en);
      if (Number.isNaN(createdAt.getTime())) return false;
      return createdAt >= todayStart && createdAt < tomorrowStart && taller.estado === "completado";
    }).length;
  }, [talleresConEstado]);

  const formatDate = useCallback((value?: string | null) => {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin fecha";
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }, []);

  const filteredWorkshops = useMemo<TallerConEstado[]>(() => {
    const query = searcTerm.trim().toLowerCase();
    const matchesQuery = (taller: TallerConEstado) =>
      !query ||
      [taller.nombre_taller, taller.codigo_principal ?? "", taller.especie, taller.sede ?? ""]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query));

    return talleresConEstado.filter(
      (taller) =>
        (statusFilter === "todos" || taller.estado === statusFilter) && matchesQuery(taller)
    );
  }, [statusFilter, searcTerm, talleresConEstado]);

  const formatTrend = useCallback((trend?: number | null): string | null => {
    if (trend === null || trend === undefined || Number.isNaN(trend)) {
      return null;
    }

    if (Math.abs(trend + 100) < 0.0001) {
      return null;
    }

    const absolute = Math.abs(trend);
    const formatted = absolute >= 10 ? trend.toFixed(0) : trend.toFixed(1);
    const prefix = trend > 0 ? "+" : "";
    return `${prefix}${formatted}%`;
  }, []);

  const statCards = useMemo(() => {
    const buildStat = (
      title: string,
      metric: DashboardStats[keyof DashboardStats] | undefined,
      fallbackValue?: number
    ) => {
      const valueNumber = metric?.value ?? fallbackValue;
      const valueText = typeof valueNumber === "number" ? valueNumber.toLocaleString("es-CO") : "—";
      const trendNumber = metric?.trend;
      const trendText = formatTrend(trendNumber);

      return {
        title,
        value: valueText,
        trend: trendText,
        trendUp: trendText ? (trendNumber ?? 0) >= 0 : undefined,
      };
    };

    return [
      buildStat("Talleres Realizados", undefined, completedWorkshopsCount),
      buildStat("Completados Hoy", dashboardStats?.completados_hoy, completadosHoy),

      buildStat("Usuarios Activos", dashboardStats?.usuarios_activos),
    ];
  }, [completedWorkshopsCount, completadosHoy, dashboardStats, formatTrend]);
  const availableQuickActions = useMemo(() => {
    return quickActions.filter((action) => {
      if (action.requiresAdmin) {
        return Boolean(user?.is_admin);
      }
      if (action.requiresManager) {
        return Boolean(user?.is_admin || user?.is_gerente);
      }
      return true;
    });
  }, [user?.is_admin, user?.is_gerente]);

  const QuickActionsPanel = ({ actions }: { actions: QuickAction[] }) => (
    <Card
      sx={(theme) => ({
        p: 2.5,
        border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
        borderRadius: 4,
      })}
    >
      <Typography variant="subtitle1" fontWeight={800} mb={2}>
        Accesos Rápidos
      </Typography>
      <Grid container spacing={1.5}>
        {actions.map((action) => (
          <Grid item xs={12} sm={6} key={action.label}>
            <Paper
              component={RouterLink}
              to={action.to}
              sx={(theme) => ({
                p: 2,
                borderRadius: 2,
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${alpha(action.color, 0.2)}`,
                background: `linear-gradient(135deg, ${alpha(action.color, 0.12)}, ${alpha(
                  action.color,
                  0.05
                )})`,
                color: theme.palette.text.primary,
                textAlign: "center",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                textDecoration: "none",
                minHeight: 134,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 14px 32px rgba(15,23,42,0.12)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: "12px",
                  borderRadius: 2,
                  background: `radial-gradient(circle at 20% 20%, ${alpha(
                    action.color,
                    0.16
                  )}, transparent 45%)`,
                  opacity: 0.7,
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  width: 160,
                  height: 160,
                  bottom: -70,
                  right: -60,
                  background: alpha(action.color, 0.18),
                  filter: "blur(48px)",
                  opacity: 0.55,
                },
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0px 16px 38px rgba(15,23,42,0.15)",
                  background: `linear-gradient(145deg, ${alpha(action.color, 0.16)}, ${alpha(
                    action.color,
                    0.08
                  )})`,
                },
              })}
            >
              <Stack alignItems="center" spacing={1.2} position="relative" zIndex={1}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: alpha(action.color, 0.18),
                    color: action.color,
                    border: `1px solid ${alpha(action.color, 0.3)}`,
                    boxShadow: `0 10px 22px ${alpha(action.color, 0.26)}`,
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="body2" fontWeight={800} color="text.primary">
                  {action.label}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Card>
  );

  if (!isAdmin) {
    return (
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Accesos Rápidos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Elige una acción para continuar con tu trabajo diario.
            </Typography>
          </Box>
        </Stack>

        <QuickActionsPanel actions={availableQuickActions} />
      </Stack>
    );
  }
  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Gestión de Talleres
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitorea tus talleres, inventario y desempeño en un solo vistazo.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterListRoundedIcon />}
            component={RouterLink}
            to={navigationPaths.seguimiento}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleRoundedIcon />}
            component={RouterLink}
            to={navigationPaths.talleres}
          >
            Nuevo Taller
          </Button>
        </Stack>
      </Stack>

      {errorStats ? <Alert severity="warning">{errorStats}</Alert> : null}

      <Grid container spacing={2}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={4} key={stat.title}>
            <StatCard
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              trendUp={stat.trendUp}
              loading={loadingStats}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8.5}>
          <Card
            sx={(theme) => ({
              p: 3,
              border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
              boxShadow: theme.customShadows.surface,
            })}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
              mb={2}
            >
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight={800}>
                  Talleres Recientes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revisa los talleres recientes y acciones disponibles.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {[
                  { value: "todos", label: "Todos", count: statusCounts.todos },
                  { value: "completado", label: "Completados", count: statusCounts.completado },
                  { value: "pendiente", label: "Pendientes", count: statusCounts.pendiente },
                ].map((tab) => (
                  <Chip
                    key={tab.value}
                    label={`${tab.label} (${tab.count})`}
                    color={statusFilter === tab.value ? "primary" : "default"}
                    onClick={() => setStatusFilter(tab.value as WorkshopStatus | "todos")}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      height: 26,
                      "& .MuiChip-label": {
                        px: 1,
                        py: 0.25,
                        fontSize: 11,
                      },
                    }}
                  />
                ))}
              </Stack>
            </Stack>

            <Paper
              variant="outlined"
              sx={(theme) => ({
                p: 1.5,
                borderRadius: 12,
                border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              })}
            >
              <SearchRoundedIcon color="disabled" />
              <InputBase
                fullWidth
                placeholder="Buscar..."
                value={searcTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Button
                variant="text"
                startIcon={<FileDownloadRoundedIcon />}
                component={RouterLink}
                to={navigationPaths.informes}
              >
                Exportar
              </Button>
            </Paper>

            <Box>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Grid container sx={{ fontWeight: 700, color: "text.secondary", mb: 1 }}>
                  <Grid item xs={6} md={7}>
                    <Typography variant="caption">ID / Taller</Typography>
                  </Grid>
                  <Grid item xs={3} md={2}>
                    <Typography variant="caption">Fecha</Typography>
                  </Grid>
                  <Grid item xs={3} md={3}>
                    <Typography variant="caption">Acciones</Typography>
                  </Grid>
                </Grid>
                <Divider />
              </Box>

              {errorTalleres && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorTalleres}
                </Alert>
              )}
              <Stack spacing={1.25} mt={1.5}>
                {loadingTalleres && <LinearProgress />}
                {!loadingTalleres && !filteredWorkshops.length ? (
                  <Typography variant="body2" color="text.secondary">
                    No hay talleres que coincidan con los filtros seleccionados.
                  </Typography>
                ) : (
                  filteredWorkshops.map((taller) => (
                    <Paper
                      key={taller.id}
                      variant="outlined"
                      sx={(theme) => ({
                        p: 1.25,
                        borderRadius: 12,
                        border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
                        boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
                      })}
                    >
                      <Grid
                        container
                        alignItems={isSmallScreen ? "flex-start" : "center"}
                        spacing={isSmallScreen ? 1 : 1.5}
                      >
                        <Grid item xs={12} sm={6} md={7}>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {taller.codigo_principal ?? `TL-${taller.id}`}
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {taller.nombre_taller}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {taller.descripcion || "Sin descripción"}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={3} md={2}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {formatDate(taller.creado_en)}
                          </Typography>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={3}
                          md={3}
                          sx={{
                            display: "flex",
                            justifyContent: { xs: "flex-start", sm: "flex-end" },
                            mt: { xs: 0.5, sm: 0 },
                          }}
                        >
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            <IconButton
                              size="small"
                              color="primary"
                              component={RouterLink}
                              to={navigationPaths.seguimiento}
                              aria-label="Ver seguimiento del taller"
                            >
                              <VisibilityRoundedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="success"
                              component={RouterLink}
                              to={navigationPaths.TalleresPlus}
                              aria-label="Editar taller"
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              component={RouterLink}
                              to={navigationPaths.historial}
                              aria-label="Ir al historial de talleres"
                            >
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                )}
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={3.5}>
          <Stack spacing={2.5}>
            <QuickActionsPanel actions={availableQuickActions} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default Home;
