import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileKey,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Lock,
  ArrowUpRight,
  History,
  Activity,
  Cpu,
  KeyRound,
  FileCheck,
  Layers,
  Eye,
  RefreshCw,
  Zap,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Info,
  Download,
  AlertOctagon,
  Clock,
  Radio,
  FileText,
  Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { useAlerts } from '../context/AlertContext';
import { apiClient } from '../api/client';
import { Asset, AccessRequest, AccessGrant, AuditLog, UserRole } from '../api/types';
import { Badge, ClassificationBadge } from '../components/common/Badge';
import { formatRelativeTime, formatBytes } from '../utils/formatters';
import {
  BEL_EMPLOYEE_ROLES,
  AEGIS_SYSTEM_ROLES,
  AegisSystemRoleId,
  BelDesignation,
  DEFENCE_SECURITY_RULES
} from '../data/belRoles';

export const Dashboard: React.FC = () => {
  const { currentUser, role, switchUser } = useAuth();
  const { blockNumber, tps, networkStatus } = useBlockchain();
  const { alerts, unresolvedCount, isGlobalLockdown, toggleLockdown } = useAlerts();

  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Progressive Disclosure Toggles (Hiding heavy content behind clean interactive arrows/buttons)
  const [showRoleSimulator, setShowRoleSimulator] = useState(false);
  const [showRoleDirectory, setShowRoleDirectory] = useState(false);
  const [showLifecycle, setShowLifecycle] = useState(false);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [expandedAssetIds, setExpandedAssetIds] = useState<Record<string, boolean>>({});
  const [showRbacMatrix, setShowRbacMatrix] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [showFidoDetails, setShowFidoDetails] = useState(false);
  const [showSecurityRules, setShowSecurityRules] = useState(false);

  // Interactive States
  const [activeStage, setActiveStage] = useState<number>(1);
  const [simulatedGateState, setSimulatedGateState] = useState<'IDLE' | 'HASHING' | 'PASSED' | 'FAILED'>('IDLE');
  const [searchDesignation, setSearchDesignation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [ast, req, grt, aud] = await Promise.all([
        apiClient.assets.listAssets(),
        apiClient.requests.listRequests(),
        apiClient.grants.listGrants(),
        apiClient.audit.getLogs(),
      ]);
      setAssets(ast);
      setRequests(req);
      setGrants(grt);
      setAuditLogs(aud);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Map active UserRole to AegisSystemRoleId
  const activeSystemRoleId: AegisSystemRoleId = useMemo(() => {
    switch (role) {
      case 'EMPLOYEE': return 'ENGINEER';
      case 'MANAGER': return 'ASSET_OWNER';
      case 'ADMIN': return 'SYSTEM_ADMIN';
      case 'AUDITOR': return 'AUDITOR';
      case 'SECURITY_OFFICER': return 'SECURITY_OFFICER';
      case 'QA_VERIFIER': return 'QA_VERIFIER';
      case 'DEPT_MANAGER': return 'DEPT_MANAGER';
      case 'EXTERNAL_COLLABORATOR': return 'EXTERNAL_COLLABORATOR';
      default: return 'ENGINEER';
    }
  }, [role]);

  const activeRoleConfig = AEGIS_SYSTEM_ROLES[activeSystemRoleId];

  // Helper to switch system role safely
  const handleRoleSelect = (targetSysRole: AegisSystemRoleId) => {
    let authRole: UserRole = 'EMPLOYEE';
    switch (targetSysRole) {
      case 'ENGINEER': authRole = 'EMPLOYEE'; break;
      case 'ASSET_OWNER': authRole = 'MANAGER'; break;
      case 'SYSTEM_ADMIN': authRole = 'ADMIN'; break;
      case 'AUDITOR': authRole = 'AUDITOR'; break;
      case 'SECURITY_OFFICER': authRole = 'SECURITY_OFFICER'; break;
      case 'QA_VERIFIER': authRole = 'QA_VERIFIER'; break;
      case 'DEPT_MANAGER': authRole = 'DEPT_MANAGER'; break;
      case 'EXTERNAL_COLLABORATOR': authRole = 'EXTERNAL_COLLABORATOR'; break;
    }
    switchUser(authRole);
  };

  // Toggle individual asset card details
  const toggleAssetExpand = (id: string) => {
    setExpandedAssetIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle individual audit log card details
  const toggleLogExpand = (id: string) => {
    setExpandedLogIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filtered 64 BEL designations
  const filteredRoles = useMemo(() => {
    return BEL_EMPLOYEE_ROLES.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchDesignation.toLowerCase()) ||
        item.workDescription.toLowerCase().includes(searchDesignation.toLowerCase()) ||
        item.filesUsed.toLowerCase().includes(searchDesignation.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchDesignation, selectedCategory]);

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const activeGrants = grants.filter(g => g.status === 'ACTIVE');

  // Interactive 5-Stage Stepper data
  const lifecycleStages = [
    {
      step: 1,
      title: 'Off-Chain Encryption',
      sub: 'AES-256-GCM in MinIO',
      badge: 'Zero Plaintext On-Chain',
      desc: 'Payloads are encrypted client-side with ephemeral keys and stored in S3/MinIO. Only cryptographic SHA-256 fingerprints are registered on the blockchain.',
      crypto: 'Cipher: AES-256-GCM · IV: 96-bit · Auth Tag: 128-bit',
      action: 'Upload & Mint IP',
      link: '/upload',
    },
    {
      step: 2,
      title: 'Least-Privilege Request',
      sub: 'Time-Bound (1-8 hrs)',
      badge: 'Justification Required',
      desc: 'Engineers submit cryptographic access requests with mission justifications. Self-approval is structurally barred under strict Separation of Duties.',
      crypto: 'Signature: Ed25519 / ECDSA · Nonce: 64-bit · TTL: <480m',
      action: 'Request Clearance',
      link: '/request-access',
    },
    {
      step: 3,
      title: 'Dual-Custody Approval',
      sub: 'Smart Contract Governance',
      badge: 'Dual Sign-Off',
      desc: 'Smart contract enforces dual-approval for classified assets (Project Manager + Dept Head). No single operator can grant unmonitored clearance.',
      crypto: 'Contract: AegisGrants.sol · Multi-Sig: 2-of-3 · Besu L2',
      action: 'Approvals Queue',
      link: '/approvals',
    },
    {
      step: 4,
      title: 'Download Integrity Gate',
      sub: 'Client-Side SHA-256 Check',
      badge: '1-Bit Tamper Abort',
      desc: 'Prior to decryption, the client browser computes SHA-256 via Web Cryptography API and compares it against the immutable on-chain hash. If 1 bit differs, decryption immediately aborts.',
      crypto: 'Primitive: window.crypto.subtle.digest("SHA-256")',
      action: 'Verify Gate Logic',
      link: '#gate-sim',
    },
    {
      step: 5,
      title: 'Immutable Audit Anchor',
      sub: 'Permanent Ledger Block',
      badge: 'IBFT 2.0 Consensus',
      desc: 'Every access, download, verification, or tampering incident is permanently committed to Hyperledger Besu. Immutable audit trails provide complete forensic accountability.',
      crypto: 'Consensus: IBFT 2.0 · Block Time: 2.0s · Finality: Instant',
      action: 'Inspect Ledger',
      link: '/audit-logs',
    },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleSimulateGate = (tamper: boolean) => {
    setSimulatedGateState('HASHING');
    setTimeout(() => {
      if (tamper) {
        setSimulatedGateState('FAILED');
      } else {
        setSimulatedGateState('PASSED');
      }
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* ============================================================== */}
      {/* 1. TOP COMMAND CENTRE BANNER                                   */}
      {/* ============================================================== */}
      <div className="bg-white border border-black/[0.08] rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
        {/* Top Eyebrow Row: Platform Tag & Live Block Telemetry */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              AEGISCHAIN 2.0 DEFENCE VAULT
            </span>
            <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              BESU L2 BLOCK #{blockNumber} · IBFT 2.0
            </span>
            <span className="font-mono text-[11px] text-stone-500">
              {tps.toFixed(1)} TPS
            </span>
          </div>

          <div className="font-mono text-[11px] text-stone-500 flex items-center gap-2">
            <span>Identity: <strong className="text-stone-900">{currentUser?.displayName}</strong> ({activeRoleConfig.shortCode})</span>
            <span>·</span>
            <code className="text-stone-400 text-[10px] hidden md:inline">{currentUser?.did}</code>
          </div>
        </div>

        {/* Main Title Row: Grand Title on Left, Executive Actions on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-950 font-sans">
              Bharat Electronics Defence Custody Command
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-sans">
              Zero-trust identity custody and decentralized access control engineered for sovereign defence electronics.
            </p>
          </div>

          {/* Quick Action Buttons with Clean Neon Border */}
          <div className="flex flex-wrap items-center gap-3">
            {activeRoleConfig.permissions.canUpload && (
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0d0d0d] text-white hover:bg-stone-800 border border-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.25)] transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Upload & Mint IP</span>
              </Link>
            )}

            {activeRoleConfig.permissions.canRequest && (
              <Link
                to="/request-access"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-stone-900 hover:bg-stone-50 border border-[#00E5FF] shadow-[0_0_6px_rgba(0,229,255,0.15)] transition-all"
              >
                <FileKey className="w-3.5 h-3.5 text-stone-700" />
                <span>Request Clearance</span>
              </Link>
            )}

            {activeRoleConfig.permissions.canApprove && (
              <Link
                to="/approvals"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-stone-900 hover:bg-stone-50 border border-black/[0.12] hover:border-black/30 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Approvals Queue ({pendingRequests.length})</span>
              </Link>
            )}

            {activeRoleConfig.permissions.canEmergencyFreeze && (
              <button
                onClick={() => toggleLockdown('Simulated emergency freeze triggered by authorized command')}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-semibold rounded-full border transition-all ${
                  isGlobalLockdown
                    ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                    : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isGlobalLockdown ? 'DEFENCE FREEZE ACTIVE' : 'EMERGENCY LOCKDOWN'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Cryptographic Separation of Duties Guardrail Bar */}
        <div className="bg-stone-50 border border-black/[0.06] rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] text-stone-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="font-bold text-black uppercase tracking-wide">Separation of Duties:</span>
            <span className="text-stone-600 font-sans">{activeRoleConfig.separationOfDutiesGuardrail}</span>
          </div>

          <button
            onClick={() => setShowRoleDirectory(!showRoleDirectory)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-white border border-black/[0.1] hover:border-black/30 text-stone-700 transition-all self-start md:self-auto flex-shrink-0 shadow-xs"
          >
            <span>{showRoleDirectory ? 'Hide 64 BEL Designations' : 'Explore 64 BEL Designations'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRoleDirectory ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1B. EXPANDABLE 64 BEL ROLES DIRECTORY (Progressive Disclosure) */}
      {/* ============================================================== */}
      {showRoleDirectory && (
        <div className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-stone-950">
                BEL Employee Designations & Access Map (64 Industry Roles)
              </h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                Full breakdown of defence personnel, everyday files used, and AegisChain cryptographic controls.
              </p>
            </div>

            {/* Category Filter Pills (6 Sections) */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'All (64)', value: 'ALL' },
                { label: '1. Engineering (15)', value: 'Engineering & Production' },
                { label: '2. Research & QA (10)', value: 'Research & Quality' },
                { label: '3. Leadership (8)', value: 'Management & Leadership' },
                { label: '4. IT & Identity (10)', value: 'IT & Digital Identity' },
                { label: '5. Business & Admin (12)', value: 'Business & Administration' },
                { label: '6. External & Other (9)', value: 'External & Other' },
              ].map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-black text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by role title, job description, or files used (e.g. radar, FPGA, CAD, calibration, firmware)..."
              value={searchDesignation}
              onChange={(e) => setSearchDesignation(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-black/[0.08] rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Role Table */}
          <div className="max-h-80 overflow-y-auto border border-black/[0.06] rounded-xl">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead className="sticky top-0 bg-stone-50 border-b border-black/[0.08] font-mono text-[10px] text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Role / Designation</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Typical Files in AegisChain</th>
                  <th className="py-2.5 px-3">AegisChain System Role</th>
                  <th className="py-2.5 px-3">Clearance</th>
                  <th className="py-2.5 px-3 text-right">Simulate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filteredRoles.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-stone-900">
                      <div>{item.title}</div>
                      <div className="text-[11px] text-stone-500 font-normal line-clamp-1">{item.workDescription}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">
                      {item.category}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 max-w-xs truncate" title={item.filesUsed}>
                      {item.filesUsed}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-800 rounded">
                        {AEGIS_SYSTEM_ROLES[item.aegisSystemRole]?.shortCode || item.aegisSystemRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px]">
                      <ClassificationBadge classification={item.clearanceLevel} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleRoleSelect(item.aegisSystemRole)}
                        className="text-[11px] font-mono font-semibold text-stone-700 hover:text-black hover:underline"
                      >
                        Simulate →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] text-stone-500">
              Showing {filteredRoles.length} of 64 designations
            </span>
            <button
              onClick={() => setShowRoleDirectory(false)}
              className="text-xs font-mono font-semibold text-stone-600 hover:text-black inline-flex items-center gap-1"
            >
              <span>Close Directory</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. 8-ROLE ARCHITECTURAL SIMULATOR (Progressive Disclosure)     */}
      {/* ============================================================== */}
      <div className="bg-white border border-black/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-700" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                Simulated Persona:
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#0d0d0d] text-white border border-[#00E5FF] shadow-[0_0_6px_rgba(0,229,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
              {activeRoleConfig.name} ({activeRoleConfig.shortCode})
            </span>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold border border-black/[0.06]">
              {activeRoleConfig.defaultClearance} CLEARANCE
            </span>
            <span className="text-stone-500 text-xs font-sans hidden xl:inline">
              · {activeRoleConfig.separationOfDutiesGuardrail}
            </span>
          </div>

          {/* Interactive Arrow Button to Toggle 8 Persona Cards */}
          <button
            onClick={() => setShowRoleSimulator(!showRoleSimulator)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-stone-50 hover:bg-stone-100 border border-black/[0.08] text-stone-800 transition-all shadow-xs self-start sm:self-auto flex-shrink-0"
          >
            <span>{showRoleSimulator ? 'Close Role Selector' : 'Switch Persona (8 Roles)'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRoleSimulator ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable 8-Persona Cards Grid */}
        {showRoleSimulator && (
          <div className="pt-3 border-t border-black/[0.06] space-y-3 animate-in fade-in duration-200">
            <p className="text-xs text-stone-500 font-mono">
              Select any role to simulate active permissions, on-chain clearance limits, and Separation of Duties boundaries:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {[
                { id: 'SYSTEM_ADMIN', label: 'System Admin' },
                { id: 'ASSET_OWNER', label: 'Asset Owner (PM)' },
                { id: 'ENGINEER', label: 'Technical Engineer' },
                { id: 'QA_VERIFIER', label: 'QA / Verification' },
                { id: 'SECURITY_OFFICER', label: 'Security Officer' },
                { id: 'AUDITOR', label: 'Defence Auditor' },
                { id: 'DEPT_MANAGER', label: 'Department Head' },
                { id: 'EXTERNAL_COLLABORATOR', label: 'External Partner' },
              ].map((item) => {
                const rId = item.id as AegisSystemRoleId;
                const roleConf = AEGIS_SYSTEM_ROLES[rId];
                const isActive = activeSystemRoleId === rId;

                return (
                  <button
                    key={rId}
                    onClick={() => handleRoleSelect(rId)}
                    className={`h-[96px] p-3 rounded-xl text-left border flex flex-col justify-between transition-all ${
                      isActive
                        ? 'bg-[#0d0d0d] text-white border-[#00E5FF] shadow-xs ring-1 ring-[#00E5FF]'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-black/[0.08] hover:border-black/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-white/20 text-[#00E5FF]' : 'bg-white text-stone-600 border border-black/[0.06]'
                      }`}>
                        {roleConf.shortCode}
                      </span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />}
                    </div>

                    <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-stone-900'}`}>
                      {item.label}
                    </p>

                    <div className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
                      {roleConf.defaultClearance}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. 4 UNIFORM KEY METRIC CARDS                                  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Protected Assets */}
        <div className="bg-white border border-black/[0.08] rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[135px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              PROTECTED DEFENCE ASSETS
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-stone-900">{assets.length}</span>
              <span className="text-xs font-mono font-semibold text-emerald-600">100% ANCHORED</span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Off-chain AES-256 + On-chain SHA-256
            </p>
          </div>
        </div>

        {/* Metric 2: Active Time-Bound Grants */}
        <div className="bg-white border border-black/[0.08] rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[135px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              ACTIVE TIME-BOUND GRANTS
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-stone-900">{activeGrants.length}</span>
              <span className="text-xs font-mono font-semibold text-blue-600">AUTO-EXPIRING</span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Smart contract enforced TTL &lt; 8h
            </p>
          </div>
        </div>

        {/* Metric 3: Pending Dual-Approvals */}
        <div className="bg-white border border-black/[0.08] rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[135px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              PENDING DUAL-APPROVALS
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-stone-900">{pendingRequests.length}</span>
              {pendingRequests.length > 0 ? (
                <span className="text-xs font-mono font-semibold text-amber-600">ACTION REQUIRED</span>
              ) : (
                <span className="text-xs font-mono font-semibold text-stone-400">QUEUE CLEAR</span>
              )}
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Multi-signature project authorization
            </p>
          </div>
        </div>

        {/* Metric 4: Security Incidents / Lockdown Status */}
        <div className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[135px] transition-colors ${
          unresolvedCount > 0 ? 'border-rose-300 ring-1 ring-rose-200' : 'border-black/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              ZERO-TRUST TELEMETRY
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              unresolvedCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-stone-50 text-stone-500'
            }`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold font-mono ${unresolvedCount > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
                {unresolvedCount}
              </span>
              <span className={`text-xs font-mono font-semibold ${
                unresolvedCount > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {isGlobalLockdown
                  ? 'LOCKDOWN ACTIVE'
                  : unresolvedCount > 0
                  ? 'THREAT ALERT'
                  : 'PERIMETER SECURE'}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              {unresolvedCount > 0 ? 'Anomalous velocity detected' : '1-bit tamper & velocity monitors'}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. 5-STAGE DEFENCE FILE LIFECYCLE (Progressive Disclosure)     */}
      {/* ============================================================== */}
      <div className="bg-white border border-black/[0.08] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-700 flex-shrink-0" />
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              5-Stage Cryptographic File Lifecycle
            </h2>
          </div>

          {/* Compact Pipeline Chain Preview (Always visible in collapsed mode) */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-stone-600">
            <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-800 font-semibold">01 AES-256 Storage</span>
            <span>➔</span>
            <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-800 font-semibold">02 Least-Privilege Request</span>
            <span>➔</span>
            <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-800 font-semibold">03 Dual-Custody Approval</span>
            <span>➔</span>
            <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-800 font-semibold">04 1-Bit Gate</span>
            <span>➔</span>
            <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-800 font-semibold">05 Immutable Audit</span>
          </div>

          {/* Interactive Arrow Button to Toggle Detailed Stepper & Live Simulation */}
          <button
            onClick={() => setShowLifecycle(!showLifecycle)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-stone-50 hover:bg-stone-100 border border-black/[0.08] text-stone-800 transition-all self-start lg:self-auto shadow-xs flex-shrink-0"
          >
            <span>{showLifecycle ? 'Hide Stages & Simulation' : 'Inspect Stages & 1-Bit Gate Simulation'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showLifecycle ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable Lifecycle Detail Drawer */}
        {showLifecycle && (
          <div className="pt-3 border-t border-black/[0.06] space-y-4 animate-in fade-in duration-200">
            {/* 5-Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {lifecycleStages.map((stage) => {
                const isSelected = activeStage === stage.step;
                return (
                  <button
                    key={stage.step}
                    onClick={() => setActiveStage(stage.step)}
                    className={`p-3 rounded-xl text-left border transition-all relative ${
                      isSelected
                        ? 'bg-[#0d0d0d] text-white border-[#00E5FF] shadow-xs ring-1 ring-[#00E5FF]'
                        : 'bg-[#fafafa] hover:bg-stone-100 text-stone-800 border-black/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                        isSelected ? 'bg-white text-black' : 'bg-black/10 text-stone-700'
                      }`}>
                        0{stage.step}
                      </span>
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-[#00E5FF]' : 'bg-black/[0.04] text-stone-500'
                      }`}>
                        {stage.badge}
                      </span>
                    </div>
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                      {stage.title}
                    </p>
                    <p className={`text-[10px] font-mono truncate mt-0.5 ${isSelected ? 'text-white/70' : 'text-stone-500'}`}>
                      {stage.sub}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Technical Specs & Live Simulation */}
            {(() => {
              const currentStage = lifecycleStages[activeStage - 1];
              return (
                <div className="bg-stone-50 border border-black/[0.06] rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-black uppercase">
                        STAGE {currentStage.step}: {currentStage.title}
                      </span>
                      <span className="text-[11px] font-mono text-stone-500 bg-white px-2 py-0.5 rounded border border-black/[0.06]">
                        {currentStage.crypto}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-sans">
                      {currentStage.desc}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-3">
                    {currentStage.step === 4 ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSimulateGate(false)}
                          disabled={simulatedGateState === 'HASHING'}
                          className="px-3 py-1.5 text-xs font-mono font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          {simulatedGateState === 'HASHING' ? 'Hashing...' : 'Test Valid Gate'}
                        </button>
                        <button
                          onClick={() => handleSimulateGate(true)}
                          disabled={simulatedGateState === 'HASHING'}
                          className="px-3 py-1.5 text-xs font-mono font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-xs"
                        >
                          Simulate 1-Bit Tamper
                        </button>
                      </div>
                    ) : (
                      <Link
                        to={currentStage.link}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold bg-[#0d0d0d] text-white rounded-lg hover:bg-[#262626] transition-colors shadow-xs"
                      >
                        <span>{currentStage.action}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Live Gate Simulation Feedback */}
            {simulatedGateState !== 'IDLE' && (
              <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
                simulatedGateState === 'HASHING'
                  ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                  : simulatedGateState === 'PASSED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {simulatedGateState === 'HASHING' && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
                  {simulatedGateState === 'PASSED' && <Check className="w-4 h-4 text-emerald-600" />}
                  {simulatedGateState === 'FAILED' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  <div>
                    {simulatedGateState === 'HASHING' && <span>Computing SHA-256 via browser Web Cryptography API...</span>}
                    {simulatedGateState === 'PASSED' && (
                      <span>
                        <strong>INTEGRITY VERIFIED:</strong> Client SHA-256 matches immutable on-chain state hash. Payload decrypted cleanly into memory.
                      </span>
                    )}
                    {simulatedGateState === 'FAILED' && (
                      <span>
                        <strong>TAMPER DETECTED:</strong> Single-bit hash divergence detected! Decryption halted immediately. Forensic alert dispatched to SOC.
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSimulatedGateState('IDLE')}
                  className="text-[11px] underline opacity-75 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. MAIN 2-COLUMN SECTION                                       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Defence Assets & RBAC Matrix */}
        <div className="lg:col-span-7 space-y-6">
          {/* Critical Defence Assets */}
          <div className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-stone-900">
                  Critical Defence Assets in Active Custody
                </h2>
              </div>
              <Link
                to="/assets"
                className="text-xs font-mono font-semibold text-stone-600 hover:text-black inline-flex items-center gap-1"
              >
                <span>All Assets ({assets.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Asset Cards with Expandable Detailed View via Arrow */}
            <div className="space-y-2.5">
              {(showAllAssets ? assets : assets.slice(0, 3)).map((asset) => {
                const isExpanded = !!expandedAssetIds[asset.id];
                return (
                  <div
                    key={asset.id}
                    className="rounded-xl border border-black/[0.06] bg-[#fafafa] hover:bg-[#f6f6f6] transition-colors overflow-hidden"
                  >
                    {/* Compact Primary Row */}
                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ClassificationBadge classification={asset.classification} />
                        <Link
                          to={`/assets/${asset.id}`}
                          className="font-mono text-xs font-bold text-stone-900 hover:text-blue-600 transition-colors truncate"
                        >
                          {asset.title}
                        </Link>
                        <span className="font-mono text-[10px] text-stone-400 bg-white px-2 py-0.5 rounded border border-black/[0.06] flex-shrink-0 hidden md:inline">
                          {asset.onChainTokenId}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                        <span className="text-[11px] font-mono text-stone-500">
                          {formatBytes(asset.sizeBytes)}
                        </span>

                        {/* Interactive Arrow Button for Forensic Metadata */}
                        <button
                          onClick={() => toggleAssetExpand(asset.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-white border border-black/[0.08] text-stone-700 hover:text-black hover:border-black/20 transition-all shadow-xs"
                        >
                          <span>{isExpanded ? 'Less' : 'Details'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Heavy Forensic Details Drawer */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-black/[0.04] bg-white/60 space-y-2 animate-in fade-in duration-150">
                        <p className="text-xs text-stone-600 font-sans">
                          {asset.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[11px] font-mono text-stone-500 border-t border-black/[0.04]">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>Dept: <strong className="text-stone-700">{asset.department}</strong></span>
                            <span>·</span>
                            <span>Owner: <strong className="text-stone-700">{asset.ownerName}</strong></span>
                            <span>·</span>
                            <span>Cipher: <strong className="text-stone-700">{asset.encryptionType}</strong></span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopy(asset.sha256Hash)}
                              className="inline-flex items-center gap-1 text-[10px] text-stone-500 hover:text-black font-semibold"
                              title="Copy SHA-256 hash"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedHash === asset.sha256Hash ? 'COPIED' : 'COPY HASH'}</span>
                            </button>

                            <Link
                              to={`/assets/${asset.id}`}
                              className="text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              Inspect On-Chain →
                            </Link>
                          </div>
                        </div>

                        {/* Hash Fingerprint Display */}
                        <div className="text-[10px] font-mono text-stone-400 bg-stone-100 p-1.5 rounded truncate" title={asset.sha256Hash}>
                          SHA-256: {asset.sha256Hash}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Expand / Collapse Button for More Assets */}
            {assets.length > 3 && (
              <button
                onClick={() => setShowAllAssets(!showAllAssets)}
                className="w-full py-2 text-center text-xs font-mono font-semibold text-stone-600 hover:text-black bg-stone-50 hover:bg-stone-100 rounded-xl border border-black/[0.06] transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{showAllAssets ? 'Show Top 3 Assets Only' : `View All Assets (${assets.length})`}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllAssets ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Enforced RBAC Matrix Card (Progressive Disclosure) */}
          <div className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                  Enforced RBAC & Separation of Duties Matrix
                </h3>
              </div>

              {/* Arrow Toggle Button for Heavy Table */}
              <button
                onClick={() => setShowRbacMatrix(!showRbacMatrix)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-stone-50 hover:bg-stone-100 border border-black/[0.08] text-stone-700 transition-all self-start sm:self-auto shadow-xs"
              >
                <span>{showRbacMatrix ? 'Hide Full Matrix' : 'View Complete Matrix (8 Roles)'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRbacMatrix ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Compact Active Role Privilege Summary */}
            <div className="p-3 bg-stone-50 border border-black/[0.06] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-black uppercase">{activeRoleConfig.name}:</span>
                <span className="font-mono text-[11px] text-stone-500">
                  Upload: {activeRoleConfig.permissions.canUpload ? '✓' : '✗'} ·
                  Approve: {activeRoleConfig.permissions.canApprove ? '✓' : '✗'} ·
                  Decrypt: {activeRoleConfig.permissions.canDecryptPayload ? '✓ (Grant Required)' : 'BLOCKED'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold self-start sm:self-auto">
                ACTIVE
              </span>
            </div>

            {/* Expandable Heavy 8-Role Matrix Table */}
            {showRbacMatrix && (
              <div className="animate-in fade-in duration-200 space-y-3 pt-1">
                <p className="text-xs text-stone-600 font-sans">
                  Mathematical boundaries prevent single points of compromise. System administrators cannot read file payloads, managers cannot rewrite audit logs, and technical engineers cannot self-approve classified access.
                </p>

                <div className="overflow-x-auto border border-black/[0.06] rounded-xl">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-[#fafafa] border-b border-black/[0.08] text-[10px] text-stone-500 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">System Role</th>
                        <th className="py-2.5 px-2 text-center">Upload</th>
                        <th className="py-2.5 px-2 text-center">Request</th>
                        <th className="py-2.5 px-2 text-center">Approve</th>
                        <th className="py-2.5 px-2 text-center">Decrypt</th>
                        <th className="py-2.5 px-2 text-center">Audit</th>
                        <th className="py-2.5 px-2 text-center">Freeze</th>
                        <th className="py-2.5 px-2 text-center">DIDs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {(Object.keys(AEGIS_SYSTEM_ROLES) as AegisSystemRoleId[]).map((rKey) => {
                        const conf = AEGIS_SYSTEM_ROLES[rKey];
                        const isSelected = activeSystemRoleId === rKey;
                        return (
                          <tr
                            key={rKey}
                            className={`transition-colors ${
                              isSelected ? 'bg-[#0d0d0d] text-white font-semibold' : 'hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <td className="py-2.5 px-3 flex items-center gap-1.5">
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />}
                              <span>{conf.name}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center">{conf.permissions.canUpload ? '✓' : '—'}</td>
                            <td className="py-2.5 px-2 text-center">{conf.permissions.canRequest ? '✓' : '—'}</td>
                            <td className="py-2.5 px-2 text-center">{conf.permissions.canApprove ? '✓' : '—'}</td>
                            <td className={`py-2.5 px-2 text-center font-bold ${!conf.permissions.canDecryptPayload ? 'text-rose-500' : ''}`}>
                              {conf.permissions.canDecryptPayload ? '✓' : 'BLOCKED'}
                            </td>
                            <td className="py-2.5 px-2 text-center">{conf.permissions.canViewAuditLedger ? '✓' : '—'}</td>
                            <td className="py-2.5 px-2 text-center">{conf.permissions.canEmergencyFreeze ? '✓' : '—'}</td>
                            <td className="py-2.5 px-2 text-center">{conf.permissions.canManageIdentities ? '✓' : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setShowRbacMatrix(false)}
                    className="text-xs font-mono font-semibold text-stone-600 hover:text-black inline-flex items-center gap-1"
                  >
                    <span>Collapse Matrix</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Immutable Ledger & Key Readiness */}
        <div className="lg:col-span-5 space-y-6">
          {/* Besu Audit Ledger */}
          <div className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-stone-700" />
                <h2 className="text-base font-bold text-stone-900">
                  Besu Immutable Audit Ledger
                </h2>
              </div>
              <Link
                to="/audit-logs"
                className="text-xs font-mono font-semibold text-stone-600 hover:text-black inline-flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Compact List of Audit Logs with Progressive Disclosure */}
            <div className="space-y-2.5 font-mono text-xs">
              {(showAllLogs ? auditLogs : auditLogs.slice(0, 3)).map((log) => {
                const isExpanded = !!expandedLogIds[log.id];
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-[#fafafa] rounded-xl border border-black/[0.06] hover:border-black/20 transition-all space-y-2"
                  >
                    {/* Primary Row: Scan-friendly event identity */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded flex-shrink-0 ${
                          log.eventType === 'INTEGRITY_MISMATCH' || log.eventType === 'BULK_LOCKDOWN'
                            ? 'bg-rose-100 text-rose-700'
                            : log.eventType === 'DOWNLOAD_VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-800'
                        }`}>
                          {log.eventType}
                        </span>
                        <span className="font-bold text-stone-900 truncate">
                          {log.actorName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-stone-500">
                          {formatRelativeTime(log.timestamp)}
                        </span>
                        {/* Interactive Arrow Button for Forensic Narrative & TxHash */}
                        <button
                          onClick={() => toggleLogExpand(log.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-black/[0.08] text-stone-700 hover:text-black transition-all shadow-xs"
                        >
                          <span>{isExpanded ? 'Less' : 'Details'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Heavy Details Drawer */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-black/[0.06] space-y-2 animate-in fade-in duration-150">
                        <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                          {log.details}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                          <span className="font-bold text-stone-800">BLOCK #{log.blockNumber}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-stone-400 truncate max-w-[140px]" title={log.txHash}>
                              Tx: {log.txHash}
                            </span>
                            <button
                              onClick={() => handleCopy(log.txHash)}
                              className="text-stone-600 hover:text-black font-semibold uppercase text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/[0.08]"
                              title="Copy transaction hash"
                            >
                              {copiedHash === log.txHash ? 'COPIED' : 'COPY'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Expand / Collapse Button for More Logs */}
            {auditLogs.length > 3 && (
              <button
                onClick={() => setShowAllLogs(!showAllLogs)}
                className="w-full py-2 text-center text-xs font-mono font-semibold text-stone-600 hover:text-black bg-stone-50 hover:bg-stone-100 rounded-xl border border-black/[0.06] transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{showAllLogs ? 'Show Recent 3 Events Only' : `View More Events (${auditLogs.length - 3} more)`}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllLogs ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Bottom Consensus Status Bar */}
            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>CONSENSUS: IBFT 2.0 (4 VALIDATORS)</span>
              </span>
              <span className="text-emerald-700 font-semibold">{tps.toFixed(1)} TPS</span>
            </div>
          </div>

          {/* Quick Security & Key Hygiene Widget (Progressive Disclosure) */}
          <div className="bg-[#0d0d0d] text-white rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#00E5FF]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  Hardware FIDO2 & MFA Readiness
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#00E5FF] bg-white/10 px-2 py-0.5 rounded">
                  COMPLIANT
                </span>
                <button
                  onClick={() => setShowFidoDetails(!showFidoDetails)}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-white/80 hover:text-white px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <span>{showFidoDetails ? 'Less' : 'Details'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFidoDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {showFidoDetails && (
              <div className="space-y-3 pt-1 border-t border-white/10 animate-in fade-in duration-150">
                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  All access grants require cryptographic proof of identity using WebAuthn / Passkeys backed by physical security chips (TPM 2.0 / YubiKey).
                </p>

                <div className="flex items-center justify-between text-xs font-mono text-white/60">
                  <span>Passkeys Registered: <strong className="text-white">{currentUser?.passkeysCount || 2}</strong></span>
                  <Link to="/passkeys" className="text-[#00E5FF] hover:underline font-semibold">
                    Manage Keys →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. 8 DEFENCE SECURITY RULES (Progressive Disclosure)           */}
      {/* ============================================================== */}
      <div className="bg-white border border-black/[0.08] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              8 Architectural Security Principles for Defence Use Cases (BEL SIH26125)
            </h3>
          </div>

          {/* Arrow Button to Toggle 8 Principles Cards */}
          <button
            onClick={() => setShowSecurityRules(!showSecurityRules)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-stone-50 hover:bg-stone-100 border border-black/[0.08] text-stone-700 transition-all self-start sm:self-auto shadow-xs flex-shrink-0"
          >
            <span>{showSecurityRules ? 'Hide Security Principles' : 'View All 8 Principles'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSecurityRules ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable 8-Card Grid when Opened */}
        {showSecurityRules && (
          <div className="pt-3 border-t border-black/[0.06] space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {DEFENCE_SECURITY_RULES.map((rule, idx) => (
                <div key={idx} className="p-3.5 bg-stone-50 border border-black/[0.06] rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">{rule.rule}</span>
                    <span className="font-mono text-[10px] text-stone-400">0{idx + 1}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowSecurityRules(false)}
                className="text-xs font-mono font-semibold text-stone-600 hover:text-black inline-flex items-center gap-1"
              >
                <span>Collapse Principles</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
