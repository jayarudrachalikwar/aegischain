import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-bel-navy text-parchment border-t-2 border-bel-navy font-mono text-xs selection:bg-muted-blue selection:text-bel-navy">
      {/* Top Accent Line in Radar Cyan */}
      <div className="w-full h-1 bg-muted-blue" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Organization & Identity (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-muted-blue text-bel-navy flex items-center justify-center border border-muted-blue shadow-ink-sm">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-widest uppercase text-parchment">
                AEGIS<span className="text-muted-blue">CHAIN</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-bel-navy-dark border border-muted-blue/40 text-muted-blue font-bold uppercase">
                AEGISCHAIN
              </span>
            </div>

            <p className="text-parchment/80 text-xs sm:text-[13px] leading-relaxed max-w-md">
              Zero-trust identity custody, real-time cryptographic integrity verification, and immutable access governance designed for engineering teams that protect confidential documents.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-blue">
              <span className="border border-muted-blue/30 px-2 py-0.5 bg-bel-navy-dark uppercase">
                CONFIDENTIAL // IP PROTOCOL
              </span>
              <span className="border border-muted-blue/30 px-2 py-0.5 bg-bel-navy-dark uppercase">
                ZERO DATA EXPOSURE
              </span>
            </div>
          </div>

          {/* Column 2: System Navigation (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-blue border-b border-muted-blue/30 pb-1.5">
              SYSTEM DIRECTORY
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#bel-problem"
                  className="text-parchment/80 hover:text-muted-blue transition-colors flex items-center gap-1.5"
                >
                  <span className="text-muted-blue text-[10px]">01</span>
                  <span>Threat Vectors</span>
                </a>
              </li>
              <li>
                <a
                  href="#solution"
                  className="text-parchment/80 hover:text-muted-blue transition-colors flex items-center gap-1.5"
                >
                  <span className="text-muted-blue text-[10px]">02</span>
                  <span>Zero-Trust Architecture</span>
                </a>
              </li>
              <li>
                <a
                  href="#roles"
                  className="text-parchment/80 hover:text-muted-blue transition-colors flex items-center gap-1.5"
                >
                  <span className="text-muted-blue text-[10px]">03</span>
                  <span>Separation of Duties</span>
                </a>
              </li>
              <li>
                <a
                  href="#demo"
                  className="text-parchment/80 hover:text-muted-blue transition-colors flex items-center gap-1.5"
                >
                  <span className="text-muted-blue text-[10px]">04</span>
                  <span>Integrity Verification</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Operational Status & Access (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-blue border-b border-muted-blue/30 pb-1.5">
              OPERATIONAL STATUS
            </h4>

            <div className="p-3 bg-bel-navy-dark border border-muted-blue/40 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-blue animate-pulse" />
                <span className="font-bold text-parchment text-[11px] uppercase">
                  SECURITY PROTOCOL ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-parchment/70 leading-normal">
                Off-chain encrypted custody with on-chain cryptographic anchor verification.
              </p>
            </div>

            <div className="pt-1">
              <Link
                to="/dashboard"
                className="w-full inline-flex items-center justify-between px-3 py-2 bg-muted-blue text-bel-navy font-bold text-xs uppercase border border-bel-navy hover:bg-muted-blue-light transition-colors shadow-ink-sm"
              >
                <span>Enter Secure Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal / Demarcation Bar */}
        <div className="mt-10 pt-4 border-t border-muted-blue/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-parchment/60">
          <div>
            © AegisChain · Prototype interface running on simulated data.
          </div>
          <div className="flex items-center gap-1.5 text-muted-blue">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cryptographic Verification & Zero-Trust Governance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
