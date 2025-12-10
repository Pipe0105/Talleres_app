import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
} from "@mui/material";

import { TallerListItem } from "../../types";

const pesoFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

interface TallerListProps {
  talleres: TallerListItem[];
  selectedTallerId: string | null;
  emptyMessage: string;
  onSelect: (tallerId: string) => void;
  loading?: boolean;
}

const TallerList = ({
  talleres,
  selectedTallerId,
  emptyMessage,
  onSelect,
  loading = false,
}: TallerListProps) => (
  <Paper sx={{ flex: 1, p: { sx: 3, md: 4 } }}>
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        Talleres registrados
      </Typography>
      {loading ? (
        <Stack spacing={1} alignItems="center" py={2}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Cargando talleres...
          </Typography>
        </Stack>
      ) : talleres.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripcion</TableCell>
                <TableCell align="right">Total procesado (kg)</TableCell>
                <TableCell align="right"># Detalles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {talleres.map((taller) => (
                <TableRow
                  key={taller.id}
                  hover
                  selected={taller.id === selectedTallerId}
                  onClick={() => onSelect(taller.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography noWrap title={taller.nombre_taller}>
                      {taller.nombre_taller}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      title={taller.descripcion ?? "Sin descripcion"}
                    >
                      {taller.descripcion ?? "Sin descripcion"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {pesoFormatter.format(taller.total_peso)}
                  </TableCell>
                  <TableCell align="right">{taller.detalles_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  </Paper>
);

export default TallerList;
