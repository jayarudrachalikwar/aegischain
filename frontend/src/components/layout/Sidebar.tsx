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
  FileSpreadsheet
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

  // Define navigation items with role restrictions
  const navItems: NavGroup[] = [
    {
      group: 'COMMAND & OVERVIEW',
      items: [
        { path: '/dashboard', label: '01. Dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'AUDITOR', 'SECURITY_OFFICER'] },
      ]
    },
    {
      group: 'ASSET CUSTODY',
      items: [
        { path: '/assets', label: '02. My Assets', icon: ShieldCheck, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'AUDITOR', 'SECURITY_OFFICER'] },
        { path: '/upload', label: '03. Upload Asset', icon: Upload, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
        { path: '/request-access', label: '04. Request Access', icon: FileKey, roles: ['EMPLOYEE', 'MANAGER'] },
      ]
    },
    {
      group: 'GOVERNANCE & GRANTS',
      items: [
        { path: '/approvals', label: '05. Approvals Queue', icon: CheckSquare, roles: ['MANAGER', 'ADMIN'], badge: 'REQ' },
        { path: '/access-management', label: '06. Access Grants', icon: KeyRound, roles: ['MANAGER', 'ADMIN', 'SECURITY_OFFICER'] },
      ]
    },
    {
      group: 'AUDIT & DEFENCE MONITOR',
      items: [
        { path: '/audit-logs', label: '07. Audit Ledger', icon: History, roles: ['AUDITOR', 'ADMIN', 'SECURITY_OFFICER', 'MANAGER', 'EMPLOYEE'], highlight: role === 'AUDITOR' },
        { path: '/security-alerts', label: '08. Security Alerts', icon: AlertOctagon, roles: ['SECURITY_OFFICER', 'ADMIN', 'AUDITOR', 'MANAGER', 'EMPLOYEE'], alertCount: unresolvedCount },
        { path: '/users', label: '09. User Identities', icon: Users, roles: ['ADMIN', 'SECURITY_OFFICER', 'AUDITOR'] },
      ]
    },
    {
      group: 'IDENTITY & CREDENTIALS',
      items: [
        { path: '/passkeys', label: '10. Passkey Setup', icon: Fingerprint, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'AUDITOR', 'SECURITY_OFFICER'] },
        { path: '/mfa', label: '11. MFA / TOTP Setup', icon: QrCode, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'AUDITOR', 'SECURITY_OFFICER'] },
        { path: '/profile', label: '12. Profile / Security', icon: UserCog, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'AUDITOR', 'SECURITY_OFFICER'] },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-signal-red text-warm-white border-2 border-secure-black shadow-ink rounded-xs"
        aria-label="Toggle Navigation Menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-secure-black/60 z-40 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 lg:top-[53px] left-0 h-screen lg:h-[calc(100vh-53px)] w-72 bg-parchment-light border-r-2 border-secure-black shadow-md z-40 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Navigation Groups */}
        <div className="p-3 space-y-5">
          {/* User Identity Pill in Sidebar */}
          <div className="p-2.5 bg-bel-navy text-parchment-light border-[1.5px] border-secure-black technical-corner">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-blue-light uppercase tracking-wider mb-1">
              <span>ACTIVE OPERATOR</span>
              <span className="text-signal-red font-bold">● {role}</span>
            </div>
            <p className="font-mono text-xs font-bold truncate text-warm-white">
              {currentUser?.displayName || 'Unknown Operator'}
            </p>
            <p className="font-mono text-[10px] text-stone-300 truncate mt-0.5">
              {currentUser?.did || 'did:aegis:bel:offline'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4 font-mono text-xs">
            {navItems.map((group, gIdx) => {
              // Filter items accessible to the active role
              const accessibleItems = group.items.filter(item => item.roles.includes(role));
              if (accessibleItems.length === 0) return null;

              return (
                <div key={gIdx} className="space-y-1">
                  <div className="px-2 text-[10px] font-bold text-muted-blue uppercase tracking-widest border-b border-black/10 pb-1 mb-1">
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
                            'flex items-center justify-between px-2.5 py-1.5 border-[1.5px] transition-all tracking-wider',
                            isActive
                              ? 'bg-bel-navy text-parchment-light border-secure-black shadow-ink-sm font-bold'
                              : 'bg-warm-white text-stone-800 border-transparent hover:border-black/30 hover:bg-parchment'
                          )
                        }
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.alertCount !== undefined && item.alertCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-signal-red text-warm-white text-[10px] font-bold">
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
        <div className="p-3 border-t-2 border-secure-black bg-stone-100 font-mono text-[10px] space-y-1.5">
          <div className="flex items-center justify-between text-stone-600">
            <span>WEB CRYPTO SHA-256</span>
            <span className="text-verification-green font-bold">READY</span>
          </div>
          <div className="flex items-center justify-between text-stone-600">
            <span>OFF-CHAIN CIPHER</span>
            <span className="text-stone-800 font-bold">AES-256-GCM</span>
          </div>
          <div className="flex items-center justify-between text-stone-600">
            <span>DEMO MODE</span>
            <span className="text-signal-red font-bold">LOCAL ADAPTER</span>
          </div>
        </div>
      </aside>
    </>
  );
};
