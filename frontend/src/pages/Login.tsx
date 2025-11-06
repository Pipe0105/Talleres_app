import { FormEvent } from "react";
import {
  Box,
  Button,
  Divider,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate("/");
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.background.default,
        backgroundImage: `radial-gradient(circle at top left, ${theme.palette.grey[100]} 0%, transparent 60%), radial-gradient(circle at bottom right, ${theme.palette.grey[200]} 0%, transparent 55%)`,
        p: { xs: 3, md: 6 },
      })}
    >
      <Paper
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 4,
          p: { xs: 4, sm: 5 },
          boxShadow: (theme) => theme.shadows[12],
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              color="primary.main"
              gutterBottom
            >
              Talleres Desposte
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ingresa tus credenciales para acceder al panel de control de los
              talleres.
            </Typography>
          </Box>

          <Stack component="form" spacing={3} onSubmit={handleSubmit}>
            <TextField
              label="Correo electrónico"
              type="email"
              name="email"
              autoComplete="email"
              required
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                py: 1.2,
                fontWeight: 600,
              }}
            >
              Ingresar
            </Button>
          </Stack>

          <Divider>
            <Typography variant="caption" color="text.secondary">
              ¿Olvidaste tu contraseña?
            </Typography>
          </Divider>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Ponte en contacto con el administrador del sistema para
            restablecerla.
          </Typography>

          <Stack spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              ¿Aún no tienes acceso?
            </Typography>
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/")}
              underline="hover"
              sx={{ fontWeight: 600 }}
            >
              Explorar el panel como invitado
            </Link>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Login;
