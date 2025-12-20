import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Avatar,
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
import { alpha } from "@mui/material/styles";
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
import TalleresPlus from "../talleres/TalleresPlus";
import { color } from "framer-motion";

type WorkshopStatus = "completado" | "en-proceso" | "pendiente";

const navigationPaths = {
  talleres: "/talleres",
  TalleresPlus: "/talleres-plus",
  seguimiento: "/talleres/seguimiento",
  historial: "/talleres/historial",
  informes: "/informes-historicos",
  listaPrecios: "/lista-precios",
  usuarios: "/usuarios",
};

const statsCards = [
  { title: "Talleres Activos", value: "24", trend: "+12%", trendUp: true },
  { title: "Completados Hoy", value: "18", trend: "+8%", trendUp: true },
  { title: "Inventario Bajo", value: "7", trend: "-3%", trendUp: false },
  { title: "Usuarios Activos", value: "42", trend: "+5%", trendUp: true },
];

const recentWorkshops = [
  {
    id: "TL-1001",
    nombre: "Desposte Res Premium",
    estado: "completado",
    fecha: "2024-01-15",
    responsable: "Carlos Méndez",
    iniciales: "CM",
    cantidad: "250 kg",
  },
  {
    id: "TL-1002",
    nombre: "Desposte Cerdo Estándar",
    estado: "en-proceso",
    fecha: "2024-01-15",
    responsable: "Ana García",
    iniciales: "AG",
    cantidad: "180 kg",
  },
  {
    id: "TL-1003",
    nombre: "Desposte Pollo Orgánico",
    estado: "completado",
    fecha: "2024-01-14",
    responsable: "Luis Torres",
    iniciales: "LT",
    cantidad: "320 kg",
  },
  {
    id: "TL-1004",
    nombre: "Desposte Res Especial",
    estado: "pendiente",
    fecha: "2024-01-14",
    responsable: "María López",
    iniciales: "ML",
    cantidad: "200 kg",
  },
  {
    id: "TL-1005",
    nombre: "Desposte Cerdo Premium",
    estado: "en-proceso",
    fecha: "2024-01-15",
    responsable: "Pedro Ruiz",
    iniciales: "PR",
    cantidad: "250 kg",
  },
  {
    id: "TL-1006",
    nombre: "Desposte Cordero",
    estado: "completado",
    fecha: "2024-01-14",
    responsable: "Sofía Ramírez",
    iniciales: "SR",
    cantidad: "90 kg",
  },
];

const activityFeed = [
  {
    titulo: "Carlos Méndez completó el taller",
    ref: "TL-1001",
    tiempo: "Hace 15 min",
    color: "#00b290",
    iniciales: "CM",
  },
  {
    titulo: "Ana García actualizó el inventario",
    ref: "Producto #245",
    tiempo: "Hace 32 min",
    color: "#ff6f61",
    iniciales: "AG",
  },
  {
    titulo: "Luis Torres generó un informe",
    ref: "Reporte Mensual",
    tiempo: "Hace 1 hora",
    color: "#fbbf24",
    iniciales: "LT",
  },
  {
    titulo: "María López creó un nuevo taller",
    ref: "TL-1004",
    tiempo: "Hace 2 horas",
    color: "#4ade80",
    iniciales: "ML",
  },
  {
    titulo: "Pedro Ruiz modificó precios",
    ref: "Lista Principal",
    tiempo: "Hace 3 horas",
    color: "#60a5fa",
    iniciales: "PR",
  },
];

const quickActions = [
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
  },
  {
    label: "Añadir usuario",
    icon: <GroupAddRoundedIcon />,
    color: "#2dd4bf",
    to: navigationPaths.usuarios,
  },
];

const statusStyles: Record<WorkshopStatus, { label: string; color: string; bg: string }> = {
  completado: {
    label: "Completado",
    color: "#16a34a",
    bg: "rgba(22,163,74,0.12)",
  },
  "en-proceso": {
    label: "En Proceso",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
  },
  pendiente: {
    label: "Pendiente",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.14)",
  },
};

const StatCard = ({
  title,
  value,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
}) => (
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
      <Chip
        label={trend}
        size="small"
        icon={
          trendUp ? (
            <ArrowDropUpRoundedIcon color="success" />
          ) : (
            <ArrowDropDownRoundedIcon color="error" />
          )
        }
        sx={(theme) => ({
          alignSelf: "flex-end",
          backgroundColor: trendUp
            ? alpha(theme.palette.success.main, 0.1)
            : alpha(theme.palette.error.main, 0.1),
          color: trendUp ? theme.palette.success.dark : theme.palette.error.dark,
          fontWeight: 700,
        })}
      />
      <Typography variant="h4" fontWeight={800} color="text.primary">
        {value}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
    </Stack>
  </Paper>
);

const Home = () => {
  const [statusFilter, setStatusFilter] = useState<WorkshopStatus | "todos">("todos");

  const filteredWorkshops = useMemo(
    () =>
      statusFilter === "todos"
        ? recentWorkshops
        : recentWorkshops.filter((taller) => taller.estado === statusFilter),
    [statusFilter]
  );

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

      <Grid container spacing={2}>
        {statsCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <StatCard
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              trendUp={stat.trendUp}
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
                  Revisa el estado de tus talleres y acciones disponibles.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {[
                  { value: "todos", label: "Todos", count: 6 },
                  { value: "completado", label: "Completados", count: 3 },
                  { value: "en-proceso", label: "En Proceso", count: 2 },
                  { value: "pendiente", label: "Pendientes", count: 1 },
                ].map((tab) => (
                  <Chip
                    key={tab.value}
                    label={`${tab.label} (${tab.count})`}
                    color={statusFilter === tab.value ? "primary" : "default"}
                    onClick={() => setStatusFilter(tab.value as WorkshopStatus | "todos")}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
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
              <InputBase fullWidth placeholder="Buscar..." />
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
              <Grid container sx={{ fontWeight: 700, color: "text.secondary", mb: 1 }}>
                <Grid item xs={1.5}>
                  <Typography variant="caption">ID</Typography>
                </Grid>
                <Grid item xs={3.5}>
                  <Typography variant="caption">Nombre del Taller</Typography>
                </Grid>
                <Grid item xs={1.5}>
                  <Typography variant="caption">Estado</Typography>
                </Grid>
                <Grid item xs={1.5}>
                  <Typography variant="caption">Fecha</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="caption">Responsable</Typography>
                </Grid>
                <Grid item xs={1.5}>
                  <Typography variant="caption">Cantidad</Typography>
                </Grid>
                <Grid item xs={0.5}>
                  <Typography variant="caption">Acciones</Typography>
                </Grid>
              </Grid>
              <Divider />
              <Stack spacing={1.25} mt={1.5}>
                {filteredWorkshops.map((taller) => (
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
                    <Grid container alignItems="center">
                      <Grid item xs={1.5}>
                        <Typography variant="subtitle2" fontWeight={800}>
                          {taller.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Código principal
                        </Typography>
                      </Grid>
                      <Grid item xs={3.5}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {taller.nombre}
                        </Typography>
                      </Grid>
                      <Grid item xs={1.5}>
                        <Chip
                          label={statusStyles[taller.estado as WorkshopStatus].label}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            backgroundColor: statusStyles[taller.estado as WorkshopStatus].bg,
                            color: statusStyles[taller.estado as WorkshopStatus].color,
                          }}
                        />
                      </Grid>
                      <Grid item xs={1.5}>
                        <Typography variant="body2" fontWeight={600}>
                          {taller.fecha}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            sx={(theme) => ({
                              width: 32,
                              height: 32,
                              backgroundColor: alpha(theme.palette.primary.main, 0.15),
                              color: theme.palette.primary.main,
                              fontWeight: 700,
                            })}
                          >
                            {taller.iniciales}
                          </Avatar>
                          <Typography variant="body2" fontWeight={700}>
                            {taller.responsable}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={1.5}>
                        <Typography variant="body2" fontWeight={700}>
                          {taller.cantidad}
                        </Typography>
                      </Grid>
                      <Grid item xs={0.5} sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Stack direction="row" spacing={0.5}>
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
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={3.5}>
          <Stack spacing={2.5}>
            <Card
              sx={(theme) => ({
                p: 2.5,
                border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
              })}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Actividad Reciente
                </Typography>
                <Button size="small" component={RouterLink} to={navigationPaths.seguimiento}>
                  Ver todo
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {activityFeed.map((actividad) => (
                  <Stack key={actividad.titulo} direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontWeight: 700,
                        bgcolor: alpha(actividad.color, 0.15),
                        color: actividad.color,
                      }}
                    >
                      {actividad.iniciales}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {actividad.titulo}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {actividad.ref}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {actividad.tiempo}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Card>

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
                {quickActions.map((action) => (
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
                        transition:
                          "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
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
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default Home;
