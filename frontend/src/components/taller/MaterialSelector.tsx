import React from "react";
import {
  Alert,
  Button,
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
const limpiarDescripcion = (texto = "") => {
  return texto
    .split(" ")
    .filter((palabra) => !palabra.toUpperCase().includes("KILO"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
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
  locked: boolean;
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
        width: "100%",
        height: "100%",
        borderRadius: 2,
        display: "flex",
        alignItems: "stretch",
        boxShadow: isSelected ? 4 : 0,
        borderStyle: "solid",
        borderWidth: 1,
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1, sm: 2 }}
        alignItems="stretch"
        sx={{ width: "100%" }}
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            minWidth: { sm: 220 },
            maxWidth: { sm: 200 },
            textAlign: "center",
          }}
        >
          <Typography fontWeight={700} variant="subtitle1">
            {option.config.label}
          </Typography>
        </Stack>

        {option.item ? (
          <Stack spacing={0.5} justifyContent="center" sx={{ width: "100%" }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography variant="subtitle1" color="text.secondary">
                Codigo:
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {option.item.codigo_producto}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Alert severity="warning" sx={{ width: "100%", m: 0 }}>
            No encontrado en API. Verifica el codigo y la descripcion
          </Alert>
        )}
      </Stack>
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
  locked,
}: MaterialSelectorProps) => {
  const speciesToUse = selectedSpecies ?? "res";
  const resolvedOptions = resolveMaterialOptions(items, speciesToUse);
  const filteredOptions = resolvedOptions.filter(
    (option) => option.item && option.config.principal
  );

  return (
    <Stack spacing={2}>
      {locked ? (
        <Alert severity="info" sx={{ m: 0 }}>
          Guarda el taller actual para registrar uno nuevo.
        </Alert>
      ) : (
        <Button
          variant="contained"
          size="large"
          onClick={onOpen}
          disabled={loadingItems}
        >
          Registrar nuevo taller
        </Button>
      )}

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
                  <Grid
                    item
                    xs={12}
                    md={6}
                    key={option.config.label}
                    sx={{ display: "flex", height: "100%" }}
                  >
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
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default MaterialSelector;
