import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useAuth } from "../../context/AuthContext";
import {
  adminCreateUser,
  adminGetUsers,
  adminUpdateUser,
} from "../../api/talleresApi";
import type { UserProfile } from "../../types";

interface NewUserForm {
  email: string;
  password: string;
  fullName: string;
  isAdmin: boolean;
  isActive: boolean;
}

const INITIAL_FORM_STATE: NewUserForm = {
  email: "",
  password: "",
  fullName: "",
  isAdmin: false,
  isActive: true,
};

const UsersAdmin = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [formState, setFormState] = useState<NewUserForm>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await adminGetUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setListError("No se pudieron cargar los usuarios. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      await adminCreateUser({
        email: formState.email,
        password: formState.password,
        full_name: formState.fullName || undefined,
        is_admin: formState.isAdmin,
        is_active: formState.isActive,
      });
      setFormSuccess("Usuario creado correctamente.");
      setFormState(INITIAL_FORM_STATE);
      await loadUsers();
    } catch (error) {
      console.error(error);
      setFormError("No se pudo crear el usuario. Verifica los datos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (target: UserProfile) => {
    setUpdatingUserId(target.id);
    setListError(null);
    try {
      await adminUpdateUser(target.id, { is_active: !target.is_active });
      await loadUsers();
    } catch (error) {
      console.error(error);
      setListError("No se pudo actualizar el estado del usuario.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleAdmin = async (target: UserProfile) => {
    setUpdatingUserId(target.id);
    setListError(null);
    try {
      await adminUpdateUser(target.id, { is_admin: !target.is_admin });
      await loadUsers();
    } catch (error) {
      console.error(error);
      setListError("No se pudo actualizar el rol del usuario.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const disableSelfManagement = useMemo(
    () => new Set([currentUser?.id].filter(Boolean) as string[]),
    [currentUser?.id]
  );

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Administración de usuarios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crea cuentas para tu equipo y controla los permisos de acceso a los
            talleres.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadUsers}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Stack>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader
              avatar={<AdminPanelSettingsIcon color="primary" />}
              title="Crear un nuevo usuario"
              subheader="Define el rol y estado de la cuenta."
            />
            <CardContent>
              <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                <TextField
                  label="Correo electrónico"
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Contraseña temporal"
                  type="password"
                  value={formState.password}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Nombre completo"
                  value={formState.fullName}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formState.isAdmin}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          isAdmin: event.target.checked,
                        }))
                      }
                    />
                  }
                  label="Otorgar permisos de administrador"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formState.isActive}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          isActive: event.target.checked,
                        }))
                      }
                    />
                  }
                  label="Cuenta activa"
                />
                {formError && <Alert severity="error">{formError}</Alert>}
                {formSuccess && <Alert severity="success">{formSuccess}</Alert>}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  size="large"
                >
                  {submitting ? "Guardando…" : "Crear usuario"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <PersonOutlineIcon color="action" />
              <Typography variant="h6" fontWeight={600}>
                Usuarios registrados
              </Typography>
            </Stack>
            {listError && <Alert severity="error">{listError}</Alert>}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Correo</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Creado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_admin ? "Administrador" : "Operador"}
                        color={user.is_admin ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? "Activo" : "Inactivo"}
                        color={user.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.creado_en).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={user.is_active}
                              onChange={() => handleToggleActive(user)}
                              disabled={
                                updatingUserId === user.id ||
                                disableSelfManagement.has(user.id)
                              }
                              size="small"
                            />
                          }
                          labelPlacement="start"
                          label="Activo"
                          sx={{ m: 0 }}
                        />
                        <Tooltip
                          title={
                            disableSelfManagement.has(user.id)
                              ? "No puedes modificar tu propio rol"
                              : user.is_admin
                              ? "Quitar permisos de administrador"
                              : "Conceder permisos de administrador"
                          }
                        >
                          <span>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleToggleAdmin(user)}
                              disabled={
                                updatingUserId === user.id ||
                                disableSelfManagement.has(user.id)
                              }
                            >
                              {user.is_admin ? "Quitar admin" : "Hacer admin"}
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Todavía no hay usuarios registrados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Cargando usuarios…
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default UsersAdmin;
