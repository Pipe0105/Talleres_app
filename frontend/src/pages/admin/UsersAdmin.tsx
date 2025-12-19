import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
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
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { useAuth } from "../../context/AuthContext";
import {
  adminCreateUser,
  adminDeleteUser,
  adminGetUsers,
  adminUpdateUser,
} from "../../api/talleresApi";
import type { UserProfile } from "../../types";
import { Person, Visibility, VisibilityOff } from "@mui/icons-material";
import { BRANCH_LOCATIONS } from "../../data/branchLocations";

interface NewUserForm {
  username: string;
  email: string;
  password: string;
  fullName: string;
  isAdmin: boolean;
  isGerente: boolean;
  isActive: boolean;
  sede: string;
}

interface EditUserForm {
  username: string;
  email: string;
  password: string;
  fullname: string;
  isAdmin: boolean;
  isGerente: boolean;
  isActive: boolean;
  sede: string;
}

const INITIAL_FORM_STATE: NewUserForm = {
  username: "",
  email: "",
  password: "",
  fullName: "",
  isAdmin: false,
  isGerente: false,
  isActive: true,
  sede: "",
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
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    sede: "",
    role: "",
  });

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
        username: formState.username,
        email: formState.email || undefined,
        password: formState.password,
        full_name: formState.fullName || undefined,
        is_admin: formState.isAdmin,
        is_active: formState.isActive,
        is_gerente: formState.isGerente,
        sede: formState.sede || undefined,
      });
      setFormSuccess("Usuario creado correctamente.");
      setFormState(INITIAL_FORM_STATE);
      setCreateDialogOpen(false);
      setShowCreatePassword(false);
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

  const handleToggleGerente = async (target: UserProfile) => {
    setUpdatingUserId(target.id);
    setListError(null);
    try {
      await adminUpdateUser(target.id, { is_gerente: !target.is_gerente });
      await loadUsers();
    } catch (error) {
      console.error(error);
      setListError("No se pudo actualizar el rol de gerente.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const openEditDialog = (target: UserProfile) => {
    setEditTarget(target);
    setEditForm({
      username: target.username,
      email: target.email ?? "",
      fullname: target.full_name ?? "",
      password: "",
      isAdmin: target.is_admin,
      isGerente: target.is_gerente,
      isActive: target.is_active,
      sede: target.sede ?? "",
    });
    setEditError(null);
    setShowEditPassword(false);
  };

  const closeEditDialog = () => {
    setEditTarget(null);
    setEditForm(null);
    setEditError(null);
    setShowEditPassword(false);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget || !editForm) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      await adminUpdateUser(editTarget.id, {
        username: editForm.username.trim() || editTarget.username,
        email: editForm.email.trim() || undefined,
        full_name: editForm.fullname.trim() || undefined,
        password: editForm.password ? editForm.password : undefined,
        is_admin: editForm.isAdmin,
        is_active: editForm.isActive,
        is_gerente: editForm.isGerente,
        sede: editForm.sede.trim() || undefined,
      });
      closeEditDialog();
      setShowEditPassword(false);
      await loadUsers();
    } catch (error) {
      console.error(error);
      setEditError("No se pudo actualizar el usuario, verifica los datos");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setUpdatingUserId(deleteTarget.id);
    setListError(null);
    try {
      await adminDeleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      console.error(error);
      setListError("No se pudo eliminar el usuario, Intentelo nuevamente");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const disableSelfManagement = useMemo(
    () => new Set([currentUser?.id].filter(Boolean) as string[]),
    [currentUser?.id]
  );

  const editSedeOptions = useMemo(() => {
    if (
      editForm?.sede &&
      editForm.sede.trim() &&
      !BRANCH_LOCATIONS.includes(editForm.sede)
    ) {
      return [editForm.sede, ...BRANCH_LOCATIONS];
    }

    return BRANCH_LOCATIONS;
  }, [editForm?.sede]);

  const filteredUsers = useMemo(() => {
    const normalizedName = filters.name.trim().toLowerCase();

    return users.filter((user) => {
      const matchesName =
        !normalizedName ||
        user.username.toLowerCase().includes(normalizedName) ||
        (user.full_name ?? "").toLowerCase().includes(normalizedName);
      const matchesSede = !filters.sede || user.sede === filters.sede;
      const role = user.is_admin
        ? "admin"
        : user.is_gerente
        ? "gerente"
        : "operador";
      const matchesRole = !filters.role || role === filters.role;

      return matchesName && matchesSede && matchesRole;
    });
  }, [filters.name, filters.role, filters.sede, users]);

  const handleResetFilters = () => {
    setFilters({ name: "", sede: "", role: "" });
  };

  const openCreateDialog = () => {
    setFormError(null);
    setFormSuccess(null);
    setCreateDialogOpen(true);
    setShowEditPassword(false);
    setShowCreatePassword(false);
  };

  const closeCreateDialog = () => {
    if (submitting) return;
    setCreateDialogOpen(false);
    setFormError(null);
    setShowEditPassword(false);
    setShowCreatePassword(false);
  };

  return (
    <Stack spacing={4} className="animate-fade-up">
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ md: "center" }}
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
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<PersonAddAlt1Icon />}
            onClick={openCreateDialog}
          >
            Crear usuario
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={2}>
        {formSuccess && <Alert severity="success">{formSuccess}</Alert>}
        <Card>
          <CardHeader
            avatar={<PersonOutlineIcon color="primary" />}
            title="Usuarios registrados"
            subheader="Gestiona el estado y permisos de cada miembro."
          />
          <CardContent>
            {listError && <Alert severity="error">{listError}</Alert>}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "center" }}
              mb={2}
            >
              <TextField
                label="Filtrar por nombre"
                value={filters.name}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, name: event.target.value }))
                }
                size="small"
                fullWidth
              />
              <TextField
                select
                label="Sede"
                value={filters.sede}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, sede: event.target.value }))
                }
                size="small"
                fullWidth
              >
                <MenuItem value="">Todas las sedes</MenuItem>
                {BRANCH_LOCATIONS.map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Rol"
                value={filters.role}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, role: event.target.value }))
                }
                size="small"
                fullWidth
              >
                <MenuItem value="">Todos los roles</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="gerente">Gerente</MenuItem>
                <MenuItem value="operador">Operador</MenuItem>
              </TextField>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                sx={{ flexShrink: 0 }}
              >
                Limpiar filtros
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Sede</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Creado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>{user.full_name || "—"}</TableCell>
                    <TableCell>{user.sede || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          user.is_admin
                            ? "Administrador"
                            : user.is_gerente
                            ? "Gerente"
                            : "Operador"
                        }
                        color={
                          user.is_admin
                            ? "primary"
                            : user.is_gerente
                            ? "secondary"
                            : "default"
                        }
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
                        <Tooltip
                          title={
                            disableSelfManagement.has(user.id)
                              ? "No puedes modificar tu propio rol"
                              : user.is_gerente
                              ? "Quitar permisos de gerente"
                              : "Conceder rol de gerente"
                          }
                        >
                          <span>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleToggleGerente(user)}
                              disabled={
                                updatingUserId === user.id ||
                                disableSelfManagement.has(user.id)
                              }
                            >
                              {user.is_gerente
                                ? "Quitar gerente"
                                : "Hacer gerente"}
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Editar usuario">
                          <span>
                            <Button
                              variant="contained"
                              size="small"
                              color="secondary"
                              startIcon={<EditIcon />}
                              onClick={() => openEditDialog(user)}
                              disabled={updatingUserId === user.id}
                            >
                              Editar
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={
                            disableSelfManagement.has(user.id)
                              ? "No puedes eliminar tu propia cuenta"
                              : "Eliminar usuario"
                          }
                        >
                          <span>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => setDeleteTarget(user)}
                              disabled={
                                updatingUserId === user.id ||
                                disableSelfManagement.has(user.id)
                              }
                            >
                              Borrar
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Todavía no hay usuarios registrados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && users.length > 0 && filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay usuarios que coincidan con los filtros.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Cargando usuarios…
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={createDialogOpen}
        onClose={closeCreateDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>Crear un nuevo usuario</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3} mt={1}>
              <TextField
                label="Usuario"
                value={formState.username}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                fullWidth
              />
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
                fullWidth
              />
              <TextField
                label="Contraseña temporal"
                type={showCreatePassword ? "text" : "password"}
                value={formState.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showCreatePassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        onClick={() => setShowCreatePassword((prev) => !prev)}
                        edge="end"
                      >
                        {showCreatePassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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
              <TextField
                select
                label="Sede"
                value={formState.sede}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    sede: event.target.value,
                  }))
                }
                fullWidth
                SelectProps={{ displayEmpty: true }}
                helperText="Selecciona la sede asignada"
              >
                <MenuItem value=""></MenuItem>
                {BRANCH_LOCATIONS.map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.isGerente}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        isGerente: event.target.checked,
                      }))
                    }
                  />
                }
                label="Asignar rol de gerente"
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
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreateDialog} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Guardando…" : "Crear usuario"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(editTarget)}
        onClose={editSubmitting ? undefined : closeEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Usuario"
                value={editForm?.username ?? ""}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          username: event.target.value,
                        }
                      : prev
                  )
                }
                required
                fullWidth
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={editForm?.email ?? ""}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          email: event.target.value,
                        }
                      : prev
                  )
                }
                fullWidth
              />
              <TextField
                label="Nombre completo"
                value={editForm?.fullname ?? ""}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, fullname: event.target.value } : prev
                  )
                }
                fullWidth
              />
              <TextField
                select
                label="Sede"
                value={editForm?.sede ?? ""}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, sede: event.target.value } : prev
                  )
                }
                fullWidth
                SelectProps={{ displayEmpty: true }}
                helperText="Selecciona la sede asignada"
              >
                <MenuItem value=""></MenuItem>
                {editSedeOptions.map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Nueva contraseña"
                type={showEditPassword ? "text" : "password"}
                helperText="dejalo en blanco para no cambiarla"
                value={editForm?.password ?? ""}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showEditPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        onClick={() => setShowEditPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showEditPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, password: event.target.value } : prev
                  )
                }
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm?.isAdmin ?? false}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              isAdmin: event.target.checked,
                            }
                          : prev
                      )
                    }
                    disabled={disableSelfManagement.has(editTarget?.id ?? "")}
                  />
                }
                label="Permisos de administrador"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editForm?.isGerente ?? false}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, isGerente: event.target.checked }
                          : prev
                      )
                    }
                    disabled={disableSelfManagement.has(editTarget?.id ?? "")}
                  />
                }
                label="Rol de gerente"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm?.isActive ?? false}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, isActive: event.target.checked }
                          : prev
                      )
                    }
                    disabled={disableSelfManagement.has(editTarget?.id ?? "")}
                  />
                }
                label="Cuenta activa"
              />
              {editError && <Alert severity="error"> {editError} </Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog} disabled={editSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={editSubmitting}>
              {editSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar usuario</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            ¿Confirmas que deseas eliminar la cuenta "{deleteTarget?.username}"?
            Esta accion no se puede deshacer
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={updatingUserId !== null}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            disabled={updatingUserId !== null}
          >
            Borrar usuario
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default UsersAdmin;
