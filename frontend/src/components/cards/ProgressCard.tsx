import { forwardRef } from "react";
import {
  LinearProgress,
  Paper,
  PaperProps,
  Stack,
  Typography,
} from "@mui/material";

export interface ProgressCardProps extends PaperProps {
  title: string;
  value: number;
  helper?: string;
}

const ProgressCard = forwardRef<HTMLDivElement, ProgressCardProps>(
  ({ title, value, helper, sx, ...paperProps }, ref) => {
    return (
      <Paper
        ref={ref}
        elevation={0}
        {...paperProps}
        sx={[
          (theme) => ({
            p: 3,
            height: "100%",
            boxShadow: "0px 14px 36px rgba(15,41,69,0.08)",
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.common.white,
          }),
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
          >
            <Typography variant="subtitle1">{title}</Typography>
            <Typography variant="body2" color="secondary">
              {value}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={value}
            sx={{ borderRadius: 999, height: 8 }}
            color="primary"
          />
          {helper && (
            <Typography variant="body2" color="text.secondary">
              {helper}
            </Typography>
          )}
        </Stack>
      </Paper>
    );
  }
);

ProgressCard.displayName = "ProgressCard";

export default ProgressCard;
