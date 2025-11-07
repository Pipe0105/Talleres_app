import { ReactNode } from "react";
import { Paper, PaperProps, Stack, Typography } from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";

const paddingByVariant = {
  regular: { xs: 3, md: 4 },
  compact: { xs: 2, md: 3 },
} as const;

type PaddingVariant = keyof typeof paddingByVariant;

export interface PageSectionProps extends Omit<PaperProps, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  spacing?: number;
  padding?: PaddingVariant;
  sx?: SxProps<Theme>;
}

const PageSection = ({
  title,
  description,
  actions,
  spacing = 3,
  padding = "regular",
  children,
  sx,
  ...paperProps
}: PageSectionProps) => {
  const extraSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

  return (
    <Paper
      elevation={0}
      {...paperProps}
      sx={[
        (theme: Theme) => ({
          p: paddingByVariant[padding],
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.customShadows.surface,
          backgroundImage: theme.gradients.subtle,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }),
        ...extraSx,
      ]}
    >
      <Stack spacing={spacing}>
        {(title || description || actions) && (
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.75}>
              {typeof title === "string" ? (
                <Typography variant="h6" component="h2">
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
            {actions}
          </Stack>
        )}
        {children}
      </Stack>
    </Paper>
  );
};

export default PageSection;
