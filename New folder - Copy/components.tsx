import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

export const ProtectedRoute = ({
  user,
  loading,
  children,
}: {
  user: any;
  loading: boolean;
  children: ReactNode;
}) => {
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};