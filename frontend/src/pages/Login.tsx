import { FormEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/talleresApi";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { refresh } = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSubmitting(true);
      if (mode === "register") {
        await register({ email, password, full_name: fullName || undefined });
        setSuccess("Cuenta creada correctamente. Ahora puedes iniciar sesión.");
        setMode("login");
        return;
      }

      await login(email, password);
      await refresh();
      setSuccess("Inicio de sesión exitoso. Redirigiendo…");
      setTimeout(() => navigate("/"), 600);
    } catch (err) {
      console.error(err);
      setError(
        mode === "register"
          ? "No fue posible registrar la cuenta. Verifica los datos y vuelve a intentarlo."
          : "Credenciales inválidas o usuario inexistente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.background.default,
        backgroundImage: theme.gradients.subtle,
        p: { xs: 3, md: 6 },
      })}
    >
      <Paper
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: 450,
          borderRadius: 2,
          p: { xs: 4, sm: 5 },
          boxShadow: (theme) => theme.shadows[20],
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Typography
              variant="h4"
              align="center"
              component="h1"
              fontWeight={700}
              color="primary.main"
              gutterBottom
            >
              Talleres Desposte
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              {mode === "login"
                ? "Ingresa tus credenciales para acceder al panel."
                : "Completa los datos para habilitar el acceso a la API."}
            </Typography>
          </Box>

          <Stack component="form" spacing={3} onSubmit={handleSubmit}>
            <TextField
              label="Correo electrónico"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              name="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
            />
            {mode === "register" && (
              <TextField
                label="Nombre completo"
                name="full_name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                fullWidth
              />
            )}

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ py: 1.2, fontWeight: 600 }}
            >
              {submitting
                ? mode === "login"
                  ? "Ingresando…"
                  : "Creando cuenta…"
                : mode === "login"
                ? "Ingresar"
                : "Crear cuenta"}
            </Button>
          </Stack>
          <Stack spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {mode === "login"
                ? "¿Aún no tienes acceso?"
                : "¿Ya tienes una cuenta registrada?"}
            </Typography>
            <Link
              component="button"
              type="button"
              onClick={() => {
                setMode((prev) => (prev === "login" ? "register" : "login"));
                setError(null);
                setSuccess(null);
              }}
              underline="hover"
              sx={{ fontWeight: 700 }}
            >
              {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
            </Link>
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/")}
              underline="hover"
            >
              Volver al panel como invitado
            </Link>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Login;
