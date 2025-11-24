import React from "react";
import {
  Alert,
  Box,
  Button,
  Drawer,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

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
  onOpen: () => void;
  onClose: () => void;
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
  onOpen,
  onClose,
  loadingItems,
}: MaterialSelectorProps) => {
  const speciesToUse = selectedSpecies ?? "res";
  const resolvedOptions = resolveMaterialOptions(items, speciesToUse);

  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <Typography variant="h6">Alta de talleres</Typography>
        <Typography variant="body2" color="text.secondary">
          Abre el menú lateral para seleccionar el material antes de llenar el
          formulario.
        </Typography>
      </Stack>
      <Button
        variant="contained"
        size="large"
        onClick={onOpen}
        disabled={loadingItems}
      >
        Registrar nuevo taller
      </Button>

      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: "100vw", sm: 520 } } }}
      >
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: { xs: 2, sm: 3 },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ flex: 1 }}>
              Selecciona el material
            </Typography>
            <IconButton aria-label="Cerrar selector" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Primero elige la especie y luego el corte principal al que quieres
            asociar el taller.
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
            Si algún material aparece deshabilitado es porque no se encontró en
            la lista de materiales disponibles de la API. Verifica que el código
            y la descripción coincidan con el catálogo.
          </Alert>
        </Box>
      </Drawer>
    </Stack>
  );
};

export default MaterialSelector;
