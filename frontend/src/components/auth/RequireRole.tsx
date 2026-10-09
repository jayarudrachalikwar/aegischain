import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../api/types';

/**
 * UX guard only: sends signed-out users to /login and shows a notice for screens a role should not use.
 * It is NOT a security control; the API must enforce authorization server-side.
 */
export const RequireRole: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({
  roles,
  children,
}) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (!roles.includes(role)) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-6 border border-stone-400 bg-white font-mono text-sm">
        <p className="font-bold uppercase text-signal-red">Not available for your role ({role})</p>
        <p className="mt-2 text-stone-700">
          This screen is hidden for your role to mirror the platform's separation of duties. The server
          enforces access on every request regardless of what the interface shows.
        </p>
      </div>
    );
  }
  return <>{children}</>;
};
