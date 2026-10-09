import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Cpu,
  Lock,
  FileCheck,
  Clock,
  Key
} from 'lucide-react';
import { computeSha256, compareHashes } from '../utils/crypto';
import { Button } from '../components/common/Button';

export const TrustPortal: React.FC = () => {
  // 01. Hero Proof Rail State
  const [proofRailStep, setProofRailStep] = useState(2);
  const proofNodes = [
    { id: 'IDENTITY', label: 'IDENTITY', tag: 'DID ANCHORED', desc: 'Platform-issued pseudonymous identity (DID) recorded on a permissioned Fabric ledger.' },
    { id: 'ACCESS', label: 'ACCESS', tag: 'ZERO-TRUST', desc: 'Role-based evaluation with cryptographic least-privilege boundary.' },
    { id: 'HASH', label: 'HASH', tag: 'SHA-256 SEAL', desc: 'Off-chain file hash anchored to ledger; payload never touches chain.' },
    { id: 'APPROVAL', label: 'APPROVAL', tag: 'TIME-BOUND', desc: 'Director-signed clearance with automated block-timestamp expiration.' },
    { id: 'AUDIT', label: 'AUDIT', tag: 'IMMUTABLE', desc: 'Permanent tamper-evident forensic trail for independent audits.' },
  ];

  // 03. Architecture Step State
  const [archStep, setArchStep] = useState(1);

  // 04. Role Tabs
  const [activeRole, setActiveRole] = useState<'Employee' | 'Manager' | 'Admin' | 'Auditor' | 'Security Officer'>('Manager');

  // 05. Live Verification Terminal State
  const sampleMemo = `[RADAR SYSTEMS // SENSOR SPECIFICATION]
UNIT: X-BAND AESA RADAR TRANSCEIVER COEFFICIENTS
FREQUENCY: 9.42GHz | PEAK_POWER: 45kW | PRF: 2400Hz
HOPPING_KEY_ID: ECCM-9921-X
SECURITY CLEARANCE: LEVEL-4 SENSOR ENGINEERS ONLY`;

  const [sealedText, setSealedText] = useState(sampleMemo);
  const [onChainHash, setOnChainHash] = useState('');
  const [downloadText, setDownloadText] = useState(sampleMemo);
  const [downloadHash, setDownloadHash] = useState('');
  const [verificationState, setVerificationState] = useState<'MATCH' | 'MISMATCH' | 'REVOKED'>('MATCH');
  const [miniAudit, setMiniAudit] = useState<{ action: string; time: string; note: string }[]>([
    { action: 'SEALED', time: '12:00:00', note: 'SHA-256 fingerprint anchored to Fabric ledger' },
  ]);

  // Compute initial SHA-256 hash
  useEffect(() => {
    (async () => {
      const h = await computeSha256(sampleMemo);
      setOnChainHash(h);
      setDownloadHash(h);
    })();
  }, []);

  const handleDownloadChange = async (val: string) => {
    setDownloadText(val);
    if (!val) {
      setDownloadHash('');
      setVerificationState('MISMATCH');
      return;
    }
    const h = await computeSha256(val);
    setDownloadHash(h);

    const comp = compareHashes(h, onChainHash);
    if (comp.isMatch) {
      setVerificationState('MATCH');
      appendAudit('VERIFIED', 'Hash match confirmed · Decrypt permitted');
    } else {
      setVerificationState('MISMATCH');
      appendAudit('TAMPER DETECTED', `Divergence in ${comp.diffIndices.length} nibbles · Decrypt blocked`);
    }
  };

  const handleTamper = () => {
    const tampered = downloadText.replace('9.42GHz', '9.43GHz');
    handleDownloadChange(tampered);
  };

  const handleRestore = () => {
    setDownloadText(sealedText);
    handleDownloadChange(sealedText);
  };

  const handleRevoke = () => {
    setVerificationState('REVOKED');
    appendAudit('REVOKED', 'Access grant expired · Decrypt denied');
  };

  const appendAudit = (action: string, note: string) => {
    const now = new Date().toTimeString().split(' ')[0];
    setMiniAudit(prev => [{ action, time: now, note }, ...prev.slice(0, 3)]);
  };

  // Smooth scroll sync for Hero Proof Rail
  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById('hero');
      if (!heroEl) return;
      const rect = heroEl.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top / (rect.height * 0.75), 0), 1);
      const calculatedStep = Math.min(Math.floor(progress * proofNodes.length), proofNodes.length - 1);
      setProofRailStep(calculatedStep);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [proofNodes.length]);

  return (
    <div className="space-y-16 sm:space-y-20 max-w-6xl mx-auto px-4 sm:px-6">
      {/* ============================================================== */}
      {/* 01 HERO / SECURE COMMAND CENTRE                                 */}
      {/* ============================================================== */}
      <section id="hero" className="pt-2 sm:pt-6 space-y-5">
        <div className="space-y-3.5 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-bel-navy text-parchment border-[1.5px] border-bel-navy font-mono text-[11px] font-bold uppercase tracking-widest shadow-ink-sm">
            <span className="w-2 h-2 rounded-full bg-muted-blue animate-pulse" />
            <span>SECURE ENGINEERING ASSET PROTECTION</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-bel-navy uppercase font-black tracking-tight leading-[0.92]">
            THE TRUST LAYER<br />
            <span className="text-muted-blue">FOR DEFENCE ASSETS.</span>
          </h1>

          <p className="font-mono text-xs sm:text-sm text-bel-navy/80 max-w-2xl leading-relaxed">
            AegisChain provides cryptographic proof of identity and access for engineering organizations without putting sensitive document payloads on-chain.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link to="/dashboard">
              <Button variant="primary" size="md" leftIcon={<Shield className="w-4 h-4" />}>
                Enter Secure Vault
              </Button>
            </Link>
            <a href="#bel-problem">
              <Button variant="outline" size="md">
                Explore Threat Vectors
              </Button>
            </a>
          </div>
        </div>

        {/* Minimal High-Impact Proof Rail */}
        <div className="bg-warm-white border-2 border-bel-navy p-4 sm:p-5 shadow-ink technical-corner">
          <div className="flex items-center justify-between pb-2.5 border-b border-bel-navy/15 font-mono text-xs">
            <span className="font-bold text-bel-navy uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-muted-blue" />
              ZERO-TRUST PROOF RAIL
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-bel-navy/70 uppercase">
                STAGE 0{proofRailStep + 1} OF 05
              </span>
              <div className="flex items-center gap-1">
                {proofNodes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setProofRailStep(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === proofRailStep ? 'bg-bel-navy scale-125' : 'bg-bel-navy/20 hover:bg-bel-navy/50'
                    }`}
                    title={`Jump to stage ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="relative pt-5 pb-2">
            {/* Base line */}
            <div className="absolute top-9 sm:top-10 left-6 right-6 h-0.5 bg-bel-navy/20 -translate-y-1/2 z-0" />
            {/* Progress line */}
            <div
              className="absolute top-9 sm:top-10 left-6 h-0.5 bg-muted-blue -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${(proofRailStep / (proofNodes.length - 1)) * 100}%` }}
            />

            {/* 5 Compact Stepper Nodes */}
            <div className="relative z-10 flex items-start justify-between">
              {proofNodes.map((node, idx) => {
                const isPassed = idx <= proofRailStep;
                const isCurrent = idx === proofRailStep;

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setProofRailStep(idx)}
                    className="flex flex-col items-center group text-center focus:outline-none max-w-[18%]"
                  >
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 border-2 border-bel-navy flex items-center justify-center font-mono text-xs font-bold transition-all shadow-ink-sm ${
                        isPassed
                          ? 'bg-bel-navy text-parchment'
                          : 'bg-warm-white text-bel-navy/40'
                      } ${isCurrent ? 'ring-2 ring-muted-blue ring-offset-2 scale-105' : 'hover:border-muted-blue'}`}
                    >
                      0{idx + 1}
                    </div>

                    <span
                      className={`font-mono text-[10px] sm:text-[11px] uppercase font-bold mt-1.5 tracking-wider transition-colors ${
                        isPassed ? 'text-bel-navy' : 'text-bel-navy/40'
                      }`}
                    >
                      {node.label}
                    </span>

                    <span
                      className={`font-mono text-[8px] sm:text-[9px] tracking-tight uppercase transition-opacity hidden sm:inline-block ${
                        isPassed ? 'text-muted-blue font-bold opacity-100' : 'opacity-0'
                      }`}
                    >
                      {node.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stage Callout */}
            <div className="mt-4 pt-2.5 border-t border-bel-navy/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono text-xs">
              <span className="font-bold uppercase text-muted-blue text-[11px]">
                STAGE 0{proofRailStep + 1} // {proofNodes[proofRailStep].label}:
              </span>
              <span className="text-[11px] text-bel-navy/80">
                {proofNodes[proofRailStep].desc}
              </span>
            </div>
          </div>
        </div>

        {/* Live Operational Ticker */}
        <div className="bg-bel-navy text-parchment border-2 border-bel-navy py-1.5 px-3 overflow-hidden font-mono text-[11px] shadow-ink-sm">
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
            <span className="text-muted-blue font-bold">OPERATIONAL TELEMETRY //</span>
            <span>ENGINEERING LAB · SENSOR SPEC SEALED · HASH 9F3A…C1D2 · INTEGRITY VERIFIED</span>
            <span className="text-muted-blue">·</span>
            <span>EW DIRECTORATE · 8-HOUR ACCESS GRANT ACTIVE</span>
            <span className="text-muted-blue">·</span>
            <span>VELOCITY MONITOR ACTIVE · ZERO BULK EXFILTRATION DETECTED</span>
            <span className="text-muted-blue">·</span>
            <span>PRIVATE CONSORTIUM · 100% OFF-CHAIN ENCRYPTED CUSTODY</span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 02 THE REAL PROBLEM (CONCISE 4-CARD MATRIX)              */}
      {/* ============================================================== */}
      <section id="bel-problem" className="space-y-4 scroll-mt-24">
        <div className="border-b-2 border-bel-navy pb-2.5">
          <span className="font-mono text-xs text-muted-blue font-bold uppercase tracking-wider">
            VULNERABILITY MATRIX // ENGINEERING IP
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-0.5">
            FOUR CRITICAL DEFENCE VULNERABILITIES.
          </h2>
          <p className="font-mono text-xs text-bel-navy/70 mt-1 max-w-2xl">
            Off-chain storage across engineering teams exposes confidential IP to four major risks:
          </p>
        </div>

        {/* 4 Clean, Balanced Operational Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono text-xs">
          {[
            {
              id: '01',
              unit: 'RADAR SYSTEMS',
              title: 'Silent Storage Tampering',
              risk: 'Modifications to calibration tables deploy corrupted parameters to radar arrays undetected.',
              solution: 'SHA-256 hash comparison aborts decrypt on a 1-bit shift.',
            },
            {
              id: '02',
              unit: 'ELECTRONIC WARFARE',
              title: 'Insider Bulk Exfiltration',
              risk: 'Compromised accounts mass-download proprietary EW schematics prior to deployment.',
              solution: 'Velocity telemetry engages automatic session lockdown.',
            },
            {
              id: '03',
              unit: 'TACTICAL RADIOS & SDR',
              title: 'Stale Multi-Vendor Access',
              risk: 'External trial engineers retain access clearances months after rotations conclude.',
              solution: 'Smart contract grants expire automatically on exact block timestamp.',
            },
            {
              id: '04',
              unit: 'MISSILE GUIDANCE',
              title: 'Malleable Central Logs',
              risk: 'Root administrators can alter, backdate, or erase central database audit logs.',
              solution: 'Every grant and download is an immutable ledger transaction.',
            },
          ].map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-warm-white border-2 border-bel-navy shadow-ink-sm hover:border-muted-blue transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-muted-blue">VULN // {item.id}</span>
                  <span className="stamp-blocked text-[9px] py-0">BLOCKED</span>
                </div>
                <span className="text-[9px] text-bel-navy/50 font-bold uppercase block mb-1">
                  [{item.unit}]
                </span>
                <h3 className="text-xs font-bold text-bel-navy uppercase leading-snug mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[11px] text-bel-navy/70 leading-relaxed mb-2.5">
                  {item.risk}
                </p>
              </div>
              <div className="pt-2 border-t border-bel-navy/15 text-[10px]">
                <span className="text-muted-blue font-bold uppercase block mb-0.5">AegisChain Fix:</span>
                <span className="text-bel-navy font-semibold">{item.solution}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 03 DUAL-LAYER ZERO-TRUST ARCHITECTURE (THE SOLUTION)            */}
      {/* ============================================================== */}
      <section id="solution" className="space-y-4 scroll-mt-24">
        <div className="border-b-2 border-bel-navy pb-2.5">
          <span className="font-mono text-xs text-muted-blue font-bold uppercase tracking-wider">
            DUAL-LAYER ZERO-TRUST // HOW IT WORKS
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-0.5">
            THE PROOF IS ON-CHAIN. THE DATA NEVER IS.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: 5 Compact Operational Steps */}
          <div className="lg:col-span-5 space-y-2 font-mono text-xs">
            {[
              { step: 1, title: 'Issue Platform DID', desc: 'Admin issues identity credential mapped to engineering clearance.' },
              { step: 2, title: 'Seal Off-Chain Payload', desc: '100% of payload encrypted off-chain; SHA-256 fingerprint anchored to ledger.' },
              { step: 3, title: 'Request Access with Purpose', desc: 'Engineer submits mission purpose; Director signs time-limited grant.' },
              { step: 4, title: 'Verify at Download Gate', desc: 'Client recomputes SHA-256 locally; 1-bit mismatch blocks decrypt.' },
              { step: 5, title: 'Immutable Forensic Log', desc: 'Every action leaves a permanent, tamper-evident trace on Fabric ledger.' },
            ].map((s) => (
              <div
                key={s.step}
                onClick={() => setArchStep(s.step)}
                className={`p-2.5 border-2 cursor-pointer transition-all ${
                  archStep === s.step
                    ? 'bg-bel-navy text-parchment border-bel-navy shadow-ink-sm'
                    : 'bg-warm-white text-bel-navy border-bel-navy/30 hover:border-bel-navy'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 flex items-center justify-center font-bold text-[10px] border ${
                    archStep === s.step ? 'bg-muted-blue text-bel-navy border-bel-navy' : 'bg-bel-navy/10 text-bel-navy border-bel-navy/30'
                  }`}>
                    0{s.step}
                  </span>
                  <h3 className="font-bold text-xs uppercase">{s.title}</h3>
                </div>
                <p className={`text-[11px] mt-0.5 leading-tight ${archStep === s.step ? 'text-parchment/90' : 'text-bel-navy/70'}`}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Right: Technical Diagram Strictly in Combo 2 (#0C2C55, #629FAD, #EDEDCE) */}
          <div className="lg:col-span-7 bg-bel-navy text-parchment p-4 sm:p-5 border-2 border-bel-navy shadow-ink technical-corner">
            <div className="flex items-center justify-between text-xs font-mono text-muted-blue border-b border-muted-blue/30 pb-2 mb-3">
              <span className="font-bold uppercase text-parchment">DATA FLOW PIPELINE</span>
              <span>STAGE 0{archStep} OF 05</span>
            </div>

            <div className="bg-bel-navy-dark p-3 border border-muted-blue/40">
              <svg viewBox="0 0 500 240" className="w-full h-auto">
                {/* Browser Node */}
                <rect x="20" y="70" width="105" height="80" fill="#0C2C55" stroke="#629FAD" strokeWidth="1.5" />
                <text x="72" y="102" fill="#EDEDCE" fontSize="11" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="bold">ENGINEER</text>
                <text x="72" y="120" fill="#629FAD" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">Client Gate</text>
                <text x="72" y="135" fill="#EDEDCE" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">SHA-256 Check</text>

                {/* Connecting Line */}
                <line x1="125" y1="110" x2="190" y2="110" stroke="#629FAD" strokeWidth="2" strokeDasharray={archStep >= 2 ? '0' : '4 2'} />

                {/* Gateway Node */}
                <rect x="190" y="70" width="115" height="80" fill="#0C2C55" stroke="#629FAD" strokeWidth="1.5" />
                <text x="247" y="102" fill="#EDEDCE" fontSize="11" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="bold">ZERO-TRUST</text>
                <text x="247" y="120" fill="#629FAD" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">Access Gateway</text>
                <text x="247" y="135" fill="#EDEDCE" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">DID / Passkeys</text>

                {/* Split Lines */}
                <line x1="305" y1="95" x2="370" y2="50" stroke="#629FAD" strokeWidth="2" />
                <line x1="305" y1="125" x2="370" y2="170" stroke="#629FAD" strokeWidth="2" />

                {/* Top: Private Blockchain */}
                <rect x="370" y="15" width="115" height="70" fill="#081D39" stroke="#629FAD" strokeWidth="1.5" />
                <text x="427" y="42" fill="#EDEDCE" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="bold">TRUST LEDGER</text>
                <text x="427" y="60" fill="#629FAD" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">HASH + OWNER</text>
                <text x="427" y="73" fill="#EDEDCE" fontSize="8" fontFamily="IBM Plex Mono" textAnchor="middle">ZERO SECRETS</text>

                {/* Bottom: Encrypted Storage */}
                <rect x="370" y="140" width="115" height="70" fill="#081D39" stroke="#629FAD" strokeWidth="1.5" />
                <text x="427" y="167" fill="#EDEDCE" fontSize="10" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="bold">CUSTODY NAS</text>
                <text x="427" y="185" fill="#629FAD" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">ENCRYPTED</text>
                <text x="427" y="198" fill="#EDEDCE" fontSize="8" fontFamily="IBM Plex Mono" textAnchor="middle">100% OFF-CHAIN</text>
              </svg>
            </div>

            <p className="mt-2.5 font-mono text-[10px] text-parchment/80">
              • The Fabric ledger stores proofs and grants, never confidential payloads. If off-chain files are altered, local client verification immediately blocks decryption.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 04 ROLES & SEPARATION OF DUTIES                                */}
      {/* ============================================================== */}
      <section id="roles" className="space-y-4 scroll-mt-24">
        <div className="border-b-2 border-bel-navy pb-2.5">
          <span className="font-mono text-xs text-muted-blue font-bold uppercase tracking-wider">
            AUTHORITY PARTITIONING // ROLE MATRIX
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-0.5">
            NO ONE PERSON HOLDS ALL THE KEYS.
          </h2>
        </div>

        {/* 5 Accessible Role Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b-2 border-bel-navy pb-2 font-mono text-xs" role="tablist">
          {(['Employee', 'Manager', 'Admin', 'Auditor', 'Security Officer'] as const).map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={activeRole === r}
              onClick={() => setActiveRole(r)}
              className={`px-3 py-1 border-2 uppercase font-bold tracking-wider transition-all text-xs ${
                activeRole === r
                  ? 'bg-bel-navy text-parchment border-bel-navy shadow-ink-sm'
                  : 'bg-warm-white text-bel-navy border-bel-navy/30 hover:border-bel-navy'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Minimal Role Content & Matrix */}
        <div className="bg-warm-white border-2 border-bel-navy p-4 shadow-ink">
          <div className="space-y-3 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-bel-navy/15 pb-2">
              <div>
                <h3 className="font-bold text-xs uppercase text-bel-navy">{activeRole} Authority Boundary</h3>
                <p className="text-bel-navy/70 text-[11px] mt-0.5">
                  {activeRole === 'Admin' && 'Manages users, roles and credential resets; cannot approve access or download files without a grant.'}
                  {activeRole === 'Manager' && 'Approves time-bound grants for their department; cannot approve their own requests.'}
                  {activeRole === 'Auditor' && 'Reads audit history and verifies integrity; read-only, cannot download file contents.'}
                  {activeRole === 'Employee' && 'Uploads assets, requests access, and manages grants on assets they own; cannot approve their own requests.'}
                  {activeRole === 'Security Officer' && 'Triages alerts, locks users, freezes assets and revokes grants; cannot change roles or download without a grant.'}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-bel-navy text-parchment font-bold text-[10px] uppercase border border-bel-navy self-start sm:self-auto">
                {activeRole}
              </span>
            </div>

            {/* Permission Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-bel-navy/20 text-bel-navy/60 uppercase text-[9px]">
                    <th className="py-1">Operational Action</th>
                    <th className="py-1 text-center">Permission</th>
                    <th className="py-1">Boundary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bel-navy/15 text-bel-navy text-[11px]">
                  {[
                    { action: 'Issue user identities & DIDs', allowed: activeRole === 'Admin' },
                    { action: 'Upload & seal engineering assets', allowed: activeRole !== 'Auditor' },
                    { action: 'Approve access requests (owner or department manager)', allowed: ['Manager', 'Employee'].includes(activeRole) },
                    { action: 'Download files (owner or active grant only)', allowed: activeRole !== 'Auditor' },
                    { action: 'Inspect audit history', allowed: ['Auditor', 'Security Officer'].includes(activeRole) },
                    { action: 'Lock users, freeze assets, triage alerts', allowed: activeRole === 'Security Officer' },
                    { action: 'Read files without an explicit grant', allowed: false },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-bel-navy/5">
                      <td className="py-1.5 font-bold">{row.action}</td>
                      <td className="py-1.5 text-center">
                        {row.allowed ? (
                          <span className="inline-flex items-center gap-1 font-bold text-muted-blue">
                            <Check className="w-3.5 h-3.5" /> Allowed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-bel-navy/40">
                            <X className="w-3.5 h-3.5" /> Denied
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 text-[10px] text-bel-navy/70">
                        {row.action === 'Read files without an explicit grant'
                          ? 'Zero-trust: denied unless the owner or an active grant applies.'
                          : row.allowed
                          ? 'Permitted under assigned role certificate.'
                          : 'Prohibited by separation of duties.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 05 LIVE VERIFICATION PANEL (THE INTERACTIVE SHOWPIECE)           */}
      {/* ============================================================== */}
      <section id="demo" className="space-y-4 scroll-mt-24">
        <div className="border-b-2 border-bel-navy pb-2.5">
          <span className="font-mono text-xs text-muted-blue font-bold uppercase tracking-wider">
            INTERACTIVE DEFENCE TERMINAL // REAL WEB CRYPTO SHA-256
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-0.5">
            LIVE INTEGRITY VERIFICATION
          </h2>
        </div>

        <div className="bg-bel-navy text-parchment p-4 sm:p-5 border-2 border-bel-navy shadow-ink technical-corner space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-muted-blue/30 pb-2">
            <span className="font-bold text-xs uppercase text-parchment flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-blue" />
              RADAR CALIBRATION INTEGRITY GATE
            </span>
            <span className="text-[10px] text-muted-blue border border-muted-blue px-2 py-0.5 uppercase font-bold">
              REAL-TIME CRYPTO
            </span>
          </div>

          {/* Split: Sealed File vs Download Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Left: Sealed File */}
            <div className="space-y-1 bg-bel-navy-dark p-3 border border-muted-blue/30">
              <div className="flex items-center justify-between text-muted-blue text-[10px]">
                <span className="font-bold uppercase text-parchment">SEALED ON-CHAIN FILE</span>
                <span>ORIGINAL HASH</span>
              </div>

              <div className="p-2 bg-black/40 border border-muted-blue/20 text-stone-300 text-[10px] leading-relaxed h-24 overflow-y-auto select-all">
                {sealedText}
              </div>

              <div className="pt-1 space-y-0.5">
                <span className="text-[9px] text-muted-blue uppercase block">
                  ON-CHAIN ANCHOR HASH (SHA-256):
                </span>
                <div className="p-1 bg-black/60 border border-muted-blue/40 text-[9px] break-all select-all font-bold text-muted-blue">
                  {onChainHash}
                </div>
              </div>
            </div>

            {/* Right: Download Check */}
            <div className="space-y-1 bg-bel-navy-dark p-3 border border-muted-blue/30">
              <div className="flex items-center justify-between text-muted-blue text-[10px]">
                <span className="font-bold uppercase text-parchment">OFF-CHAIN DOWNLOAD BUFFER</span>
                <span className="text-muted-blue font-bold">EDITABLE BUFFER</span>
              </div>

              <textarea
                rows={3}
                value={downloadText}
                onChange={(e) => handleDownloadChange(e.target.value)}
                className="w-full p-2 bg-black/40 border border-muted-blue/40 text-stone-200 text-[10px] font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-muted-blue h-24"
              />

              <div className="pt-1 space-y-0.5">
                <span className="text-[9px] text-muted-blue uppercase block">
                  RECOMPUTED DOWNLOAD HASH:
                </span>
                <div
                  className={`p-1 bg-black/60 border text-[9px] break-all select-all font-bold ${
                    verificationState === 'MATCH'
                      ? 'border-muted-blue text-muted-blue'
                      : 'border-parchment text-parchment bg-bel-navy'
                  }`}
                >
                  {downloadHash}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Result Banner */}
          <div className="p-2.5 border-2 border-muted-blue/40 bg-black/40">
            {verificationState === 'MATCH' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-blue font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VERIFIED · SHA-256 HASH MATCH · DECRYPT PERMITTED</span>
                </div>
                <span className="stamp-verified text-[10px] py-0">MATCH</span>
              </div>
            )}

            {verificationState === 'MISMATCH' && (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-parchment font-bold text-xs">
                    <XCircle className="w-4 h-4 text-muted-blue" />
                    <span>TAMPER DETECTED · 1-BIT DIVERGENCE · DECRYPT BLOCKED</span>
                  </div>
                  <span className="stamp-blocked text-[10px] py-0 bg-parchment text-bel-navy border-parchment">
                    BLOCKED
                  </span>
                </div>
                <p className="text-[10px] text-parchment/80">
                  Cryptographic disparity detected. Client verification gate aborted decryption. SOC alert logged.
                </p>
              </div>
            )}

            {verificationState === 'REVOKED' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-parchment font-bold text-xs">
                  <XCircle className="w-4 h-4 text-muted-blue" />
                  <span>CLEARANCE REVOKED · ACCESS TIMEOUT · DECRYPT DENIED</span>
                </div>
                <span className="stamp-blocked text-[10px] py-0 bg-parchment text-bel-navy border-parchment">
                  DENIED
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Zap className="w-3 h-3 text-muted-blue" />}
              onClick={handleTamper}
            >
              Simulate 1-Bit Tamper (9.42GHz → 9.43GHz)
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-3 h-3" />}
              onClick={handleRestore}
            >
              Restore genuine file
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRevoke}
            >
              Simulate expired clearance
            </Button>
          </div>

          {/* Mini Audit Timeline */}
          <div className="pt-2.5 border-t border-muted-blue/30 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-blue">
              <span className="font-bold uppercase text-parchment">LIVE AUDIT EVENT LEDGER</span>
              <span>CONSORTIUM RECORD</span>
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              {miniAudit.map((item, idx) => (
                <div key={idx} className="p-1 bg-bel-navy-dark border border-muted-blue/20 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-muted-blue mr-1.5">[{item.action}]</span>
                    <span className="text-parchment/80">{item.note}</span>
                  </div>
                  <span className="text-muted-blue text-[9px]">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 06 FINAL CTA / DEMO ENTRY                                      */}
      {/* ============================================================== */}
      <section id="final-cta" className="bg-bel-navy text-parchment p-6 sm:p-10 border-2 border-bel-navy shadow-ink text-center space-y-4 technical-corner">
        <h2 className="font-serif text-3xl sm:text-5xl uppercase font-black text-parchment tracking-tight leading-none">
          SEAL IT. PROVE IT. AUDIT IT.
        </h2>

        <p className="font-mono text-xs sm:text-sm text-parchment/80 max-w-lg mx-auto leading-relaxed">
          Zero-trust identity custody and tamper-evident asset governance for engineering IP. Launch the Secure Vault to explore the prototype console.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link to="/dashboard">
            <Button variant="secondary" size="lg" leftIcon={<Shield className="w-5 h-5" />}>
              Enter Secure Vault
            </Button>
          </Link>
          <a href="#hero">
            <Button variant="outline" size="lg">
              Return to top
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};
