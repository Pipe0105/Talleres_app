import { forwardRef, ReactNode } from "react";
import { Chip, Paper, PaperProps, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

export interface FeatureCardProps extends PaperProps {
  icon: ReactNode;
  title: string;
  description: string;
  tag?: string;
  to?: string;
  href?: string;
}

const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, title, description, tag, to, href, sx, ...paperProps }, ref) => {
    const linkProps =
      to != null
        ? { component: RouterLink, to }
        : href != null
        ? { component: "a", href, target: "_blank", rel: "noreferrer" }
        : {};

    return (
      <Paper
        ref={ref}
        elevation={0}
        {...paperProps}
        {...linkProps}
        sx={[
          (theme) => ({
            p: 3,
            height: "100%",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            boxShadow: "0px 14px 36px rgba(15,41,69,0.08)",
            backgroundColor: theme.palette.common.white,
            display: "flex",
            flexDirection: "column",
            gap: 16 / 8,
            textDecoration: "none",
            transition: theme.transitions.create([
              "box-shadow",
              "transform",
              "border-color",
            ]),
            "&:hover": {
              boxShadow: theme.customShadows.floating,
              transform: "translateY(-6px)",
              borderColor: alpha(theme.palette.secondary.main, 0.4),
            },
          }),
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <Stack spacing={2}>
          {tag && (
            <Chip
              label={tag}
              color="secondary"
              variant="outlined"
              sx={{ width: "fit-content", fontWeight: 700 }}
            />
          )}
          {icon}
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </Paper>
    );
  }
);

FeatureCard.displayName = "FeatureCard";

export default FeatureCard;
