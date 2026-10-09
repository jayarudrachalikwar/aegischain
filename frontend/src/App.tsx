import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BlockchainProvider } from './context/BlockchainContext';
import { AlertProvider } from './context/AlertContext';

// Layouts
import { LandingLayout } from './components/layout/LandingLayout';
import { AppShell } from './components/layout/AppShell';
import { RequireRole } from './components/auth/RequireRole';
import { ROUTE_ROLES } from './config/access';

// Pages
import { TrustPortal } from './pages/TrustPortal';
import { Login } from './pages/Login';
import { PasskeySetup } from './pages/PasskeySetup';
import { MfaSetup } from './pages/MfaSetup';
import { Dashboard } from './pages/Dashboard';
import { MyAssets } from './pages/MyAssets';
import { UploadAsset } from './pages/UploadAsset';
import { AssetDetails } from './pages/AssetDetails';
import { RequestAccess } from './pages/RequestAccess';
import { ApprovalPanel } from './pages/ApprovalPanel';
import { AccessManagement } from './pages/AccessManagement';
import { AuditLogs } from './pages/AuditLogs';
import { SecurityAlerts } from './pages/SecurityAlerts';
import { UserManagement } from './pages/UserManagement';
import { ProfileSecurity } from './pages/ProfileSecurity';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BlockchainProvider>
          <AlertProvider>
            <Routes>
              {/* Public Trust Portal & Architecture Showcase (No sidebar clutter) */}
              <Route element={<LandingLayout />}>
                <Route path="/" element={<TrustPortal />} />
                <Route path="/portal" element={<TrustPortal />} />
              </Route>

              {/* Secure Command Vault & Enterprise Applications (With Sidebar & Role switcher) */}
              <Route element={<AppShell />}>
                {/* 01. Login (Passkey + TOTP) */}
                <Route path="/login" element={<Login />} />

                {/* 02. Passkey Setup */}
                <Route path="/passkeys" element={<RequireRole roles={ROUTE_ROLES['/passkeys']}><PasskeySetup /></RequireRole>} />

                {/* 03. MFA Setup (TOTP) */}
                <Route path="/mfa" element={<RequireRole roles={ROUTE_ROLES['/mfa']}><MfaSetup /></RequireRole>} />

                {/* 04. Dashboard */}
                <Route path="/dashboard" element={<RequireRole roles={ROUTE_ROLES['/dashboard']}><Dashboard /></RequireRole>} />

                {/* 05. My Assets */}
                <Route path="/assets" element={<RequireRole roles={ROUTE_ROLES['/assets']}><MyAssets /></RequireRole>} />

                {/* 06. Upload Asset (Web Crypto SHA-256) */}
                <Route path="/upload" element={<RequireRole roles={ROUTE_ROLES['/upload']}><UploadAsset /></RequireRole>} />

                {/* 07. Asset Details (Live Integrity & Tamper Test) */}
                <Route path="/assets/:id" element={<RequireRole roles={ROUTE_ROLES['/assets']}><AssetDetails /></RequireRole>} />

                {/* 08. Request Access */}
                <Route path="/request-access" element={<RequireRole roles={ROUTE_ROLES['/request-access']}><RequestAccess /></RequireRole>} />

                {/* 09. Approval Panel */}
                <Route path="/approvals" element={<RequireRole roles={ROUTE_ROLES['/approvals']}><ApprovalPanel /></RequireRole>} />

                {/* 10. Access Management */}
                <Route path="/access-management" element={<RequireRole roles={ROUTE_ROLES['/access-management']}><AccessManagement /></RequireRole>} />

                {/* 11. Audit Logs */}
                <Route path="/audit-logs" element={<RequireRole roles={ROUTE_ROLES['/audit-logs']}><AuditLogs /></RequireRole>} />

                {/* 12. Security Alerts */}
                <Route path="/security-alerts" element={<RequireRole roles={ROUTE_ROLES['/security-alerts']}><SecurityAlerts /></RequireRole>} />

                {/* 13. User Management */}
                <Route path="/users" element={<RequireRole roles={ROUTE_ROLES['/users']}><UserManagement /></RequireRole>} />

                {/* 14. Profile / Security */}
                <Route path="/profile" element={<RequireRole roles={ROUTE_ROLES['/profile']}><ProfileSecurity /></RequireRole>} />
              </Route>

              {/* Catch-all redirect to Trust Portal */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AlertProvider>
        </BlockchainProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
