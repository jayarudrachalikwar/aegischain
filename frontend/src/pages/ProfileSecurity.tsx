import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCog, Fingerprint, QrCode, Shield, Key, AlertTriangle, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, ClassificationBadge } from '../components/common/Badge';
import { HashDisplay } from '../components/common/HashDisplay';
import { formatTimestamp } from '../utils/formatters';

export const ProfileSecurity: React.FC = () => {
  const { currentUser, role, logout } = useAuth();
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  const handleRevokeAllSessions = () => {
    if (window.confirm('Emergency Action: Terminate all active cryptographic sessions and invalidate cached auth tokens?')) {
      setRevokedMessage('All active sessions invalidated. Re-authentication with hardware passkey required.');
      setTimeout(() => {
        logout();
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b-2 border-secure-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
              OPERATOR PROFILE //
            </span>
            <Badge variant="navy">ZERO-TRUST CONTEXT</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Identity & Cryptographic Security
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Decentralized identity parameters, assigned clearances, and hardware authenticators
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
          onClick={handleRevokeAllSessions}
        >
          Emergency Session Kill
        </Button>
      </div>

      {revokedMessage && (
        <div className="p-3 bg-red-50 border-l-4 border-signal-red text-signal-red font-mono text-xs">
          {revokedMessage}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Operator Identity Profile */}
        <div className="md:col-span-7 space-y-4">
          <Card title="01. DECENTRALIZED IDENTITY (DID)" badge={<Badge variant="green">ACTIVE</Badge>} theme="white">
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-2xl text-bel-navy font-bold uppercase tracking-tight">
                    {currentUser?.displayName}
                  </h3>
                  <p className="text-stone-500 mt-0.5">{currentUser?.email}</p>
                </div>
                <ClassificationBadge classification={currentUser?.clearanceLevel || 'SECRET'} />
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 space-y-2 mt-2">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">CANONICAL DID STRING:</span>
                  <code className="text-xs font-bold text-bel-navy select-all block break-all">
                    {currentUser?.did}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200 text-[11px]">
                  <div>
                    <span className="text-stone-500 uppercase block text-[10px]">ROLE:</span>
                    <span className="font-bold text-stone-800">{currentUser?.role}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase block text-[10px]">DEPARTMENT:</span>
                    <span className="font-semibold text-stone-700">{currentUser?.department}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 uppercase block mb-1">
                  ATTESTATION PUBLIC KEY FINGERPRINT (SECP256K1):
                </span>
                <HashDisplay hash="9f3ac1d200482b45e89a62bc34107e3f89012345bc89fa0124de56789abcdef0" full className="w-full justify-between" />
              </div>

              <div className="pt-2 text-[11px] text-stone-500">
                <span>Identity Enrolled: {currentUser?.createdAt ? formatTimestamp(currentUser.createdAt) : '2026-01-15 UTC'}</span>
              </div>
            </div>
          </Card>

          {/* Active Session Telemetry */}
          <Card title="02. ACTIVE ZERO-TRUST SESSION TELEMETRY" badge={<Badge variant="navy">IP-BOUND</Badge>} theme="white">
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-800 block">Current Workstation (BEL-WS-492)</span>
                  <span className="text-[10px] text-stone-500">Node: 10.14.92.108 · Mutual TLS 1.3 · TPM 2.0 Attested</span>
                </div>
                <span className="stamp-verified text-[10px]">VERIFIED</span>
              </div>

              <div className="p-2.5 bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-800 block">Smart Contract Session Ticket</span>
                  <span className="text-[10px] text-stone-500">Nonce: #8921 · Auto-expires in 7 hours 45 mins</span>
                </div>
                <span className="text-verification-green font-bold text-[11px]">ACTIVE</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Hardware Authenticator Shortcuts */}
        <div className="md:col-span-5 space-y-4">
          {/* Passkey Card */}
          <Card
            title="AUTHENTICATORS"
            badge={<Badge variant="default">FIDO2</Badge>}
            theme="parchment"
            headerAction={
              <Link to="/passkeys" className="font-mono text-xs text-bel-navy hover:text-signal-red font-bold uppercase inline-flex items-center gap-1">
                <span>Configure</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bel-navy text-parchment-light border border-secure-black">
                  <Fingerprint className="w-6 h-6 text-signal-red" />
                </div>
                <div>
                  <span className="font-bold uppercase text-stone-800 block">Registered Passkeys</span>
                  <span className="text-stone-600 text-[11px]">{currentUser?.passkeysCount || 2} Active Hardware Tokens</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-700 leading-relaxed">
                Hardware security keys store your private assertion credentials in tamper-resistant physical enclaves.
              </p>

              <Link to="/passkeys" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Passkeys
                </Button>
              </Link>
            </div>
          </Card>

          {/* MFA Card */}
          <Card
            title="TWO-FACTOR AUTH (TOTP)"
            badge={<Badge variant="green">ACTIVE</Badge>}
            theme="white"
            headerAction={
              <Link to="/mfa" className="font-mono text-xs text-bel-navy hover:text-signal-red font-bold uppercase inline-flex items-center gap-1">
                <span>Setup</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-bel-navy text-parchment-light border border-secure-black">
                  <QrCode className="w-6 h-6 text-verification-green" />
                </div>
                <div>
                  <span className="font-bold uppercase text-stone-800 block">RFC 6238 TOTP</span>
                  <span className="text-verification-green font-bold text-[11px]">ENFORCED ON LOGIN</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-600 leading-relaxed">
                Dynamic 30-second time-based one-time password required on every credential verification step.
              </p>

              <Link to="/mfa" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  View Recovery Codes
                </Button>
              </Link>
            </div>
          </Card>

          {/* Logout Action */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={logout}
            >
              Sign Out of Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
