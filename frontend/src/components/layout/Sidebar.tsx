import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Upload,
  FileKey,
  CheckSquare,
  KeyRound,
  History,
  AlertOctagon,
  Users,
  Fingerprint,
  QrCode,
  UserCog,
  Menu,
  X,
  Shield,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { clsx } from 'clsx';

interface NavItem {
  path: string;
  label: string;
  icon: any;
  roles: string[];
  badge?: string;
  highlight?: boolean;
  alertCount?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { role, currentUser } = useAuth();
  const { unresolvedCount } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);

  // All 8 roles supported across the enterprise navigation
  const allRoles = [
    'EMPLOYEE',
    'MANAGER',
    'ADMIN',
    'AUDITOR',
    'SECURITY_OFFICER',
    'QA_VERIFIER',
    'DEPT_MANAGER',
    'EXTERNAL_COLLABORATOR'
  ];

  const navItems: NavGroup[] = [
    {
      group: 'COMMAND & CONTROL',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: allRoles },
      ]
    },
    {
      group: 'DEFENCE ASSETS & CUSTODY',
      items: [
        { path: '/assets', label: 'Asset Vault', icon: ShieldCheck, roles: allRoles },
        { path: '/upload', label: 'Mint & Encrypt Asset', icon: Upload, roles: ['EMPLOYEE', 'MANAGER', 'DEPT_MANAGER', 'ADMIN'] },
        { path: '/request-access', label: 'Request Clearance', icon: FileKey, roles: ['EMPLOYEE', 'MANAGER', 'QA_VERIFIER', 'DEPT_MANAGER', 'EXTERNAL_COLLABORATOR'] },
      ]
    },
    {
      group: 'GOVERNANCE & DUAL APPROVAL',
      items: [
        { path: '/approvals', label: 'Approvals Queue', icon: CheckSquare, roles: ['MANAGER', 'ADMIN', 'DEPT_MANAGER'], badge: 'REQ' },
        { path: '/access-management', label: 'Time-Bound Grants', icon: KeyRound, roles: ['MANAGER', 'ADMIN', 'SECURITY_OFFICER', 'DEPT_MANAGER'] },
      ]
    },
    {
      group: 'SECURITY & FORENSIC LEDGER',
      items: [
        { path: '/audit-logs', label: 'Besu Audit Ledger', icon: History, roles: allRoles, highlight: role === 'AUDITOR' },
        { path: '/security-alerts', label: 'SOC Security Alerts', icon: AlertOctagon, roles: allRoles, alertCount: unresolvedCount },
        { path: '/users', label: 'Identity & DIDs', icon: Users, roles: ['ADMIN', 'SECURITY_OFFICER', 'AUDITOR', 'DEPT_MANAGER'] },
      ]
    },
    {
      group: 'AUTHENTICATION & TOKENS',
      items: [
        { path: '/passkeys', label: 'FIDO2 / WebAuthn', icon: Fingerprint, roles: allRoles },
        { path: '/mfa', label: 'TOTP MFA Setup', icon: QrCode, roles: allRoles },
        { path: '/profile', label: 'Cryptographic Profile', icon: UserCog, roles: allRoles },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-5 right-5 z-50 p-3 bg-[#0d0d0d] text-white border border-black/20 shadow-lg rounded-full"
        aria-label="Toggle Navigation Menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 lg:top-[53px] left-0 h-screen lg:h-[calc(100vh-53px)] w-64 bg-white border-r border-black/[0.08] z-40 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Navigation Groups */}
        <div className="p-3.5 space-y-4">
          {/* Active Operator Pill */}
          <div className="p-3 bg-[#0d0d0d] text-white rounded-xl border border-black/10 shadow-xs">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-wider mb-1.5">
              <span className="text-white/50 uppercase">ACTIVE OPERATOR</span>
              <span className="inline-flex items-center gap-1 text-[#00E5FF] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
                {role}
              </span>
            </div>
            <p className="text-xs font-semibold truncate text-white">
              {currentUser?.displayName || 'Unknown Operator'}
            </p>
            <p className="font-mono text-[10px] text-white/50 truncate mt-0.5" title={currentUser?.did}>
              {currentUser?.did || 'did:aegis:bel:offline'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4 font-sans text-xs">
            {navItems.map((group, gIdx) => {
              const accessibleItems = group.items.filter(item => item.roles.includes(role));
              if (accessibleItems.length === 0) return null;

              return (
                <div key={gIdx} className="space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-mono font-medium text-black/40 uppercase tracking-widest">
                    {group.group}
                  </div>
                  {accessibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all',
                            isActive
                              ? 'bg-[#0d0d0d] text-white shadow-xs'
                              : 'text-stone-700 hover:text-stone-900 hover:bg-black/[0.04]'
                          )
                        }
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.alertCount !== undefined && item.alertCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-mono font-bold rounded-full">
                            {item.alertCount}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Hardware & Cryptographic Status */}
        <div className="p-3.5 border-t border-black/[0.08] bg-[#fafafa] font-mono text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px]">WEB CRYPTO SHA-256</span>
            <span className="text-emerald-600 font-bold">READY</span>
          </div>
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px]">OFF-CHAIN STORAGE</span>
            <span className="text-stone-900 font-semibold">AES-256-GCM</span>
          </div>
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px]">CONSENSUS NODE</span>
            <span className="text-indigo-600 font-semibold">IBFT 2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
