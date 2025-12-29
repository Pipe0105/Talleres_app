import {
  Alert,
  Autocomplete,
  Chip,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PageSection from "../PageSection";
import type { TallerOption } from "./TallerSelectionCard";

type InformeScope = "taller" | "sede" | "material" | "comparar";

type MaterialOption = {
  codigo: string;
  nombre: string | null;
  label: string;
};

type TallerCompleto = {
  id: number;
  nombre: string;
  sede: string | null;
};

interface InformesScopeSectionProps {
  scope: InformeScope;
  selectedTaller: TallerOption | null;
  selectedMaterial: MaterialOption | null;
  selectedSedes: string[];
  selectedCompareTalleres: TallerOption[];
  selectedTallerIds: string[];
  availableSedes: string[];
  individualTallerOptions: TallerOption[];
  materialOptions: MaterialOption[];
  selectedTalleresCompletos: TallerCompleto[];
  compareSelectionDetails: {
    id: string;
    label: string;
    sedes: string[];
  }[];
  compareSelectionError: string | null;
  compareTallerSedesById: Record<string, string[]>;
  loading: boolean;
  error: string | null;
  onScopeChange: (value: InformeScope) => void;
  onSelectedTallerChange: (value: TallerOption | null) => void;
  onSelectedMaterialChange: (value: MaterialOption | null) => void;
  onSelectedSedesChange: (value: string[]) => void;
  onSelectedCompareTalleresChange: (value: TallerOption[]) => void;
  formatTallerId: (value: number) => string;
}

const InformesScopeSection = ({
  scope,
  selectedTaller,
  selectedMaterial,
  selectedSedes,
  selectedCompareTalleres,
  selectedTallerIds,
  availableSedes,
  individualTallerOptions,
  materialOptions,
  selectedTalleresCompletos,
  compareSelectionDetails,
  compareSelectionError,
  compareTallerSedesById,
  loading,
  error,
  onScopeChange,
  onSelectedTallerChange,
  onSelectedMaterialChange,
  onSelectedSedesChange,
  onSelectedCompareTalleresChange,
  formatTallerId,
}: InformesScopeSectionProps) => {
  const selectedCompareSedes =
    selectedCompareTalleres.length === 1
      ? (compareTallerSedesById[selectedCompareTalleres[0].id] ?? [])
      : [];

  return (
    <PageSection
      title="Alcance del informe"
      description="Elige si quieres analizar un taller individual, todas las operaciones de una sede, comparar un material entre sedes o contrastar talleres con un informe comparativo."
      spacing={2.5}
    >
      <Stack spacing={2.5}>
        <ToggleButtonGroup
          value={scope}
          exclusive
          onChange={(_, value) => {
            if (value) {
              onScopeChange(value);
            }
          }}
          aria-label="Alcance del informe"
          size="small"
        >
          <ToggleButton value="taller">Taller individual</ToggleButton>
          <ToggleButton value="sede">Sede</ToggleButton>
          <ToggleButton value="material">Material</ToggleButton>
          <ToggleButton value="comparar">Comparar talleres</ToggleButton>
        </ToggleButtonGroup>

        {scope === "taller" ? (
          <Autocomplete
            value={selectedTaller}
            options={individualTallerOptions}
            loading={loading}
            onChange={(_, selected) => onSelectedTallerChange(selected)}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, optionValue) => option.id === optionValue.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Taller"
                placeholder="Ej: Material o rango de fechas"
                helperText="Selecciona un taller específico o cambia el alcance para comparar varios."
              />
            )}
          />
        ) : scope === "comparar" ? (
          <Stack spacing={1.5}>
            <Autocomplete
              multiple
              value={selectedCompareTalleres}
              options={individualTallerOptions}
              loading={loading}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, optionValue) => option.id === optionValue.id}
              getOptionDisabled={(option) => {
                const isSelected = selectedCompareTalleres.some(
                  (selected) => selected.id === option.id
                );
                if (isSelected) {
                  return false;
                }
                if (selectedCompareTalleres.length >= 2) {
                  return true;
                }
                if (selectedCompareSedes.length) {
                  const optionSedes = compareTallerSedesById[option.id] ?? [];
                  return optionSedes.some((sede) => selectedCompareSedes.includes(sede));
                }
                return false;
              }}
              onChange={(_, values) => onSelectedCompareTalleresChange(values.slice(-2))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Talleres a comparar"
                  placeholder="Selecciona hasta 2 talleres"
                  helperText="Selecciona dos talleres de sedes distintas para generar un informe comparativo."
                />
              )}
            />

            <Typography variant="body2" color="text.secondary">
              {selectedTallerIds.length
                ? `Se compararán ${selectedTallerIds.length} talleres en el informe.`
                : "Selecciona dos talleres para iniciar la comparación."}
            </Typography>

            {compareSelectionDetails.length ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {compareSelectionDetails.map((detail) => (
                  <Chip
                    key={detail.id}
                    label={`${detail.label}${
                      detail.sedes.length ? ` · ${detail.sedes.join(", ")}` : ""
                    }`}
                    size="small"
                  />
                ))}
              </Stack>
            ) : null}

            {selectedTalleresCompletos.length ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {selectedTalleresCompletos.map((taller) => (
                  <Chip
                    key={taller.id}
                    label={`Taller completo ${formatTallerId(taller.id)} · ${taller.nombre}${
                      taller.sede ? ` · ${taller.sede}` : ""
                    }`}
                    size="small"
                  />
                ))}
              </Stack>
            ) : selectedTallerIds.length ? (
              <Typography variant="body2" color="text.secondary">
                No hay talleres completos disponibles en el alcance seleccionado.
              </Typography>
            ) : null}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {scope === "material" ? (
              <Autocomplete
                value={selectedMaterial}
                options={materialOptions}
                onChange={(_, value) => onSelectedMaterialChange(value)}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Material principal"
                    placeholder="Ej: codigo o nombre del ítem"
                    helperText="Elige el material que deseas comparar entre sedes."
                  />
                )}
              />
            ) : null}

            <Autocomplete
              multiple
              disableCloseOnSelect
              value={
                scope === "sede" && selectedSedes.length === 0 ? availableSedes : selectedSedes
              }
              options={availableSedes}
              onChange={(_, values) => onSelectedSedesChange(values)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return <Chip key={key ?? option} label={option} size="small" {...tagProps} />;
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sedes"
                  placeholder="Selecciona una o más sedes"
                  helperText={
                    scope === "sede"
                      ? "Si no eliges sedes se incluirán todas."
                      : "Usa sedes para acotar la comparacion del material."
                  }
                />
              )}
            />
            <Typography variant="body2" color="text.secondary">
              {scope === "material" && !selectedMaterial
                ? "Selecciona un material para ver los talleres disponibles."
                : selectedTallerIds.length
                  ? `Se incluirán ${selectedTallerIds.length} talleres en el informe.`
                  : "Ajusta los filtros de alcance para incluir talleres en el informe."}
            </Typography>
            {selectedTalleresCompletos.length ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {selectedTalleresCompletos.map((taller) => (
                  <Chip
                    key={taller.id}
                    label={`Taller completo ${formatTallerId(taller.id)} · ${taller.nombre}${
                      taller.sede ? ` · ${taller.sede}` : ""
                    }`}
                    size="small"
                  />
                ))}
              </Stack>
            ) : selectedTallerIds.length ? (
              <Typography variant="body2" color="text.secondary">
                No hay talleres completos disponibles en el alcance seleccionado.
              </Typography>
            ) : null}
          </Stack>
        )}

        {compareSelectionError ? <Alert severity="warning">{compareSelectionError}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Stack>
    </PageSection>
  );
};

export default InformesScopeSection;
