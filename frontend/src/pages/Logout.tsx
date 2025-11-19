import { useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    const timeout = setTimeout(() => navigate("/", { replace: true }), 700);
    return () => clearTimeout(timeout);
  }, [logout, navigate]);

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        Cerrando sesión…
      </Typography>
    </Box>
  );
};

export default Logout;
