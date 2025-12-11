import { Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const maskedPassword = "*********";

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) {
    return null;
  }
  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <PageHeader
            title="Mi perfil"
            description="Consulta informacion basica de tu cuenta"
            action={<PersonOutlineIcon color="primary" fontSize="large" />}
          />
          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
          >
            Cerrar sesión
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
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
                label={user.is_admin ? "Administrados" : "Operador"}
                color={user.is_admin ? "primary" : "default"}
              />
              <Chip
                label={user.is_active ? "Activo" : "Inactivo"}
                color={user.is_active ? "success" : "default"}
                variant={user.is_admin ? "filled" : "outlined"}
              />
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Usuario
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {user.username}
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Nombre Completo
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {user.full_name?.trim() || "Sin registrar"}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Correo electrónico
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {user.email?.trim() || "Sin registrar"}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Contraseña
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {maskedPassword}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Si necesita reestablecer la contraseña comuniquese con un
                administrador
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default UserProfile;
