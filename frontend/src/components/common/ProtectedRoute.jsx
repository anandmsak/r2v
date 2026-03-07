// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { auth, ready } = useAuth();
  if (!ready) return null;
  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.role !== role) return <Navigate to="/" replace />;
  return children;
}
