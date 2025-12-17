import { ReactNode } from "react";
import { Stack, StackProps, Typography } from "@mui/material";

export interface LandingSectionProps extends Omit<StackProps, "title"> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  spacing?: number;
}

const LandingSection = ({
  title,
  description,
  action,
  spacing = 3,
  children,
  ...stackProps
}: LandingSectionProps) => {
  return (
    <Stack spacing={spacing} {...stackProps}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Stack spacing={0.75}>
          {typeof title === "string" ? (
            <Typography variant="h4" component="h2">
              {title}
            </Typography>
          ) : (
            title
          )}

          {description &&
            (typeof description === "string" ? (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            ) : (
              description
            ))}
        </Stack>

        {action}
      </Stack>

      {children}
    </Stack>
  );
};

export default LandingSection;
