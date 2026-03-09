// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Landing
import LandingPage from "./pages/LandingPage";

// Auth pages
import StudentLoginPage from "./pages/voter/StudentLoginPage";
import AdminPortalPage from "./pages/admin/AdminPortalPage";
import OTPVerifyPage from "./pages/voter/OTPVerifyPage";

// Voter pages
import ActiveElectionsPage from "./pages/voter/ActiveElectionsPage";
import BallotPage from "./pages/voter/BallotPage";
import ReceiptPage from "./pages/voter/ReceiptPage";
import ReceiptVerifyPage from "./pages/voter/ReceiptVerifyPage";

// Admin pages
import DashboardPage from "./pages/admin/DashboardPage";
import CreateElectionPage from "./pages/admin/CreateElectionPage";

// Auditor pages
import VerificationPage from "./pages/auditor/VerificationPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Landing ── */}
          <Route path="/" element={<LandingPage />} />

          {/* ── Auth ── */}
          <Route path="/login/student" element={<StudentLoginPage />} />
          <Route path="/login/admin" element={<AdminPortalPage />} />
          <Route path="/verify-otp" element={<OTPVerifyPage />} />

          {/* Legacy redirect — if anything links to /login */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* ── Voter ── */}
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
          <Route
            path="/voter/verify-receipt"
            element={
              <ProtectedRoute role="voter">
                <ReceiptVerifyPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin ── */}
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

          {/* ── Auditor ── */}
          <Route
            path="/auditor/verify"
            element={
              <ProtectedRoute role="auditor">
                <VerificationPage />
              </ProtectedRoute>
            }
          />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
