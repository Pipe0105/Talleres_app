import { Stack, TextField } from "@mui/material";
import PageSection from "../PageSection";

interface InformesDateFilterSectionProps {
  dateFrom: string;
  dateTo: string;
  loading: boolean;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

const InformesDateFilterSection = ({
  dateFrom,
  dateTo,
  loading,
  onDateFromChange,
  onDateToChange,
}: InformesDateFilterSectionProps) => (
  <PageSection
    title="Filtrar talleres por fecha"
    description="Acota la lista de talleres antes de seleccionar el informe."
    padding="compact"
  >
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <TextField
        label="Fecha desde"
        type="date"
        value={dateFrom}
        onChange={(event) => onDateFromChange(event.target.value)}
        helperText="Filtra por fecha"
        disabled={loading}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <TextField
        label="Fecha hasta"
        type="date"
        value={dateTo}
        onChange={(event) => onDateToChange(event.target.value)}
        helperText="Filtra por fecha"
        disabled={loading}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
    </Stack>
  </PageSection>
);

export default InformesDateFilterSection;
