import TableRowsIcon from "@mui/icons-material/TableRows";
import GridOnIcon from "@mui/icons-material/GridOn";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { Button, Checkbox, FormControlLabel, FormGroup, Stack, Typography } from "@mui/material";
import PageSection from "../PageSection";
import { SxProps, Theme } from "@mui/material/styles";

export interface ExportField {
  key: string;
  label: string;
}

interface InformeExportPanelProps {
  fields: ExportField[];
  selectedFields: string[];
  disabled?: boolean;
  sectionSx?: SxProps<Theme>;
  onToggleField: (fieldKey: string) => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

const InformeExportPanel = ({
  fields,
  selectedFields,
  disabled = false,
  sectionSx,
  onToggleField,
  onExportCsv,
  onExportExcel,
  onExportPdf,
}: InformeExportPanelProps) => {
  const exportDisabled = disabled || !fields.length || selectedFields.length === 0;

  return (
    <PageSection
      title="Exportar informe"
      description="Elige qué columnas incluir y descarga el detalle del taller en tu formato favorito."
      padding="compact"
      sx={sectionSx}
    >
      <Stack spacing={2.5}>
        <Typography variant="body2" color="text.secondary">
          Activa o desactiva las columnas que necesites antes de exportar. Los cambios se aplican a
          todos los formatos.
        </Typography>

        <FormGroup row>
          {fields.map((field) => (
            <FormControlLabel
              key={field.key}
              control={
                <Checkbox
                  checked={selectedFields.includes(field.key)}
                  onChange={() => onToggleField(field.key)}
                  size="small"
                  disabled={disabled}
                />
              }
              label={field.label}
            />
          ))}
        </FormGroup>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%" }}>
          <Button
            variant="outlined"
            startIcon={<TableRowsIcon />}
            onClick={onExportCsv}
            disabled={exportDisabled}
          >
            Exportar CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<GridOnIcon />}
            onClick={onExportExcel}
            disabled={exportDisabled}
          >
            Exportar Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={onExportPdf}
            disabled={exportDisabled}
          >
            Exportar PDF
          </Button>
        </Stack>
      </Stack>
    </PageSection>
  );
};

export default InformeExportPanel;
