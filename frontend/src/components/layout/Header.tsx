import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ShieldAlert, Cpu, UserCheck, AlertTriangle, ExternalLink, Lock, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from '../../context/BlockchainContext';
import { useAlerts } from '../../context/AlertContext';
import { UserRole } from '../../api/types';

export const Header: React.FC = () => {
  const { currentUser, role, switchUser } = useAuth();
  const { blockNumber, networkStatus } = useBlockchain();
  const { isGlobalLockdown, toggleLockdown, unresolvedCount } = useAlerts();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isPortal = location.pathname === '/' || location.pathname === '/portal';

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: { role: UserRole; title: string; desc: string }[] = [
    { role: 'EMPLOYEE', title: 'Technical Engineer', desc: 'Design, FPGA, SW — Time-bound access' },
    { role: 'MANAGER', title: 'Asset Owner / PM', desc: 'Mint & encrypt IP, project approvals' },
    { role: 'ADMIN', title: 'System Administrator', desc: 'Manage DIDs & nodes, zero payload access' },
    { role: 'QA_VERIFIER', title: 'QA / Verification', desc: '1-bit hash gate & test verification' },
    { role: 'SECURITY_OFFICER', title: 'Security Officer', desc: 'Real-time SOC telemetry & emergency freeze' },
    { role: 'AUDITOR', title: 'Auditor (MoD/CAG)', desc: 'Immutable read-only audit ledger' },
    { role: 'DEPT_MANAGER', title: 'Department Head / GM', desc: 'Cross-project dual-custody governance' },
    { role: 'EXTERNAL_COLLABORATOR', title: 'External Collaborator', desc: 'Air-gapped, time-limited single-use grants' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-black/[0.08] shadow-xs">
      {/* Global Lockdown Alert Banner if engaged */}
      {isGlobalLockdown && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-mono font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>CRITICAL DEFENCE ALERT: AUTOMATED LOCKDOWN ACTIVE · ASSET TRANSFERS SUSPENDED</span>
          </div>
          <button
            onClick={() => toggleLockdown('Manual clearance by authorized security officer')}
            className="underline hover:opacity-80 text-xs uppercase font-semibold"
          >
            Lift Freeze (SOC Override)
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Eyebrow */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#0d0d0d] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-stone-800 transition-colors">
              <Shield className="w-4 h-4 text-[#00E5FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight uppercase text-black font-sans">
                  AEGIS<span className="text-rose-600">CHAIN</span>
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 bg-black/[0.05] text-stone-700 rounded font-semibold tracking-wider">
                  2.0
                </span>
              </div>
              <p className="text-[10px] font-mono text-stone-500 tracking-wider hidden sm:block">
                BHARAT ELECTRONICS LIMITED · DEFENCE CUSTODY
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Live Blockchain Status Bar */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono bg-stone-50 px-3.5 py-1.5 border border-black/[0.08] rounded-full">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-stone-500">BESU L2:</span>
            <span className="font-bold text-stone-900">#{blockNumber}</span>
          </div>
          <div className="h-3 w-px bg-black/10" />
          <div className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-600">IBFT 2.0</span>
          </div>
          <div className="h-3 w-px bg-black/10" />
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-stone-600 font-medium">ZERO-TRUST ACTIVE</span>
          </div>
        </div>

        {/* Right: Actions, Alerts, and Role Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Public Trust Portal toggle */}
          {isPortal ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold bg-[#0d0d0d] text-white rounded-full hover:bg-stone-800 transition-colors shadow-xs"
            >
              <span>ENTER VAULT</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/portal"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-stone-700 hover:text-black bg-stone-50 hover:bg-stone-100 border border-black/[0.08] rounded-full transition-colors"
              title="View BEL-Inspired Trust Layer Architecture Portal"
            >
              <span>TRUST PORTAL</span>
            </Link>
          )}

          {/* Alerts Counter */}
          {unresolvedCount > 0 && (
            <Link
              to="/security-alerts"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded-full hover:bg-rose-100 transition-colors"
              title={`${unresolvedCount} unresolved security alerts`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{unresolvedCount}</span>
            </Link>
          )}

          {/* Role Switcher Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-semibold bg-[#0d0d0d] text-white rounded-full hover:bg-stone-800 transition-all shadow-xs"
              aria-expanded={showRoleMenu}
              aria-label="Switch active role"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span className="uppercase tracking-wider">{role}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-stone-900 border border-black/[0.1] rounded-2xl shadow-xl z-50 p-2 animate-in fade-in duration-150">
                <div className="p-2.5 bg-stone-50 rounded-xl mb-1.5 border border-black/[0.04]">
                  <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">ACTIVE OPERATOR DID</p>
                  <p className="font-mono text-xs font-bold truncate text-black mt-0.5" title={currentUser?.did}>
                    {currentUser?.did || 'did:aegis:bel:unauthenticated'}
                  </p>
                </div>
                <div className="px-2 py-1 text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                  Select Architectural Role:
                </div>
                <div className="space-y-0.5 max-h-72 overflow-y-auto">
                  {rolesList.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchUser(r.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-xl flex flex-col transition-all ${
                        role === r.role
                          ? 'bg-[#0d0d0d] text-white font-semibold'
                          : 'hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono uppercase font-bold text-[11px]">{r.title}</span>
                        {role === r.role && <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />}
                      </div>
                      <span className={`text-[10px] font-mono mt-0.5 line-clamp-1 ${role === r.role ? 'text-white/70' : 'text-stone-500'}`}>
                        {r.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
