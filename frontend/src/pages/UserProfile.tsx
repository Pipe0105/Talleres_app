import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const maskedPassword = "*********";

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) {
    return null;
  }
  const roleLabel = user.is_admin ? "Administrador" : "Operador";

  const infoItems = [
    {
      label: "Usuario",
      value: user.username,
      helper: "Identificador principal para iniciar sesion",
    },
    {
      label: "Nombre completo",
      value: user.full_name?.trim() || "Sin registrar",
      helper: "Asi aparecera en reportes y notificaciones",
    },
    {
      label: "Correo electronico",
      value: user.email?.trim() || "Sin registrar",
      helper: "Utilizado para avisos importantes",
    },
    {
      label: "Contraseña",
      value: maskedPassword,
      helper: "Para reestablecerla, comunicate con un administrador",
    },
  ];
  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <Stack spacing={3}>
      <Paper
        sx={(theme) => ({
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.15),
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.light,
            0.12
          )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 35%, ${alpha(
            theme.palette.primary.dark,
            0.1
          )} 100%)`,
          boxShadow: "0 12px 35px rgba(16, 24, 40, 0.08)",
        })}
      >
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={(theme) => ({
                  width: 64,
                  height: 64,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  border: "2px solid",
                  borderColor: theme.palette.primary.light,
                })}
              >
                <PersonOutlineIcon fontSize="large" />
              </Avatar>
              <Stack spacing={0.5}>
                <Typography
                  variant="overline"
                  sx={{
                    letterSpacing: 1,
                    fontWeight: 800,
                    color: "primary.main",
                  }}
                >
                  Panel en línea
                </Typography>
                <Typography variant="h4" component="h1">
                  Mi perfil
                </Typography>
                <Typography color="text.secondary">
                  Consulta información básica de tu cuenta
                </Typography>
              </Stack>
            </Stack>
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogout}
              sx={{
                alignSelf: { xs: "stretch", md: "center" },
                borderRadius: 2,
                boxShadow: "none",
              }}
            >
              Cerrar sesión
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            flexWrap="wrap"
          >
            <Chip
              label={roleLabel}
              color={user.is_admin ? "primary" : "default"}
              sx={(theme) => ({
                fontWeight: 700,
                borderRadius: 1.5,
                bgcolor: user.is_admin
                  ? undefined
                  : alpha(theme.palette.text.primary, 0.04),
              })}
            />
            <Chip
              label={user.is_active ? "Activo" : "Inactivo"}
              color={user.is_active ? "success" : "default"}
              variant={user.is_active ? "filled" : "outlined"}
              sx={{ fontWeight: 700, borderRadius: 1.5 }}
            />
            <Box
              sx={(theme) => ({
                px: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.common.white, 0.9),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.12),
                boxShadow: "0 8px 20px rgba(16, 24, 40, 0.08)",
                minWidth: { xs: "100%", sm: "auto" },
              })}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Correo de contacto
              </Typography>
              <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                {user.email?.trim() || "Sin registrar"}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 10px 30px rgba(16, 24, 40, 0.06)",
        }}
      >
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1.5}
          >
            <Stack spacing={0.5}>
              <Typography variant="h6" component="h2">
                Datos de la cuenta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estos datos se utilizan para iniciar sesion y personalizar tu
                experiencia
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                label={roleLabel}
                color={user.is_admin ? "primary" : "default"}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={user.is_active ? "Activo" : "Inactivo"}
                color={user.is_active ? "success" : "default"}
                variant={user.is_active ? "filled" : "outlined"}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            {infoItems.map((item) => (
              <Grid item xs={12} md={6} key={item.label}>
                <Box
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    transition:
                      "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 20px rgba(16, 24, 40, 0.06)",
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  })}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}
                  >
                    {item.label}
                  </Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                    {item.value}
                  </Typography>
                  {item.helper && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {item.helper}
                    </Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default UserProfile;
