// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
// Admin uses same auth flow — redirect here is handled in OTPVerifyPage
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import RegisterNumberPage from "../voter/RegisterNumberPage";

export default function AdminLoginPage() {
  const { auth } = useAuth();
  if (auth?.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <RegisterNumberPage />;
}
