import { ReactNode } from "react";
import {
  Alert,
  AlertTitle,
  Button,
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
  visibleItems: Item[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  formatCurrency: (value: number | string) => string;
  isCompact?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

const ListaPreciosTable = ({
  loading,
  error,
  visibleItems,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  formatCurrency,
  isCompact = false,
  hasActiveFilters = false,
  onClearFilters,
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
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="body2" color="text.secondary">
          {hasActiveFilters
            ? "No hay resultados para los filtros actuales."
            : "No se encontraron productos para mostrar."}
        </Typography>
        {hasActiveFilters && onClearFilters ? (
          <Button variant="outlined" size="small" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        ) : null}
      </Stack>
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
            {!isCompact && <TableCell width="10%">Especie</TableCell>}
            {!isCompact && <TableCell width="10%">Unidad</TableCell>}
            <TableCell width="10%">Lista</TableCell>
            <TableCell width="15%">Sede</TableCell>
            {!isCompact && <TableCell width="15%">Fecha vigencia</TableCell>}
            <TableCell align="right" width="20%">
              Precio unitario
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleItems.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{item.codigo_producto}</TableCell>
              <TableCell>
                <Typography variant="body2">{item.descripcion}</Typography>
              </TableCell>
              {!isCompact && <TableCell>{item.especie ?? "—"}</TableCell>}
              {!isCompact && <TableCell>{item.unidad ?? "—"}</TableCell>}
              <TableCell>{item.lista_id ?? "—"}</TableCell>
              <TableCell>{item.sede ?? item.location ?? "—"}</TableCell>
              {!isCompact && <TableCell>{item.fecha_vigencia ?? "—"}</TableCell>}
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
