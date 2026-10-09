import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ShieldAlert, Cpu, UserCheck, AlertTriangle, ExternalLink, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from '../../context/BlockchainContext';
import { useAlerts } from '../../context/AlertContext';
import { UserRole } from '../../api/types';
import { formatTruncatedHash } from '../../utils/crypto';

export const Header: React.FC = () => {
  const { currentUser, role, switchUser, logout } = useAuth();
  const { blockNumber, networkStatus } = useBlockchain();
  const { isGlobalLockdown, toggleLockdown, unresolvedCount } = useAlerts();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const location = useLocation();

  const isPortal = location.pathname === '/' || location.pathname === '/portal';

  const rolesList: { role: UserRole; title: string; desc: string }[] = [
    { role: 'EMPLOYEE', title: 'Employee', desc: 'Read/Request Access, Upload' },
    { role: 'MANAGER', title: 'Manager', desc: 'Approve Grants, Review Requests' },
    { role: 'ADMIN', title: 'Admin', desc: 'Manage Identities, Passkeys' },
    { role: 'AUDITOR', title: 'Auditor', desc: 'Inspect Immutable Audit Trail' },
    { role: 'SECURITY_OFFICER', title: 'Security Officer', desc: 'Incident Monitor, Lockdown' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-bel-navy text-parchment-light border-b-2 border-secure-black shadow-md">
      {/* Global Lockdown Alert Banner if engaged */}
      {isGlobalLockdown && (
        <div className="bg-signal-red text-warm-white px-4 py-1.5 text-xs font-mono font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>CRITICAL ALERT: AUTOMATED DEFENCE LOCKDOWN ACTIVE · ASSET TRANSFERS FROZEN</span>
          </div>
          <button
            onClick={() => toggleLockdown('Manual clearance by authorized security officer')}
            className="underline hover:opacity-80 text-xs uppercase"
          >
            Lift Freeze (SOC Override)
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Eyebrow */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-signal-red text-warm-white border border-secure-black flex items-center justify-center font-mono font-bold text-sm shadow-ink-sm group-hover:bg-signal-red-hover transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm tracking-widest font-black uppercase text-parchment-light">
                  AEGIS<span className="text-signal-red">CHAIN</span>
                </span>
                <span className="font-mono text-[9px] px-1 py-0.2 bg-signal-red/20 text-signal-red border border-signal-red/40 font-semibold tracking-wider">
                  2.0
                </span>
              </div>
              <p className="text-[10px] font-mono text-muted-blue tracking-wider hidden sm:block">
                BHARAT ELECTRONICS LIMITED · DEFENCE CUSTODY
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Live Blockchain Status Bar */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono bg-bel-navy-dark/90 px-3 py-1.5 border border-muted-blue/30 rounded-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-verification-green animate-pulse" />
            <span className="text-muted-blue-light">BESU L2:</span>
            <span className="font-bold text-warm-white">#{blockNumber}</span>
          </div>
          <div className="h-3 w-[1px] bg-muted-blue/40" />
          <div className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-muted-blue-light" />
            <span className="text-stone-300">IBFT 2.0</span>
          </div>
          <div className="h-3 w-[1px] bg-muted-blue/40" />
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-verification-green" />
            <span className="text-stone-300">ZERO-TRUST ACTIVE</span>
          </div>
        </div>

        {/* Right: Actions, Role Switcher, and Nav links */}
        <div className="flex items-center gap-2.5">
          {/* Public Trust Portal toggle */}
          {isPortal ? (
            <Link
              to="/dashboard"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-signal-red text-warm-white border border-secure-black shadow-ink-sm hover:bg-signal-red-hover"
            >
              <span>ENTER VAULT</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/portal"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-bel-navy-dark text-parchment-light/80 hover:text-parchment-light border border-muted-blue/40"
              title="View BEL-Inspired Trust Layer Architecture Portal"
            >
              <span>TRUST PORTAL</span>
            </Link>
          )}

          {/* Alerts Counter */}
          {unresolvedCount > 0 && (
            <Link
              to="/security-alerts"
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold bg-signal-red/20 text-signal-red border border-signal-red animate-pulse"
              title={`${unresolvedCount} unresolved security alerts`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{unresolvedCount}</span>
            </Link>
          )}

          {/* Role Switcher (Crucial for testing all 5 roles autonomously) */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono bg-warm-white text-secure-black border border-secure-black shadow-ink-sm hover:bg-parchment"
              aria-expanded={showRoleMenu}
              aria-label="Switch active role"
            >
              <UserCheck className="w-3.5 h-3.5 text-bel-navy" />
              <div className="text-left hidden sm:block">
                <span className="font-bold uppercase block leading-none">{role}</span>
              </div>
              <span className="text-[10px] text-stone-500">▼</span>
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-warm-white text-secure-black border-2 border-secure-black shadow-ink-lg z-50 p-1.5">
                <div className="p-2 border-b border-black/10 bg-black/5 mb-1">
                  <p className="font-mono text-[10px] text-stone-500 uppercase">Current DID:</p>
                  <p className="font-mono text-xs font-bold truncate text-bel-navy">
                    {currentUser?.did || 'did:aegis:bel:unauthenticated'}
                  </p>
                </div>
                <div className="px-2 py-1 text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                  Test Role Simulator:
                </div>
                {rolesList.map(r => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchUser(r.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 text-xs font-mono flex flex-col transition-colors border border-transparent hover:border-black/20 ${
                      role === r.role ? 'bg-bel-navy text-parchment-light font-bold' : 'hover:bg-black/5'
                    }`}
                  >
                    <span className="uppercase">{r.title}</span>
                    <span className={`text-[10px] opacity-75 ${role === r.role ? 'text-parchment-light' : 'text-stone-500'}`}>
                      {r.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
