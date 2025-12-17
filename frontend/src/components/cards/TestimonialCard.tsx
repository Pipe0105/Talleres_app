import { forwardRef } from "react";
import { Avatar, Paper, PaperProps, Stack, Typography } from "@mui/material";

export interface TestimonialCardProps extends PaperProps {
  quote: string;
  name: string;
  role: string;
  avatarText?: string;
}

const buildInitials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const TestimonialCard = forwardRef<HTMLDivElement, TestimonialCardProps>(
  ({ quote, name, role, avatarText, sx, ...paperProps }, ref) => {
    return (
      <Paper
        ref={ref}
        elevation={0}
        {...paperProps}
        sx={[
          (theme) => ({
            p: 3,
            height: "100%",
            boxShadow: theme.customShadows.surface,
            backgroundImage: theme.gradients.subtle,
          }),
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <Stack spacing={2}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            “{quote}”
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main" }}>
              {avatarText ?? buildInitials(name)}
            </Avatar>
            <div>
              <Typography variant="subtitle1">{name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {role}
              </Typography>
            </div>
          </Stack>
        </Stack>
      </Paper>
    );
  }
);

TestimonialCard.displayName = "TestimonialCard";

export default TestimonialCard;
