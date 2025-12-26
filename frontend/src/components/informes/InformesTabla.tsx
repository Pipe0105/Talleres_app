import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export type InformesMaterialGroup = {
  tallerId: number;
  label: string;
  material: string | null;
  materialNombre: string | null;
  pesoInicial: number;
  pesoFinal: number;
  porcentajePerdida: number | null;
  rows: {
    tallerId: number;
    displayId: number;
    groupKey: string;
    tallerNombre: string;
    materialLabel: string;
    item_code: string;
    nombre_corte: string;
    descripcion: string;
    peso: number;
    porcentaje_real: number;
    valor_estimado: number | null;
  }[];
};

export type InformesTallerCalculoGroup = {
  groupKey: string;
  displayId: number;
  groupLabel: string;
  sede: string | null;
  materiales: InformesMaterialGroup[];
};

export type InformesItemComparisonGroup = {
  itemKey: string;
  itemLabel: string;
  itemCode: string | null;
  materialLabel: string;
  materialCode: string | null;
  rows: InformesMaterialGroup["rows"];
};

interface InformesTablaProps {
  scope: "taller" | "sede" | "material" | "comparar";
  groupedCalculo: InformesTallerCalculoGroup[] | InformesItemComparisonGroup[];
  formatTallerId: (value: number) => string;
  formatCorteNombre: (value: string) => string;
  formatCurrencyOrNA: (value: number | null) => string;
  pesoFormatter: Intl.NumberFormat;
  porcentajeFormatter: Intl.NumberFormat;
}

const InformesTabla = ({
  scope,
  groupedCalculo,
  formatTallerId,
  formatCorteNombre,
  formatCurrencyOrNA,
  pesoFormatter,
  porcentajeFormatter,
}: InformesTablaProps) => {
  if (scope === "comparar") {
    const compareGroups = groupedCalculo as InformesItemComparisonGroup[];

    return (
      <Stack spacing={2}>
        {compareGroups.map((group) => {
          const orderedRows = [...group.rows].sort((a, b) => {
            if (a.displayId !== b.displayId) {
              return a.displayId - b.displayId;
            }

            return a.materialLabel.localeCompare(b.materialLabel);
          });
          const uniqueTalleres = new Set(group.rows.map((row) => row.groupKey)).size;

          return (
            <Accordion key={`item-${group.itemKey}`} variant="outlined" disableGutters>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  "& .MuiAccordionSummary-content": { my: 1 },
                }}
              >
                <Stack spacing={0.2}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {formatCorteNombre(group.itemLabel)}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      Corte principal: {group.materialLabel}
                    </Typography>
                    {group.materialCode ? (
                      <Typography variant="caption" color="text.secondary">
                        Código: {group.materialCode}
                      </Typography>
                    ) : null}
                    {group.itemCode ? (
                      <Typography variant="caption" color="text.secondary">
                        Código: {group.itemCode}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" color="text.secondary">
                      Talleres: {uniqueTalleres}
                    </Typography>
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  {orderedRows.map((row, index) => (
                    <Stack
                      key={`${row.groupKey}-${row.item_code}-${row.peso}-${index}`}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor:
                          index % 2 === 0 ? "rgba(76, 175, 80, 0.06)" : "rgba(255, 152, 0, 0.06)",
                      }}
                    >
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">
                          Taller {formatTallerId(row.displayId)} · {row.tallerNombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Corte principal: {row.materialLabel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Código item: {row.item_code || "N/A"}
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={2}
                        divider={<Divider flexItem orientation="vertical" />}
                      >
                        <Stack spacing={0.25}>
                          <Typography variant="overline" color="text.secondary">
                            Peso
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {pesoFormatter.format(row.peso)} kg
                          </Typography>
                        </Stack>
                        <Stack spacing={0.25}>
                          <Typography variant="overline" color="text.secondary">
                            % Real
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {porcentajeFormatter.format(row.porcentaje_real)}%
                          </Typography>
                        </Stack>
                        <Stack spacing={0.25}>
                          <Typography variant="overline" color="text.secondary">
                            Venta estimada
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrencyOrNA(row.valor_estimado)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    );
  }

  const tallerGroups = groupedCalculo as InformesTallerCalculoGroup[];

  return (
    <Stack spacing={2}>
      {tallerGroups.map((group) => {
        const singleMaterial = group.materiales.length === 1 ? group.materiales[0] : null;

        return (
          <Accordion key={`taller-${group.groupKey}`} variant="outlined" disableGutters>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                "& .MuiAccordionSummary-content": { my: 1 },
              }}
            >
              <Stack spacing={0.2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {group.groupLabel}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary">
                    ID: {formatTallerId(group.displayId)}
                  </Typography>
                  {singleMaterial?.material ? (
                    <Typography variant="caption" color="text.secondary">
                      Código: {singleMaterial.material}
                    </Typography>
                  ) : null}
                  {group.materiales.length > 1 ? (
                    <Typography variant="caption" color="text.secondary">
                      Cortes principales: {group.materiales.length}
                    </Typography>
                  ) : null}
                  {group.sede ? (
                    <Typography variant="caption" color="text.secondary">
                      Sede: {group.sede}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack
                spacing={2.5}
                divider={
                  <Divider
                    flexItem
                    sx={{
                      border: "none",
                      height: 1.5,
                      backgroundImage:
                        "repeating-linear-gradient(to right, #C7C7C7 0 8px, transparent 8px 18px)",
                    }}
                  />
                }
              >
                {group.materiales.map((material) => (
                  <Stack key={material.tallerId} spacing={1.5}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      divider={<Divider flexItem orientation="vertical" />}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "rgba(25, 118, 210, 0.04)",
                      }}
                    >
                      <Stack spacing={0.25}>
                        <Typography variant="overline" color="text.secondary">
                          Corte principal
                        </Typography>
                        <Typography variant="subtitle2">{material.label}</Typography>
                        {material.material ? (
                          <Typography variant="caption" color="text.secondary">
                            Código: {material.material}
                          </Typography>
                        ) : null}
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="overline" color="text.secondary">
                          Peso inicial
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {pesoFormatter.format(material.pesoInicial)} kg
                        </Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="overline" color="text.secondary">
                          Subcortes
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {pesoFormatter.format(
                            material.rows.reduce((acc, row) => acc + row.peso, 0)
                          )}{" "}
                          kg
                        </Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="overline" color="text.secondary">
                          Peso final
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {pesoFormatter.format(material.pesoFinal)} kg
                        </Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="overline" color="text.secondary">
                          % pérdida
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {material.porcentajePerdida === null
                            ? "N/D"
                            : `${porcentajeFormatter.format(material.porcentajePerdida)}%`}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Typography variant="overline" color="text.secondary">
                      Subcortes de {material.label}
                    </Typography>

                    <Stack spacing={1}>
                      {material.rows.map((row, index) => (
                        <Stack
                          key={`${row.tallerId}-${row.item_code}-${row.nombre_corte}-${row.peso}-${index}`}
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.5}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor:
                              index % 2 === 0
                                ? "rgba(76, 175, 80, 0.06)"
                                : "rgba(255, 152, 0, 0.06)",
                          }}
                        >
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2">
                              {formatCorteNombre(row.nombre_corte)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {row.descripcion}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Codigo: {row.item_code || "N/A"}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={2}
                            divider={<Divider flexItem orientation="vertical" />}
                          >
                            <Stack spacing={0.25}>
                              <Typography variant="overline" color="text.secondary">
                                Peso
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {pesoFormatter.format(row.peso)} kg
                              </Typography>
                            </Stack>
                            <Stack spacing={0.25}>
                              <Typography variant="overline" color="text.secondary">
                                % Real
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {porcentajeFormatter.format(row.porcentaje_real)}%
                              </Typography>
                            </Stack>
                            <Stack spacing={0.25}>
                              <Typography variant="overline" color="text.secondary">
                                Venta estimada
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {formatCurrencyOrNA(row.valor_estimado)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
};

export default InformesTabla;
