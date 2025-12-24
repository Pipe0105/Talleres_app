import SearchIcon from "@mui/icons-material/Search";
import { InputAdornment, Stack, TextField } from "@mui/material";
import PageSection from "../PageSection";

interface InformeFiltersProps {
  searchQuery: string;
  minPeso: string;
  maxPeso: string;
  disabled?: boolean;
  onSearchChange: (value: string) => void;
  onMinPesoChange: (value: string) => void;
  onMaxPesoChange: (value: string) => void;
}

const InformeFilters = ({
  searchQuery,
  minPeso,
  maxPeso,
  disabled = false,
  onSearchChange,
  onMinPesoChange,
  onMaxPesoChange,
}: InformeFiltersProps) => (
  <PageSection
    title="Filtros y búsqueda"
    description="Aplica filtros rápidos para concentrarte en los cortes y métricas que necesitas revisar."
    padding="compact"
  >
    <Stack spacing={2.5}>
      <TextField
        label="Buscar corte"
        placeholder="Ej: sobrebarriga o referencia del ítem"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        helperText="Busca por nombre, descripción o código del ítem"
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flex={1}>
          <TextField
            label="Peso mínimo (KG)"
            type="number"
            value={minPeso}
            onChange={(event) => onMinPesoChange(event.target.value)}
            inputProps={{ min: 0, step: "0.001" }}
            helperText="Muestra cortes con peso igual o superior al valor"
            disabled={disabled}
            fullWidth
          />
          <TextField
            label="Peso máximo (KG)"
            type="number"
            value={maxPeso}
            onChange={(event) => onMaxPesoChange(event.target.value)}
            inputProps={{ min: 0, step: "0.001" }}
            helperText="Muestra cortes con peso igual o inferior al valor"
            disabled={disabled}
            fullWidth
          />
        </Stack>
      </Stack>
    </Stack>
  </PageSection>
);

export default InformeFilters;
