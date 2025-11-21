import React from "react";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  EspecieKey,
  resolveMaterialOptions,
  ResolvedMaterialOption,
} from "../../data/materialesTaller";
import { Item } from "../../types";

const speciesLabels: Record<EspecieKey, string> = {
  res: "Res",
  cerdo: "Cerdo",
};

interface MaterialSelectorProps {
  items: Item[];
  selectedSpecies: EspecieKey | null;
  onSpeciesChange: (species: EspecieKey) => void;
  selectedItemId: string;
  onSelectMaterial: (itemId: string) => void;
  open: boolean;
  onToggle: () => void;
  loadingItems: boolean;
}

const MaterialButton = ({
  option,
  onSelect,
  selectedId,
}: {
  option: ResolvedMaterialOption;
  onSelect: (itemId: string) => void;
  selectedId: string;
}) => {
  const isSelected = option.item && selectedId === String(option.item.id);
  const isDisabled = !option.item;

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      <Button
        variant={isSelected ? "contained" : "outlined"}
        color={option.config.principal ? "secondary" : "inherit"}
        disabled={isDisabled}
        onClick={() => option.item && onSelect(String(option.item.id))}
        sx={{ justifyContent: "flex-start" }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight={600}>{option.config.label}</Typography>
          {option.item && (
            <Typography variant="body2" color="text.secondary">
              {option.item.descripcion} · {option.item.codigo_producto}
            </Typography>
          )}
          {!option.item && (
            <Typography variant="body2" color="error">
              No encontrado en API
            </Typography>
          )}
        </Stack>
      </Button>
      {option.children && option.children.length > 0 && (
        <Stack pl={2} spacing={1}>
          {option.children.map((child) => (
            <MaterialButton
              key={child.config.label}
              option={child}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

const MaterialSelector = ({
  items,
  selectedSpecies,
  onSpeciesChange,
  selectedItemId,
  onSelectMaterial,
  open,
  onToggle,
  loadingItems,
}: MaterialSelectorProps) => {
  const speciesToUse = selectedSpecies ?? "res";
  const resolvedOptions = resolveMaterialOptions(items, speciesToUse);

  return (
    <Stack spacing={2}>
      <Button
        variant="contained"
        size="large"
        onClick={onToggle}
        disabled={loadingItems}
      >
        Registrar nuevo taller
      </Button>

      <Collapse in={open} unmountOnExit>
        <PaperSection>
          <Stack spacing={2}>
            <Typography variant="h6">Selecciona el material</Typography>
            <Typography variant="body2" color="text.secondary">
              Primero elige la especie y luego el corte principal o subcorte al
              que quieres asociar el taller.
            </Typography>

            <Stack direction="row" spacing={2}>
              {(Object.keys(speciesLabels) as EspecieKey[]).map((key) => (
                <Button
                  key={key}
                  variant={speciesToUse === key ? "contained" : "outlined"}
                  onClick={() => onSpeciesChange(key)}
                >
                  {speciesLabels[key]}
                </Button>
              ))}
            </Stack>

            <Divider />

            <Grid container spacing={2}>
              {resolvedOptions.map((option) => (
                <Grid item xs={12} md={6} key={option.config.label}>
                  <MaterialButton
                    option={option}
                    onSelect={onSelectMaterial}
                    selectedId={selectedItemId}
                  />
                </Grid>
              ))}
            </Grid>

            <Alert severity="info">
              Si algún material aparece deshabilitado es porque no se encontró
              en la lista de materiales disponibles de la API. Verifica que el
              código y la descripción coincidan con el catálogo.
            </Alert>
          </Stack>
        </PaperSection>
      </Collapse>
    </Stack>
  );
};

const PaperSection = ({ children }: { children: React.ReactNode }) => (
  <Box
    component={"div"}
    sx={{
      border: 1,
      borderColor: "divider",
      borderRadius: 2,
      p: { xs: 2, md: 3 },
      backgroundColor: "background.paper",
    }}
  >
    {children}
  </Box>
);

export default MaterialSelector;
