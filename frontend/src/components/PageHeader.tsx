import { ReactNode } from "react";
import { Stack, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

const PageHeader = ({ title, description, action }: PageHeaderProps) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={2}
    alignItems={{ xs: "flex-start", sm: "center" }}
    justifyContent="space-between"
  >
    <Stack spacing={0.75}>
      <Typography
        variant="overline"
        sx={(theme) => ({
          color: theme.palette.secondary.main,
          letterSpacing: 1,
          fontWeight: 800,
        })}
      >
        Panel en línea
      </Typography>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      )}
    </Stack>
    {action}
  </Stack>
);

export default PageHeader;
