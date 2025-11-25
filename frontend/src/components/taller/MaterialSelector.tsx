import React from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
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
    <Button
      variant={isSelected ? "contained" : "outlined"}
      color={option.config.principal ? "secondary" : "inherit"}
      disabled={isDisabled}
      onClick={() => option.item && onSelect(String(option.item.id))}
      sx={{
        justifyContent: "flex-start",
        textAlign: "left",
        p: 1.5,
        minHeight: 110,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        boxShadow: isSelected ? 4 : 0,
        borderStyle: "solid",
        borderWidth: 1,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <Typography fontWeight={700} variant="body1">
          {option.config.label}
        </Typography>
        {option.config.principal && (
          <Chip
            size="small"
            color="secondary"
            label="Principal"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Stack>
      {option.item ? (
        <Stack spacing={0.5} sx={{ width: "100%" }}>
          <Typography variant="body2" fontWeight={600}>
            {option.item.descripcion}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Codigo: {option.item.codigo_producto}
          </Typography>
        </Stack>
      ) : (
        <Alert severity="warning" sx={{ width: "100%", m: 0 }}>
          No encontrado en API. Verifica el codigo y la descripcion
        </Alert>
      )}
    </Button>
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
  const filteredOptions = resolvedOptions.filter((option) => option.item);

  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <Typography variant="h6">Alta de talleres</Typography>
        <Typography variant="body2" color="text.secondary">
          Abre el selector para elegir el material antes de llenar el
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

      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 3, p: { xs: 2.5, sm: 3 } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
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
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={1}>
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

            {filteredOptions.length ? (
              <Grid container spacing={2}>
                {filteredOptions.map((option) => (
                  <Grid item xs={12} md={6} key={option.config.label}>
                    <MaterialButton
                      option={option}
                      onSelect={onSelectMaterial}
                      selectedId={selectedItemId}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="warning">
                No se encontraron materiales disponibles en la API para esta
                especie. Verifica que el catálogo esté actualizado.
              </Alert>
            )}

            <Alert severity="info">
              Solo se muestran los materiales encontrados en la API para
              mantener el selector ordenado y evitar opciones inválidas.
            </Alert>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default MaterialSelector;
