import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/landing/Header';
import { TempoHeroRings } from '../components/landing/TempoHeroRings';
import { BelPartnerMarquee } from '../components/landing/BelPartnerMarquee';
import { DottedRadarGlobe } from '../components/landing/DottedRadarGlobe';
import { AnimatedClearanceCards } from '../components/landing/AnimatedClearanceCards';
import { BranchingSettlementMesh } from '../components/landing/BranchingSettlementMesh';
import { computeSha256, compareHashes } from '../utils/crypto';
import { Check, X, CheckCircle2, XCircle, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import CloudSky from '../components/originkit/ui/cloud-sky';
import { NeonButton } from '../components/common/NeonButton';
import BlockTextReveal from '../components/originkit/ui/block-text-reveal';

export const TrustPortal: React.FC = () => {
  // Interactive Verification Terminal State
  const sampleBELMemo = `[BEL RADAR SYSTEMS // SENSOR SPECIFICATION]
UNIT: X-BAND AESA RADAR TRANSCEIVER COEFFICIENTS
FREQUENCY: 9.42GHz | PEAK_POWER: 45kW | PRF: 2400Hz
HOPPING_KEY_ID: BEL-ECCM-9921-X
SECURITY CLEARANCE: LEVEL-4 SENSOR ENGINEERS ONLY`;

  const [sealedText, setSealedText] = useState(sampleBELMemo);
  const [onChainHash, setOnChainHash] = useState('');
  const [downloadText, setDownloadText] = useState(sampleBELMemo);
  const [downloadHash, setDownloadHash] = useState('');
  const [verificationState, setVerificationState] = useState<'MATCH' | 'MISMATCH' | 'REVOKED'>('MATCH');
  const [miniAudit, setMiniAudit] = useState<{ action: string; time: string; note: string }[]>([
    { action: 'SEALED', time: '12:00:00', note: 'SHA-256 fingerprint anchored to consortium ledger' },
  ]);

  // Role Tab State (Mirrors separation of duties API contract)
  const [activeRole, setActiveRole] = useState<'Admin' | 'Manager' | 'Auditor' | 'Employee' | 'Security Officer'>('Manager');

  // Progressive disclosure for Threat Matrix (hiding heavy content behind interactive arrow buttons)
  const [expandedThreats, setExpandedThreats] = useState<Record<string, boolean>>({});
  const [expandAllThreats, setExpandAllThreats] = useState(false);

  const toggleThreat = (id: string) => {
    setExpandedThreats(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleAllThreats = () => {
    const next = !expandAllThreats;
    setExpandAllThreats(next);
    if (next) {
      setExpandedThreats({
        'VULN-01': true,
        'VULN-02': true,
        'VULN-03': true,
        'VULN-04': true,
      });
    } else {
      setExpandedThreats({});
    }
  };

  // Compute initial SHA-256 hash on mount
  useEffect(() => {
    (async () => {
      const h = await computeSha256(sampleBELMemo);
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
      appendAudit('VERIFIED', 'Hash match confirmed · Decrypt authorized');
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

  const appendAudit = (action: string, note: string) => {
    const now = new Date().toTimeString().split(' ')[0];
    setMiniAudit(prev => [{ action, time: now, note }, ...prev.slice(0, 3)]);
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#4d4d4d] font-sans antialiased overflow-x-hidden selection:bg-[#0d0d0d] selection:text-[#ffffff]">
      {/* ============================================================== */}
      {/* SECTION 1 — FLOATING PILL HEADER (Matching Image 1)            */}
      {/* ============================================================== */}
      <Header />

      <main id="main-content">
        {/* ============================================================== */}
        {/* SECTION 2 — HERO (100svh with exact Tempo Hero Rings in Motion) */}
        {/* ============================================================== */}
        <section className="relative min-h-[92svh] sm:min-h-[100svh] flex flex-col justify-center items-center px-6 sm:px-8 pt-[140px] sm:pt-[170px] pb-20 sm:pb-24 overflow-hidden">
          {/* Signature Tempo Hero Rings in Motion (Exact Asset & Shader Lines) */}
          <TempoHeroRings />

          {/* Hero Content Box */}
          <div className="relative z-10 max-w-[1100px] mx-auto text-center flex flex-col items-center">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-6 rounded-full bg-[#f0f0f0]/90 backdrop-blur-sm border border-black/[0.08] text-[12px] md:text-[13px] font-[450] tracking-[0.08em] uppercase text-[#909090]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />
              <span>BEL Sovereign Asset Custody</span>
            </div>

            {/* Measured H1: 64px desktop / 35px mobile, weight 300, tracking -1.92px, line-height 1 */}
            <h1 className="text-[35px] sm:text-[48px] md:text-[64px] font-[300] tracking-[-1.05px] md:tracking-[-1.92px] leading-[1.0] text-[#0d0d0d] max-w-[920px] mb-6">
              The trust layer for critical defence assets.
            </h1>

            {/* Measured Subhead: one line, muted color #4d4d4d, 18px */}
            <p className="text-[16px] sm:text-[18px] text-[#4d4d4d] max-w-[760px] leading-[1.5] mb-8 font-[400]">
              AegisChain provides cryptographic proof of identity and access for Bharat Electronics Limited without exposing sensitive payloads on-chain.
            </p>

            {/* CTAs: Side by Side with Originkit Neon Border */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <NeonButton
                as="link"
                to="/dashboard"
                variant="primary"
                pill={true}
                neonColor="#00E5FF"
                className="px-[26px] py-[10px] text-[16px]"
              >
                Enter Defence Vault
              </NeonButton>

              <NeonButton
                as="a"
                href="#solutions"
                variant="outline"
                pill={true}
                neonColor="#00E5FF"
                className="px-[26px] py-[10px] text-[16px]"
              >
                Explore Solutions
              </NeonButton>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3 — BEL ORGANIZATIONS ANIMATED MARQUEE (Image 2)       */}
        {/* ============================================================== */}
        <section className="py-16 md:py-20 border-t border-black/[0.08] bg-[#f3f3f3] overflow-hidden">
          <div className="max-w-[1180px] mx-auto px-6 sm:px-8 space-y-10">
            {/* Small Eyebrow */}
            <div className="text-center">
              <span className="text-[12px] md:text-[13px] uppercase tracking-[0.08em] font-[450] text-[#909090]">
                Deployed Across Sovereign Defence Establishments
              </span>
            </div>

            {/* Seamless Infinite Marquee with BEL customer & partner orgs */}
            <BelPartnerMarquee />

            {/* Operational Quote with Originkit Block Text Reveal */}
            <div className="pt-8 max-w-[960px] mx-auto text-center border-t border-black/[0.06] overflow-visible">
              <div className="py-2">
                <BlockTextReveal
                  text="AegisChain eliminated unauthorized storage modification risks across our radar testing facilities, ensuring mathematical integrity on every firmware download."
                  textColor="#0d0d0d"
                  blockColor="#00E5FF"
                  revealType="lines"
                  direction="left"
                  align="center"
                  speed={45}
                  rounded={4}
                  font={{
                    fontSize: "24px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 300,
                    lineHeight: "1.35em",
                    letterSpacing: "-0.02em",
                  }}
                  highlight={[
                    { text: "mathematical", block: true, color: "#00E5FF", textColor: "#0d0d0d", rounded: 6 },
                    { text: "firmware", block: true, color: "#0d0d0d", textColor: "#ffffff", rounded: 6 }
                  ]}
                />
              </div>
              <cite className="not-italic text-[13px] text-[#909090] font-mono block mt-4">
                Directorate of Coastal Radar & Sensor Electronics, Bharat Electronics Limited
              </cite>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4 — SOLUTIONS (3 White Cards with In-Motion Graphics)  */}
        {/* ============================================================== */}
        <section id="solutions" className="py-24 md:py-32 border-t border-black/[0.08] bg-[#f3f3f3]">
          <div className="max-w-[1180px] mx-auto px-6 sm:px-8 space-y-12">
            <div>
              <span className="text-[12px] md:text-[13px] uppercase tracking-[0.08em] font-[450] text-[#909090] block mb-2">
                SOLUTIONS
              </span>
              <h2 className="text-[35px] sm:text-[48px] md:text-[64px] font-[300] tracking-[-1.05px] md:tracking-[-1.92px] leading-[1.05] text-[#0d0d0d] max-w-[880px]">
                Scale your defence security with AegisChain on BEL infrastructure
              </h2>
              <p className="text-[16px] text-[#4d4d4d] max-w-[680px] mt-4 leading-[1.6]">
                AegisChain provides purpose-built zero-trust primitives for Bharat Electronics Limited—guaranteeing firmware integrity, instant revocation, and multi-command settlement.
              </p>
            </div>

            {/* 3 White Cards (Still Text at Top · In-Motion Graphics at Bottom) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Card 1: Radar Firmware Integrity */}
              <div className="bg-white rounded-[28px] border border-black/[0.08] p-8 sm:p-10 flex flex-col justify-between h-[520px] sm:h-[550px] overflow-hidden group hover:border-black/20 transition-colors">
                <div>
                  <a
                    href="#vulnerabilities"
                    className="group/title flex items-center justify-between text-[22px] sm:text-[24px] font-[450] tracking-[-0.6px] text-[#0d0d0d] mb-3 hover:text-black"
                  >
                    <span>Radar Firmware Integrity</span>
                    <ChevronRight className="w-5 h-5 text-[#909090] group-hover/title:text-[#0d0d0d] group-hover/title:translate-x-0.5 transition-all" />
                  </a>
                  <p className="text-[15px] text-[#4d4d4d] leading-[1.6]">
                    Protect AESA radar transceiver coefficients, EW calibration tables, and missile guidance binaries from silent off-chain modification.
                  </p>
                </div>

                {/* Motion Graphic: Rotating Dotted 3D Globe with Anchored Radar Badge */}
                <div className="pt-4">
                  <DottedRadarGlobe />
                </div>
              </div>

              {/* Card 2: Time-Bound Clearances */}
              <div className="bg-white rounded-[28px] border border-black/[0.08] p-8 sm:p-10 flex flex-col justify-between h-[520px] sm:h-[550px] overflow-hidden group hover:border-black/20 transition-colors">
                <div>
                  <a
                    href="#roles"
                    className="group/title flex items-center justify-between text-[22px] sm:text-[24px] font-[450] tracking-[-0.6px] text-[#0d0d0d] mb-3 hover:text-black"
                  >
                    <span>Time-Bound Clearances</span>
                    <ChevronRight className="w-5 h-5 text-[#909090] group-hover/title:text-[#0d0d0d] group-hover/title:translate-x-0.5 transition-all" />
                  </a>
                  <p className="text-[15px] text-[#4d4d4d] leading-[1.6]">
                    Issue cryptographically bound access clearances to testing engineers and multi-vendor contractors that expire automatically on the exact block timestamp.
                  </p>
                </div>

                {/* Motion Graphic: Layered Clearance Cards with Animated Exponential Curve */}
                <div className="pt-4">
                  <AnimatedClearanceCards />
                </div>
              </div>

              {/* Card 3: Consortium Settlement Mesh */}
              <div className="bg-white rounded-[28px] border border-black/[0.08] p-8 sm:p-10 flex flex-col justify-between h-[520px] sm:h-[550px] overflow-hidden group hover:border-black/20 transition-colors">
                <div>
                  <a
                    href="#architecture"
                    className="group/title flex items-center justify-between text-[22px] sm:text-[24px] font-[450] tracking-[-0.6px] text-[#0d0d0d] mb-3 hover:text-black"
                  >
                    <span>Consortium Settlement Mesh</span>
                    <ChevronRight className="w-5 h-5 text-[#909090] group-hover/title:text-[#0d0d0d] group-hover/title:translate-x-0.5 transition-all" />
                  </a>
                  <p className="text-[15px] text-[#4d4d4d] leading-[1.6]">
                    Settle asset access grants and tamper audits 24/7 across tri-service commands, testing grounds, and independent audit oversight.
                  </p>
                </div>

                {/* Motion Graphic: Central Hub with Branching Lines and Flowing Signal Packets */}
                <div className="pt-4">
                  <BranchingSettlementMesh />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5A — OPERATIONAL METRICS HEADER (In White Region)      */}
        {/* ============================================================== */}
        <section className="pt-20 md:pt-28 pb-10 sm:pb-12 bg-[#f3f3f3] border-t border-black/[0.08]">
          <div className="max-w-[1180px] mx-auto px-6 sm:px-8">
            <span className="text-[12px] md:text-[13px] uppercase tracking-[0.08em] font-[450] text-[#909090] block mb-2">
              Operational Metrics
            </span>
            <h2 className="text-[35px] sm:text-[48px] md:text-[64px] font-[300] tracking-[-1.05px] md:tracking-[-1.92px] leading-[1.05] text-[#0d0d0d]">
              Zero-trust security by the numbers.
            </h2>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5B — PROTOCOL STATS (In Black Region Only)             */}
        {/* ============================================================== */}
        <section className="bg-[#0d0d0d] text-[#ffffff] py-16 md:py-20">
          <div className="max-w-[1180px] mx-auto px-6 sm:px-8">
            {/* 4 Large Numerals in Black Region Only */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
              <div>
                <div className="text-[40px] sm:text-[54px] md:text-[64px] font-[300] tracking-[-1.92px] leading-[1] text-[#ffffff] mb-2">
                  100%
                </div>
                <div className="text-[13px] md:text-[14px] text-[#909090] font-[400]">
                  Off-Chain Encrypted Storage (AES-256)
                </div>
              </div>

              <div>
                <div className="text-[40px] sm:text-[54px] md:text-[64px] font-[300] tracking-[-1.92px] leading-[1] text-[#ffffff] mb-2">
                  1-Bit
                </div>
                <div className="text-[13px] md:text-[14px] text-[#909090] font-[400]">
                  Tamper Detection Sensitivity
                </div>
              </div>

              <div>
                <div className="text-[40px] sm:text-[54px] md:text-[64px] font-[300] tracking-[-1.92px] leading-[1] text-[#ffffff] mb-2">
                  &lt; 1s
                </div>
                <div className="text-[13px] md:text-[14px] text-[#909090] font-[400]">
                  Instant Smart Contract Revocation
                </div>
              </div>

              <div>
                <div className="text-[40px] sm:text-[54px] md:text-[64px] font-[300] tracking-[-1.92px] leading-[1] text-[#ffffff] mb-2">
                  0
                </div>
                <div className="text-[13px] md:text-[14px] text-[#909090] font-[400]">
                  Unaudited IP Access Decisions
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 6 — THREAT MATRIX (BEL 4 Critical Vulnerabilities)     */}
        {/* ============================================================== */}
        <section id="vulnerabilities" className="py-24 md:py-32 bg-[#f3f3f3] border-b border-black/[0.08]">
          <div className="max-w-[1180px] mx-auto px-6 sm:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="text-[12px] md:text-[13px] uppercase tracking-[0.08em] font-[450] text-[#909090] block mb-2">
                  Threat Matrix // Defence Pipeline
                </span>
                <h2 className="text-[35px] sm:text-[48px] md:text-[64px] font-[300] tracking-[-1.05px] md:tracking-[-1.92px] leading-[1.05] text-[#0d0d0d]">
                  Four critical vulnerabilities in defence electronics.
                </h2>
                <p className="text-[16px] text-[#4d4d4d] max-w-[680px] mt-4 leading-[1.6]">
                  Bharat Electronics Limited produces sovereign radar arrays, electronic warfare suites, and missile avionics. Traditional IT storage leaves these 4 mission-critical gaps:
                </p>
              </div>

              {/* Toggle All Button */}
              <button
                onClick={handleToggleAllThreats}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono font-semibold bg-white border border-black/[0.1] hover:border-black/30 text-stone-800 transition-all shadow-xs self-start md:self-auto flex-shrink-0"
              >
                <span>{expandAllThreats ? 'Collapse All Threats' : 'Expand All Threat Analyses'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandAllThreats ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* 4 Cards with Progressive Disclosure (Hide heavy content behind interactive arrow) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  id: 'VULN-01',
                  unit: 'AESA & COASTAL RADARS',
                  title: 'Silent Storage Tampering',
                  summary: 'Firmware binaries in off-chain NAS modified unnoticed, altering radar detection coefficients.',
                  desc: 'Firmware binaries and calibration tables in off-chain NAS are modified unnoticed, deploying corrupted parameters to radar arrays.',
                  solution: 'Client-side SHA-256 comparison aborts decrypt on a 1-bit shift.',
                },
                {
                  id: 'VULN-02',
                  unit: 'ELECTRONIC WARFARE',
                  title: 'Insider Bulk Exfiltration',
                  summary: 'Compromised accounts mass-download proprietary EW schematics and cipher keys prior to deployment.',
                  desc: 'Compromised accounts mass-download proprietary EW schematics, CAD layouts, and cipher keys prior to deployment.',
                  solution: 'Velocity telemetry tracks anomalous transfer bursts and locks sessions.',
                },
                {
                  id: 'VULN-03',
                  unit: 'TACTICAL RADIOS & SDR',
                  title: 'Stale Multi-Vendor Access',
                  summary: 'External trial engineers retain access clearances months after testing rotations conclude.',
                  desc: 'External trial engineers and allied contractors retain access clearances months after testing rotations conclude.',
                  solution: 'Time-limited smart contract grants expire automatically on exact block timestamp.',
                },
                {
                  id: 'VULN-04',
                  unit: 'MISSILE GUIDANCE AVIONICS',
                  title: 'Malleable Central Logs',
                  summary: 'Central server logs altered, backdated, or purged by privileged administrators, destroying accountability.',
                  desc: 'Central server logs can be altered, backdated, or purged by privileged administrators, destroying accountability.',
                  solution: 'Every grant and download is an immutable consortium transaction.',
                },
              ].map((card) => {
                const isExpanded = !!expandedThreats[card.id];
                return (
                  <div
                    key={card.id}
                    className="bg-[#f0f0f0] border border-black/[0.08] p-7 md:p-8 flex flex-col justify-between hover:border-black/[0.2] transition-colors duration-150 rounded-2xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[12px] uppercase tracking-[0.08em] font-[450] text-[#909090]">
                          {card.id} // {card.unit}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.08em] font-[500] text-[#0d0d0d] bg-[#ffffff] border border-black/[0.08] px-2.5 py-0.5 rounded-full">
                          BLOCKED
                        </span>
                      </div>

                      <h3 className="text-[22px] sm:text-[26px] font-[300] tracking-[-0.6px] leading-[1.2] text-[#0d0d0d] mb-2">
                        {card.title}
                      </h3>

                      <p className="text-[14px] text-[#4d4d4d] leading-[1.6]">
                        {card.summary}
                      </p>
                    </div>

                    {/* Expandable Forensic Details & Resolution */}
                    <div className="pt-4 mt-3 border-t border-black/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase text-[#909090]">
                          AegisChain Defensive Mechanism
                        </span>
                        <button
                          onClick={() => toggleThreat(card.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white border border-black/[0.08] text-stone-800 hover:text-black hover:border-black/20 transition-all shadow-xs"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'Threat Analysis & Resolution'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-2 space-y-3 animate-in fade-in duration-150">
                          <p className="text-[13px] text-[#4d4d4d] leading-[1.6] bg-white/60 p-3 rounded-xl border border-black/[0.04]">
                            <strong className="text-[#0d0d0d] block font-mono text-[11px] uppercase mb-1">Traditional IT Risk:</strong>
                            {card.desc}
                          </p>

                          <div className="bg-white p-3 rounded-xl border border-black/[0.06] space-y-1">
                            <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Cryptographic Resolution:</span>
                            </div>
                            <div className="text-[13px] font-[450] text-[#0d0d0d]">
                              {card.solution}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 7 — DUAL-LAYER ARCHITECTURE & ROLES                     */}
        {/* ============================================================== */}
        <section id="architecture" className="py-24 md:py-32 bg-[#f3f3f3] space-y-28 md:space-y-36">
          <div className="max-w-[1180px] mx-auto px-6 sm:px-8 space-y-28 md:space-y-36">
            {/* ROW 1: Dual-Layer Zero-Trust Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="text-[12px] md:text-[13px] uppercase tracking-[0.08em] font-[450] text-[#909090] block mb-3">
                  Dual-Layer Architecture
                </span>
                <h2 className="text-[35px] sm:text-[48px] md:text-[56px] font-[300] tracking-[-1.05px] md:tracking-[-1.92px] leading-[1.05] text-[#0d0d0d] mb-6">
                  The proof is on-chain. The data never is.
                </h2>
                <p className="text-[16px] text-[#4d4d4d] leading-[1.6] max-w-[480px] mb-8 font-[400]">
                  All defence payloads remain 100% off-chain in encrypted NAS storage (AES-256-GCM). The permissioned consortium ledger only stores cryptographic SHA-256 hashes, ownership credentials, and audit events.
                </p>
                <div className="flex items-center gap-4 text-[14px] font-mono text-[#909090]">
                  <span>SHA-256 HASH SEALS</span>
                  <span>·</span>
                  <span>ZERO EXPOSURE</span>
                </div>
              </div>

              {/* Technical Visual 1: Data Flow Architecture */}
              <div className="bg-[#f0f0f0] border border-black/[0.08] p-6 sm:p-8 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] text-[#909090]">
                  <span>CRYPTO DATA PIPELINE</span>
                  <span className="text-[#0d0d0d] font-[600]">ZERO-TRUST GATEWAY</span>
                </div>
                <div className="py-4 space-y-3">
                  <div className="p-3 bg-[#ffffff] border border-black/[0.06] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0d0d0d]">01. LOCAL BROWSER GATE</div>
                      <div className="text-[11px] text-[#909090] mt-0.5">Native Web Crypto API (SHA-256 computation)</div>
                    </div>
                    <span className="text-[10px] text-[#0d0d0d] font-bold bg-[#f0f0f0] px-2 py-0.5 rounded">CLIENT</span>
                  </div>

                  <div className="p-3 bg-[#ffffff] border border-black/[0.06] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0d0d0d]">02. PERMISSIONED CONSORTIUM LEDGER</div>
                      <div className="text-[11px] text-[#909090] mt-0.5">DID references, time-bound grants, state anchors</div>
                    </div>
                    <span className="text-[10px] text-[#0d0d0d] font-bold bg-[#f0f0f0] px-2 py-0.5 rounded">ON-CHAIN</span>
                  </div>

                  <div className="p-3 bg-[#ffffff] border border-black/[0.06] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0d0d0d]">03. CUSTODY NAS STORAGE</div>
                      <div className="text-[11px] text-[#909090] mt-0.5">AES-256-GCM encrypted radar firmware & schematics</div>
                    </div>
                    <span className="text-[10px] text-[#0d0d0d] font-bold bg-[#f0f0f0] px-2 py-0.5 rounded">OFF-CHAIN</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-black/[0.08] flex items-center justify-between text-[11px] text-[#909090]">
                  <span>1-BIT DIVERGENCE → DECRYPT ABORTED</span>
                  <span>ZERO SECRETS ON-CHAIN</span>
                </div>
              </div>
            </div>

            {/* ROW 2: Separation of Duties (Visual Left / Text Right) */}
            <div id="roles" className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Technical Visual 2: Interactive Role Authority Table */}
              <div className="order-2 md:order-1 bg-[#f0f0f0] border border-black/[0.08] p-6 sm:p-8 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
                  <span className="text-[#909090]">ROLE AUTHORITY MATRIX</span>
                  <div className="flex items-center gap-1">
                    {(['Admin', 'Manager', 'Auditor', 'Employee', 'Security Officer'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setActiveRole(r)}
                        className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                          activeRole === r
                            ? 'bg-[#0d0d0d] text-[#ffffff] font-bold'
                            : 'text-[#4d4d4d] hover:text-[#0d0d0d]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="py-3">
                  <div className="text-[11px] text-[#4d4d4d] mb-3 bg-[#ffffff] p-2.5 border border-black/[0.06]">
                    <span className="font-bold text-[#0d0d0d] uppercase">{activeRole} Boundary: </span>
                    {activeRole === 'Admin' && 'Manages user identities & DIDs; mathematically blocked from decrypting payload files.'}
                    {activeRole === 'Manager' && 'Approves time-bound access grants; cannot alter tamper-proof audit trails.'}
                    {activeRole === 'Auditor' && 'Inspects immutable access history; read-only verification of forensic logs.'}
                    {activeRole === 'Employee' && 'Uploads sealed defence assets and requests grants; cannot self-approve clearances.'}
                    {activeRole === 'Security Officer' && 'Triages anomalous velocity telemetry and engages immediate session lockdowns.'}
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    {[
                      { action: 'Issue user identities & DIDs', allowed: activeRole === 'Admin' },
                      { action: 'Upload & seal defence assets', allowed: ['Admin', 'Manager', 'Employee', 'Security Officer'].includes(activeRole) },
                      { action: 'Approve access requests', allowed: ['Manager'].includes(activeRole) },
                      { action: 'Download granted files', allowed: ['Employee', 'Manager', 'Security Officer'].includes(activeRole) },
                      { action: 'Inspect forensic audit history', allowed: ['Auditor', 'Security Officer'].includes(activeRole) },
                      { action: 'Read files without an explicit grant', allowed: false },
                    ].map((row, idx) => (
                      <div key={idx} className="p-2 bg-[#ffffff] border border-black/[0.06] flex items-center justify-between">
                        <span className="text-[#0d0d0d]">{row.action}</span>
                        {row.allowed ? (
                          <span className="text-[#0d0d0d] font-bold text-[10px] flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#0d0d0d]" /> ALLOWED
                          </span>
                        ) : (
                          <span className="text-[#909090] text-[10px] flex items-center gap-1">
                            <X className="w-3 h-3" /> DENIED
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-black/[0.08] flex items-center justify-between text-[11px] text-[#909090]">
                  <span>ROLE-BASED GOVERNANCE</span>
                  <span>LEAST PRIVILEGE</span>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <span className="text-[12px] md:text-[13px] uppercase tracking-[0.08em] font-[450] text-[#909090] block mb-3">
                  Separation of Duties
                </span>
                <h2 className="text-[35px] sm:text-[48px] md:text-[56px] font-[300] tracking-[-1.05px] md:tracking-[-1.92px] leading-[1.05] text-[#0d0d0d] mb-6">
                  No single actor holds all the keys.
                </h2>
                <p className="text-[16px] text-[#4d4d4d] leading-[1.6] max-w-[480px] mb-8 font-[400]">
                  Identity administrators, approving managers, and auditors are partitioned by smart contracts. Nobody can unilaterally decrypt files or alter audit logs.
                </p>
                <Link
                  to="/access-management"
                  className="inline-flex items-center text-[15px] font-[450] text-[#0d0d0d] hover:underline underline-offset-4"
                >
                  Inspect access control specification →
                </Link>
              </div>
            </div>

            {/* ROW 3: Live Verification Terminal */}
            <div id="verification" className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="text-[12px] md:text-[13px] uppercase tracking-[0.08em] font-[450] text-[#909090] block mb-3">
                  Live Integrity Gate
                </span>
                <h2 className="text-[35px] sm:text-[48px] md:text-[56px] font-[300] tracking-[-1.05px] md:tracking-[-1.92px] leading-[1.05] text-[#0d0d0d] mb-6">
                  Client-side cryptographic download gate.
                </h2>
                <p className="text-[16px] text-[#4d4d4d] leading-[1.6] max-w-[480px] mb-8 font-[400]">
                  On every download, the browser recomputes the SHA-256 hash using native Web Crypto. If a rogue admin or malware modified even 1 bit on storage, decryption is blocked immediately.
                </p>
                <div className="flex items-center gap-3">
                  <NeonButton
                    type="button"
                    onClick={handleTamper}
                    variant="primary"
                    pill={true}
                    neonColor="#f43f5e"
                    className="px-[20px] py-[8px] text-[14px]"
                  >
                    Simulate 1-Bit Tamper
                  </NeonButton>
                  <NeonButton
                    type="button"
                    onClick={handleRestore}
                    variant="outline"
                    pill={true}
                    neonColor="#00E5FF"
                    className="px-[20px] py-[8px] text-[14px]"
                  >
                    Restore File
                  </NeonButton>
                </div>
              </div>

              {/* Technical Visual 3: Real Web Crypto Terminal */}
              <div className="bg-[#f0f0f0] border border-black/[0.08] p-6 sm:p-8 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
                  <span className="text-[#909090]">RADAR SENSOR SPEC CHECK</span>
                  <span className="text-[#0d0d0d] font-[600]">NATIVE WEB CRYPTO</span>
                </div>

                <div className="py-3 space-y-3">
                  {/* File comparison box */}
                  <div className="p-3 bg-[#ffffff] border border-black/[0.06]">
                    <div className="flex items-center justify-between text-[10px] text-[#909090] mb-1">
                      <span>ON-CHAIN ANCHOR HASH</span>
                      <span>ORIGINAL</span>
                    </div>
                    <div className="text-[10px] break-all font-semibold text-[#0d0d0d]">
                      {onChainHash}
                    </div>
                  </div>

                  <div className="p-3 bg-[#ffffff] border border-black/[0.06]">
                    <div className="flex items-center justify-between text-[10px] text-[#909090] mb-1">
                      <span>DOWNLOAD BUFFER HASH</span>
                      <span>RECOMPUTED LOCALLY</span>
                    </div>
                    <div className="text-[10px] break-all font-semibold text-[#0d0d0d]">
                      {downloadHash}
                    </div>
                  </div>

                  {/* Verification result pill */}
                  <div className="p-3 bg-[#ffffff] border border-black/[0.08] flex items-center justify-between">
                    {verificationState === 'MATCH' && (
                      <div className="flex items-center gap-2 text-[#0d0d0d] font-bold">
                        <CheckCircle2 className="w-4 h-4 text-[#0d0d0d]" />
                        <span>HASH MATCH · DECRYPT ALLOWED</span>
                      </div>
                    )}
                    {verificationState === 'MISMATCH' && (
                      <div className="flex items-center gap-2 text-[#0d0d0d] font-bold">
                        <XCircle className="w-4 h-4 text-[#0d0d0d]" />
                        <span>TAMPER DETECTED · DECRYPT BLOCKED</span>
                      </div>
                    )}
                    {verificationState === 'REVOKED' && (
                      <div className="flex items-center gap-2 text-[#0d0d0d] font-bold">
                        <XCircle className="w-4 h-4 text-[#0d0d0d]" />
                        <span>ACCESS EXPIRED · CLEARANCE REVOKED</span>
                      </div>
                    )}
                    <span className="text-[10px] px-2 py-0.5 bg-[#f0f0f0] border border-black/[0.08] rounded font-bold">
                      {verificationState}
                    </span>
                  </div>

                  {/* Micro audit log */}
                  <div className="pt-2 border-t border-black/[0.06] space-y-1 text-[10px]">
                    {miniAudit.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[#4d4d4d]">
                        <span>[{item.action}] {item.note}</span>
                        <span className="text-[#909090]">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 8 — FINAL CTA (On slightly darker tinted surface)      */}
        {/* ============================================================== */}
        <section id="contact" className="py-20 md:py-28 bg-[#f3f3f3]">
          <div className="max-w-[1180px] mx-auto px-6 sm:px-8">
            <div className="bg-[#ebebeb] border border-black/[0.08] p-12 sm:p-16 lg:p-20 text-center flex flex-col items-center">
              <span className="text-[12px] md:text-[13px] uppercase tracking-[0.08em] font-[450] text-[#909090] block mb-4">
                Sovereign Defence Infrastructure
              </span>

              {/* H2 restating promise */}
              <h2 className="text-[35px] sm:text-[48px] md:text-[64px] font-[300] tracking-[-1.05px] md:tracking-[-1.92px] leading-[1.0] text-[#0d0d0d] max-w-[780px] mb-6">
                Seal it. Prove it. Audit it.
              </h2>

              <p className="text-[16px] sm:text-[18px] text-[#4d4d4d] max-w-[560px] leading-[1.6] mb-8 font-[400]">
                Deploy zero-trust identity custody, real-time integrity verification, and immutable governance across critical defence engineering commands.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                <NeonButton
                  as="link"
                  to="/dashboard"
                  variant="primary"
                  pill={true}
                  neonColor="#00E5FF"
                  className="px-[26px] py-[10px] text-[16px]"
                >
                  Enter Defence Vault
                </NeonButton>

                <NeonButton
                  as="a"
                  href="#architecture"
                  variant="outline"
                  pill={true}
                  neonColor="#00E5FF"
                  className="px-[26px] py-[10px] text-[16px]"
                >
                  Review Architecture
                </NeonButton>
              </div>

              {/* Reassurance Line */}
              <p className="text-[13px] text-[#909090] font-[400]">
                Zero Data On-Chain · Client-Side Web Crypto · Permissioned Consortium Ledger
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* SECTION 9 — FOOTER WITH ORIGINKIT "CLOUD SKY" ANIMATION        */}
      {/* ============================================================== */}
      <footer className="relative w-full overflow-hidden border-t border-black/[0.08] py-16 sm:py-20 text-[#0d0d0d]">
        {/* Animated Framer Cloud Sky WebGL Canvas (Strictly steady flow, no hover effect) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <CloudSky
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              minWidth: 0,
              minHeight: 0,
              pointerEvents: 'none',
            }}
            background="#0075FF"
            baseColor="#B4D2F0"
            accentColor="#FFFFFF"
            density={80}
            speed={42}
            size={120}
            clouds={{ softness: 110, shadow: 70, cirrus: 35 }}
            sun={{ x: 76, y: 90, glow: 'rgba(235, 245, 255, 0.9)' }}
            pointer={{ parallax: 0, wind: 0, damping: 0 }}
          />
        </div>

        {/* Soft atmospheric overlay for smooth contrast while keeping clouds vibrant */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#f3f3f3]/50 via-[#f3f3f3]/30 to-black/15 pointer-events-none" />

        {/* Streamlined, Minimal Footer Content Container (Unwanted content reduced) */}
        <div className="relative z-10 max-w-[1140px] mx-auto px-6 sm:px-8">
          <div className="bg-[#f3f3f3]/85 backdrop-blur-md rounded-[28px] border border-white/80 p-8 sm:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-10">
            {/* Top Row: Wordmark & Focused Navigation Columns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
              {/* Wordmark Column (5 cols) */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center gap-2 text-[#0d0d0d]">
                  <span className="font-extrabold tracking-[-0.8px] text-[20px] uppercase font-sans">
                    aegis<span className="text-[#0d0d0d]/70 font-normal">chain</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-[0.08em] px-2 py-0.5 rounded-full bg-black/[0.06] text-[#0d0d0d] font-semibold">
                    BEL DEFENCE
                  </span>
                </div>
                <p className="text-[14px] text-[#4d4d4d] max-w-[340px] leading-[1.6]">
                  Sovereign defence asset custody, Web Crypto SHA-256 verification, and immutable access governance engineered for Bharat Electronics Limited (BEL).
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/[0.04] border border-black/[0.08] text-[10px] font-mono text-[#0d0d0d] uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    CONSORTIUM ACTIVE
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-black/[0.04] border border-black/[0.08] text-[10px] font-mono text-[#4d4d4d] uppercase">
                    ZERO DATA ON-CHAIN
                  </span>
                </div>
              </div>

              {/* Column 1: Core Platform */}
              <div className="md:col-span-2 space-y-2.5">
                <h4 className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#0d0d0d] font-bold">
                  Platform
                </h4>
                <ul className="space-y-2 text-[13px] text-[#4d4d4d]">
                  <li><Link to="/dashboard" className="hover:text-[#0d0d0d] transition-colors">Command Centre</Link></li>
                  <li><Link to="/assets" className="hover:text-[#0d0d0d] transition-colors">Defence Vault</Link></li>
                  <li><Link to="/upload" className="hover:text-[#0d0d0d] transition-colors">Seal Asset</Link></li>
                  <li><Link to="/audit-logs" className="hover:text-[#0d0d0d] transition-colors">Audit Ledger</Link></li>
                </ul>
              </div>

              {/* Column 2: Identity & Security */}
              <div className="md:col-span-2 space-y-2.5">
                <h4 className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#0d0d0d] font-bold">
                  Security
                </h4>
                <ul className="space-y-2 text-[13px] text-[#4d4d4d]">
                  <li><Link to="/passkeys" className="hover:text-[#0d0d0d] transition-colors">FIDO2 Passkeys</Link></li>
                  <li><Link to="/mfa" className="hover:text-[#0d0d0d] transition-colors">TOTP MFA</Link></li>
                  <li><a href="#roles" className="hover:text-[#0d0d0d] transition-colors">Separation of Duties</a></li>
                  <li><Link to="/security-alerts" className="hover:text-[#0d0d0d] transition-colors">Security Telemetry</Link></li>
                </ul>
              </div>

              {/* Column 3: BEL Asset Divisions */}
              <div className="md:col-span-3 space-y-2.5">
                <h4 className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#0d0d0d] font-bold">
                  BEL Divisions
                </h4>
                <ul className="space-y-2 text-[13px] text-[#4d4d4d]">
                  <li><a href="#vulnerabilities" className="hover:text-[#0d0d0d] transition-colors">X-Band AESA Radars</a></li>
                  <li><a href="#vulnerabilities" className="hover:text-[#0d0d0d] transition-colors">Electronic Warfare (EW)</a></li>
                  <li><a href="#vulnerabilities" className="hover:text-[#0d0d0d] transition-colors">Tactical Radios & SDR</a></li>
                  <li><a href="#vulnerabilities" className="hover:text-[#0d0d0d] transition-colors">Coastal Surveillance</a></li>
                </ul>
              </div>
            </div>

            {/* Clean, Minimal Bottom Legal Bar */}
            <div className="pt-6 border-t border-black/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-[#909090]">
              <div>
                © Bharat Electronics Limited (BEL). Sovereign Defence Infrastructure.
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px] text-[#4d4d4d]">
                <span>OFF-CHAIN AES-256-GCM</span>
                <span>·</span>
                <span>AEGISCHAIN v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
