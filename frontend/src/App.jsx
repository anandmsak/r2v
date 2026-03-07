// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth pages
import RegisterNumberPage from "./pages/voter/RegisterNumberPage";
import OTPVerifyPage from "./pages/voter/OTPVerifyPage";

// Voter pages
import ActiveElectionsPage from "./pages/voter/ActiveElectionsPage";
import BallotPage from "./pages/voter/BallotPage";
import ReceiptPage from "./pages/voter/ReceiptPage";

// Admin pages
import DashboardPage from "./pages/admin/DashboardPage";
import CreateElectionPage from "./pages/admin/CreateElectionPage";

// Auditor pages
import VerificationPage from "./pages/auditor/VerificationPage";

function RootRedirect() {
  const { auth, ready } = useAuth();
  if (!ready) return null;
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (auth.role === "auditor") return <Navigate to="/auditor/verify" replace />;
  return <Navigate to="/voter/elections" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<RegisterNumberPage />} />
          <Route path="/verify-otp" element={<OTPVerifyPage />} />

          {/* Voter */}
          <Route
            path="/voter/elections"
            element={
              <ProtectedRoute role="voter">
                <ActiveElectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voter/ballot/:id"
            element={
              <ProtectedRoute role="voter">
                <BallotPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voter/receipt"
            element={
              <ProtectedRoute role="voter">
                <ReceiptPage />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/election/:id"
            element={
              <ProtectedRoute role="admin">
                <CreateElectionPage />
              </ProtectedRoute>
            }
          />

          {/* Auditor */}
          <Route
            path="/auditor/verify"
            element={
              <ProtectedRoute role="auditor">
                <VerificationPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
