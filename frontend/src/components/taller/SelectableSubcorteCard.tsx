import {
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import type { SubcorteDefinition } from "../../data/talleres";

interface SelectableSubcorteCardProps {
  subcorte: SubcorteDefinition;
  checked: boolean;
  onToggle: (codigo: string) => void;
}

const SelectableSubcorteCard = ({
  subcorte,
  checked,
  onToggle,
}: SelectableSubcorteCardProps) => {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 2,
        borderColor: checked ? "success.light" : "rgba(0,0,0,0.06)",
        bgcolor: checked ? "rgba(16, 185, 129, 0.06)" : "background.paper",
      }}
    >
      <CardActionArea
        sx={{ height: 1 }}
        onClick={() => onToggle(subcorte.codigo)}
      >
        <CardContent sx={{ py: 1.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={checked}
                onClick={(event) => event.stopPropagation()}
                onChange={() => onToggle(subcorte.codigo)}
              />
            }
            label={
              <Stack spacing={0.5}>
                <Typography fontWeight={700}>{subcorte.nombre}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {subcorte.codigo}
                </Typography>
              </Stack>
            }
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default SelectableSubcorteCard;
