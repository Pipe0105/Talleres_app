import {
  Alert,
  Autocomplete,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import PageSection from "../PageSection";
import PageHeader from "../PageHeader";
import { ReactNode } from "react";

export interface TallerOption {
  id: string;
  label: string;
}

interface TallerSelectionCardProps {
  title?: string;
  description?: string;
  options: TallerOption[];
  value: TallerOption | null;
  loading?: boolean;
  error?: string | null;
  helperText?: ReactNode;
  onChange: (taller: TallerOption | null) => void;
  onRetry?: () => void;
}

const TallerSelectionCard = ({
  title = "Selecciona un taller",
  description = "Busca por material o fecha para revisar el reparto de cortes y sus indicadores de desempeño.",
  options,
  value,
  loading = false,
  error,
  helperText,
  onChange,
  onRetry,
}: TallerSelectionCardProps) => {
  return (
    <PageSection
      title={<PageHeader title={title} description={description} />}
      description={null}
      spacing={2.5}
    >
      <Stack spacing={1.5}>
        <Autocomplete
          value={value}
          options={options}
          loading={loading}
          onChange={(_, selected) => onChange(selected)}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, optionValue) =>
            option.id === optionValue.id
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Taller"
              placeholder="Ej: Material o rango de fechas"
              helperText={
                helperText ??
                "Puedes escribir el nombre del material o la fecha de fabricación para encontrar el taller."
              }
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {error ? (
          <Alert
            severity="error"
            action={
              onRetry ? (
                <ReplayIcon
                  fontSize="small"
                  role="button"
                  aria-label="Reintentar"
                  onClick={onRetry}
                />
              ) : undefined
            }
          >
            {error}
          </Alert>
        ) : null}

        {!loading && !options.length && !error ? (
          <Alert severity="info">
            No hay talleres registrados aún. Crea uno desde la sección de
            talleres para visualizarlo aquí.
          </Alert>
        ) : null}
      </Stack>
    </PageSection>
  );
};

export default TallerSelectionCard;
