import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const auth = useContext(AuthContext);

  if (!auth?.user) {
    // Not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  if (!auth.user.is_admin) {
    // Logged in but not admin → redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Admin is allowed
  return children;
}
