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
  sortedItems: Item[];
  filteredItems: Item[];
  formatCurrency: (value: number | string) => string;
}

const ListaPreciosTable = ({
  loading,
  error,
  sortedItems,
  filteredItems,
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

  if (!sortedItems.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No se encontraron productos para mostrar
      </Typography>
    );
  }

  if (!filteredItems.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No se encontraron productos que coincidan con tu busqueda
      </Typography>
    );
  }

  return (
    <TableContainer sx={{ borderRadius: 3 }}>
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
          {filteredItems.map((item) => (
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
