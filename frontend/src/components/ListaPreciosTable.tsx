import { ReactNode } from "react";
import {
  Alert,
  AlertTitle,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { Item } from "../types";

interface ListaPreciosTableProps {
  loading: boolean;
  error: string | null;
  items: Item[];
  visibleItems: Item[];
  formatCurrency: (value: number | string) => string;
}

const ListaPreciosTable = ({
  loading,
  error,
  items,
  visibleItems,
  formatCurrency,
}: ListaPreciosTableProps): ReactNode => {
  if (loading) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Cargando lista de precios....
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error al cargar</AlertTitle>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Alert>
    );
  }

  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No se encontraron productos para mostrar
      </Typography>
    );
  }

  if (!visibleItems.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No se encontraron productos que coincidan con tu busqueda
      </Typography>
    );
  }

  return (
    <TableContainer
      sx={{
        borderRadius: 3,
        overflowX: "auto",
        width: "100%",
        boxShadow: "inset 0 0 0 1px rgba(15, 41, 69, 0.1)",
        "& table": { minWidth: 650 },
      }}
    >
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell width="20%">Codigo</TableCell>
            <TableCell width="55%">Producto</TableCell>
            <TableCell align="right" width="25%">
              Precio unitario
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleItems.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {item.codigo_producto}
              </TableCell>
              <TableCell>
                <Typography variant="body2">{item.descripcion}</Typography>
              </TableCell>
              <TableCell align="right">{formatCurrency(item.precio)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ListaPreciosTable;
