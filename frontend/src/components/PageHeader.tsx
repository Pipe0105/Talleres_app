import { ReactNode } from "react";
import { Stack, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

const PageHeader = ({ title, description, action }: PageHeaderProps) => (
  <Stack
    direction={{ sx: "column", sm: "row" }}
    spacing={2}
    alignItems={{ sx: "flex-start", sm: "center" }}
    justifyContent="space-between"
  >
    <Stack spacing={0.75}>
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
