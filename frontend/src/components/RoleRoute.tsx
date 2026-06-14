import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import type { User } from "../types";
import { fetchCurrentUser } from "../utils/currentUser";
import { canAccessPath } from "../utils/roleAccess";

interface RoleRouteProps {
  path: string;
  children: React.ReactElement;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ path, children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !canAccessPath(user.role, path)) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};
