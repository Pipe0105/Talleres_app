import {
  Box,
  Chip,
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
import dayjs from "dayjs";
import { alpha } from "@mui/material/styles";
import { CorteCalculado, TallerGrupoCalculado } from "../utils/talleres";

interface TallerBreakdownCardProps {
  breakdown: TallerGrupoCalculado;
}

const formatKg = (valor: number): string =>
  valor.toLocaleString("es-CL", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatPct = (valor: number): string =>
  valor.toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const CorteRow = ({ corte }: { corte: CorteCalculado }) => (
  <TableRow
    sx={{
      "&:last-of-type td, &:last-of-type th": { border: 0 },
      bgcolor: corte.esPrincipal ? "action.hover" : undefined,
    }}
  >
    <TableCell component="th" scope="row">
      <Stack spacing={0.5}>
        <Typography fontWeight={corte.esPrincipal ? 700 : 600}>
          {corte.nombre}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Código {corte.codigo}
        </Typography>
      </Stack>
    </TableCell>
    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
      {formatKg(corte.peso)} kg
    </TableCell>
    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
      {formatPct(corte.porcentaje)}%
    </TableCell>
  </TableRow>
);

const TallerBreakdownCard = ({ breakdown }: TallerBreakdownCardProps) => {
  const fechaFormateada = dayjs(breakdown.fecha).isValid()
    ? dayjs(breakdown.fecha).format("DD/MM/YYYY")
    : breakdown.fecha;

  const porcentajeTotal = breakdown.cortes.reduce(
    (acum, corte) => acum + corte.porcentaje,
    0
  );

  return (
    <Paper sx={{ p: { xs: 3, md: 4 } }} elevation={0}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Typography variant="overline" color="text.secondary">
              Taller {breakdown.grupo.replace(/_/g, " ")}
            </Typography>
            <Typography variant="h5">{breakdown.productoPrincipal}</Typography>
            <Typography variant="body2" color="text.secondary">
              Fecha {fechaFormateada}
            </Typography>
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
          >
            <Chip
              label={`Responsable · ${breakdown.responsable || "Sin registro"}`}
              color="primary"
              variant="outlined"
            />
            {breakdown.codigoPrincipal != null && (
              <Chip
                label={`Código ${breakdown.codigoPrincipal}`}
                color="secondary"
                variant="outlined"
              />
            )}
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box
            sx={(theme) => ({
              flex: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            })}
          >
            <Typography variant="caption" color="primary">
              Peso inicial
            </Typography>
            <Typography variant="h6">
              {formatKg(breakdown.pesoInicial)} kg
            </Typography>
          </Box>
          <Box
            sx={(theme) => ({
              flex: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.secondary.main, 0.08),
            })}
          >
            <Typography variant="caption" color="secondary">
              Total procesado
            </Typography>
            <Typography variant="h6">
              {formatKg(breakdown.pesoProcesado)} kg ·{" "}
              {formatPct(breakdown.porcentajeProcesado)}%
            </Typography>
          </Box>
          <Box
            sx={(theme) => ({
              flex: 1,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
            })}
          >
            <Typography variant="caption" color="warning.main">
              Merma / Ajuste
            </Typography>
            <Typography variant="h6">
              {formatKg(breakdown.mermaKg)} kg ·{" "}
              {formatPct(breakdown.mermaPorcentaje)}%
            </Typography>
          </Box>
        </Stack>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Corte</TableCell>
                <TableCell align="right">Peso (kg)</TableCell>
                <TableCell align="right">% sobre inicial</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {breakdown.cortes.map((corte) => (
                <CorteRow key={corte.id} corte={corte} />
              ))}
              <TableRow>
                <TableCell component="th" scope="row">
                  <Typography fontWeight={700}>Total procesado</Typography>
                </TableCell>
                <TableCell align="right">
                  {formatKg(breakdown.pesoProcesado)} kg
                </TableCell>
                <TableCell align="right">
                  {formatPct(breakdown.porcentajeProcesado)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  <Typography fontWeight={700}>Merma / Ajuste</Typography>
                </TableCell>
                <TableCell align="right">
                  {formatKg(breakdown.mermaKg)} kg
                </TableCell>
                <TableCell align="right">
                  {formatPct(breakdown.mermaPorcentaje)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  <Typography fontWeight={700}>
                    % acumulado de cortes
                  </Typography>
                </TableCell>
                <TableCell align="right">—</TableCell>
                <TableCell align="right">
                  {formatPct(porcentajeTotal)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  );
};

export default TallerBreakdownCard;
