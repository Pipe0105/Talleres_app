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
  TablePagination,
  Typography,
} from "@mui/material";

import { Item } from "../types";

interface ListaPreciosTableProps {
  loading: boolean;
  error: string | null;
  items: Item[];
  visibleItems: Item[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  formatCurrency: (value: number | string) => string;
}

const ListaPreciosTable = ({
  loading,
  error,
  items,
  visibleItems,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
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

  if (!totalItems) {
    return (
      <Typography variant="body2" color="text.secondary">
        No se encontraron productos para mostrar
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
            <TableCell width="35%">Producto</TableCell>
            <TableCell width="10%">Lista</TableCell>
            <TableCell width="15%">Sede</TableCell>
            <TableCell align="right" width="20%">
              Precio unitario
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{item.codigo_producto}</TableCell>
              <TableCell>
                <Typography variant="body2">{item.descripcion}</Typography>
              </TableCell>
              <TableCell>{item.lista_id ?? "—"}</TableCell>
              <TableCell>{item.sede ?? item.location ?? "—"}</TableCell>
              <TableCell align="right">
                {item.precio == null ? "N/D" : formatCurrency(item.precio)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={totalItems}
        page={Math.max(-1, 0)}
        onPageChange={(_, nextPage) => onPageChange(nextPage + 1)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </TableContainer>
  );
};

export default ListaPreciosTable;
