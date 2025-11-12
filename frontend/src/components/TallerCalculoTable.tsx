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
} from "@mui/material";

import { TallerCalculoRow } from "../types";

interface TallerCalculoTableProps {
  titulo?: string;
  calculo: TallerCalculoRow[];
  observaciones?: string | null;
  unidadBase?: string;
}

const numberFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const weightFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const TallerCalculoTable = ({
  titulo = "Detalle del taller",
  calculo,
  observaciones,
  unidadBase = "KG",
}: TallerCalculoTableProps) => {
  const totalPeso = calculo.length ? calculo[0].peso_total : 0;
  const totalValor = calculo.reduce(
    (acum, row) => acum + row.valor_estimado,
    0
  );

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <div>
          <Typography variant="h6" component="h3">
            {titulo}
          </Typography>
          {observaciones && (
            <Typography variant="body2" color="text.secondary">
              {observaciones}
            </Typography>
          )}
        </div>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="right">Corte</TableCell>
                <TableCell align="right">Descripcion</TableCell>
                <TableCell align="right">Peso ({unidadBase})</TableCell>
                <TableCell align="right">% Real</TableCell>
                <TableCell align="right">% objetivo</TableCell>
                <TableCell align="right">Δ %</TableCell>
                <TableCell align="right">Valor estimado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calculo.map((row) => (
                <TableRow key={`${row.taller_id}-${row.nombre_corte}`} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {row.nombre_corte}
                  </TableCell>
                  <TableCell>{row.descripcion}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {weightFormatter.format(row.peso)}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {numberFormatter.format(row.porcentaje_real)}%
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {numberFormatter.format(row.porcentaje_default)}%
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {numberFormatter.format(row.delta_pct)}%
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {currencyFormatter.format(row.valor_estimado)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} align="right">
                  <Typography fontWeight={600}>Total procesado</Typography>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  {weightFormatter.format(totalPeso)}
                </TableCell>
                <TableCell colSpan={2} />
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  {numberFormatter.format(
                    calculo.reduce((acc, row) => acc + row.porcentaje_real, 0)
                  )}
                  %
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  {currencyFormatter.format(totalValor)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  );
};

export default TallerCalculoTable;
