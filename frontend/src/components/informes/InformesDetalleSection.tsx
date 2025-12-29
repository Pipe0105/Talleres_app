import { Alert, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import PageSection from "../PageSection";
import InformesResumen from "./InformesResumen";
import InformesTabla, {
  InformesMaterialComparisonGroup,
  InformesTallerCalculoGroup,
} from "./InformesTabla";

interface ResumenData {
  totalPeso: number;
  totalValor: number;
  cortes: number;
  talleres: number;
}

interface InformesDetalleSectionProps {
  scope: "taller" | "sede" | "material" | "comparar";
  selectedTallerIdsLength: number;
  filteredCalculoLength: number;
  loadingCalculo: boolean;
  resumen: ResumenData;
  groupedCalculo: InformesTallerCalculoGroup[] | InformesMaterialComparisonGroup[];
  formatTallerId: (value: number) => string;
  formatCorteNombre: (value: string) => string;
  formatCurrencyOrNA: (value: number | null) => string;
  pesoFormatter: Intl.NumberFormat;
  porcentajeFormatter: Intl.NumberFormat;
  totalPesoLabel: string;
  totalValorLabel: string;
}

const InformesDetalleSection = ({
  scope,
  selectedTallerIdsLength,
  filteredCalculoLength,
  loadingCalculo,
  resumen,
  groupedCalculo,
  formatTallerId,
  formatCorteNombre,
  formatCurrencyOrNA,
  pesoFormatter,
  porcentajeFormatter,
  totalPesoLabel,
  totalValorLabel,
}: InformesDetalleSectionProps) => (
  <PageSection
    title={scope === "comparar" ? "Detalle comparativo de talleres" : "Detalle de los talleres"}
    description={
      scope === "comparar"
        ? "Contrasta subcortes entre talleres completos usando los filtros aplicados."
        : "Visualiza el desempeño por corte con los filtros aplicados."
    }
  >
    <Stack spacing={2.5}>
      {!selectedTallerIdsLength ? (
        <Alert severity="info">Selecciona un taller o ajusta el alcance para ver su detalle.</Alert>
      ) : null}

      {selectedTallerIdsLength && loadingCalculo ? (
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2">Cargando detalle de los talleres seleccionados...</Typography>
        </Stack>
      ) : null}

      {selectedTallerIdsLength && !loadingCalculo && filteredCalculoLength === 0 ? (
        <Alert severity="warning">
          No se encontraron cortes que coincidan con los filtros aplicados.
        </Alert>
      ) : null}

      {filteredCalculoLength ? (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <InformesResumen
            scope={scope}
            totalCortes={resumen.cortes}
            totalTalleres={resumen.talleres}
            totalPesoLabel={totalPesoLabel}
            totalValorLabel={totalValorLabel}
          />
          <InformesTabla
            scope={scope}
            groupedCalculo={groupedCalculo}
            formatTallerId={formatTallerId}
            formatCorteNombre={formatCorteNombre}
            formatCurrencyOrNA={formatCurrencyOrNA}
            pesoFormatter={pesoFormatter}
            porcentajeFormatter={porcentajeFormatter}
          />
        </Paper>
      ) : null}
    </Stack>
  </PageSection>
);

export default InformesDetalleSection;
