import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  Check,
  AlertCircle,
  AlertTriangle,
  Key,
  KeyRound,
  Laptop,
  HardDrive,
  Copy,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle2,
  Cpu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { PasskeyRecord } from '../api/types';
import { Button } from '../components/common/Button';
import { NeonButton } from '../components/common/NeonButton';
import { Input, Select } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { formatTimestamp } from '../utils/formatters';

export const PasskeySetup: React.FC = () => {
  const { currentUser } = useAuth();
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [selectedPasskey, setSelectedPasskey] = useState<PasskeyRecord | null>(null);
  const [passkeyToRevoke, setPasskeyToRevoke] = useState<PasskeyRecord | null>(null);

  // Form states
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDeviceType, setNewKeyDeviceType] = useState('YubiKey 5C FIPS (Hardware Token)');
  const [renameValue, setRenameValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Output & Feedback states
  const [recentEnrolledPasskey, setRecentEnrolledPasskey] = useState<PasskeyRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.auth.getPasskeys();
      setPasskeys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsSubmitting(true);
    try {
      // Haptic WebAuthn challenge handshake simulation
      await new Promise(r => setTimeout(r, 650));

      const created = await apiClient.auth.registerPasskey(newKeyName.trim(), newKeyDeviceType);
      setPasskeys(prev => [...prev, created]);

      // Set prominent high-visibility success output card
      setRecentEnrolledPasskey(created);
      setStatusMessage(null);
      setIsRegisterModalOpen(false);
      setNewKeyName('');
    } catch (err: any) {
      console.error('Passkey enrollment failed', err);
      setStatusMessage(err?.message || 'Failed to enroll authenticator. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPasskey || !renameValue.trim()) return;

    const trimmed = renameValue.trim();
    setPasskeys(prev =>
      prev.map(p => (p.id === selectedPasskey.id ? { ...p, friendlyName: trimmed } : p))
    );
    setStatusMessage(`Passkey renamed to "${trimmed}".`);
    setIsRenameModalOpen(false);
    setSelectedPasskey(null);
  };

  const handleOpenRevoke = (pk: PasskeyRecord) => {
    setPasskeyToRevoke(pk);
    setIsRevokeModalOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!passkeyToRevoke) return;

    setIsRevoking(true);
    try {
      await apiClient.auth.removePasskey(passkeyToRevoke.id);
      setPasskeys(prev => prev.filter(p => p.id !== passkeyToRevoke.id));
      if (recentEnrolledPasskey?.id === passkeyToRevoke.id) {
        setRecentEnrolledPasskey(null);
      }
      setStatusMessage(`Hardware passkey "${passkeyToRevoke.friendlyName}" revoked successfully from on-chain identity.`);
      setIsRevokeModalOpen(false);
      setPasskeyToRevoke(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* ============================================================== */}
      {/* 1. TOP HEADER BANNER (Consistent Modern Clean UI)              */}
      {/* ============================================================== */}
      <div className="bg-white border border-black/[0.08] rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        {/* Eyebrow Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              FIDO2 / WEBAUTHN CREDENTIALS
            </span>
            <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              L2+ HARDWARE BOUND
            </span>
          </div>

          <div className="font-mono text-[11px] text-stone-500">
            Identity DID: <strong className="text-stone-900">{currentUser?.did || 'did:aegis:bel:eng:rvignesh'}</strong>
          </div>
        </div>

        {/* Title and Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-950 font-sans">
              Passkey & Hardware Security Keys
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-sans">
              Manage cryptographic authenticators tied to your sovereign defence identity. Physical chip assertion is required for payload decryption.
            </p>
          </div>

          {/* New Passkey Button with Clean Signature Neon Border */}
          <NeonButton
            variant="primary"
            pill={true}
            neonColor="#00E5FF"
            leftIcon={<Plus className="w-4 h-4 text-[#00E5FF]" />}
            onClick={() => {
              setNewKeyName('');
              setIsRegisterModalOpen(true);
            }}
            className="px-6 py-2.5 text-xs font-bold flex-shrink-0"
          >
            Register New Passkey
          </NeonButton>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. RECENT ENROLLMENT OUTPUT CARD (Clearly Visible Result)      */}
      {/* ============================================================== */}
      {recentEnrolledPasskey && (
        <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-6 shadow-[0_4px_25px_rgba(16,185,129,0.12)] space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-950">
                  New FIDO2 Passkey Enrolled & Activated!
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  Cryptographic attestation registered and ready for step-up multi-factor authorization.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold uppercase">
                ACTIVE IN SESSION
              </span>
              <button
                onClick={() => setRecentEnrolledPasskey(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Credential Output Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-stone-50 border border-black/[0.06] rounded-xl space-y-1">
              <span className="text-[10px] uppercase text-stone-500 font-semibold block">Friendly Name</span>
              <span className="font-bold text-stone-900 truncate block">{recentEnrolledPasskey.friendlyName}</span>
            </div>

            <div className="p-3 bg-stone-50 border border-black/[0.06] rounded-xl space-y-1">
              <span className="text-[10px] uppercase text-stone-500 font-semibold block">Authenticator Type</span>
              <span className="font-bold text-stone-900 truncate block">{recentEnrolledPasskey.deviceType}</span>
            </div>

            <div className="p-3 bg-stone-50 border border-black/[0.06] rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-stone-500 font-semibold block">Credential ID</span>
                <button
                  onClick={() => handleCopy(recentEnrolledPasskey.credentialId)}
                  className="text-[9px] uppercase font-bold text-stone-700 hover:text-black"
                >
                  {copiedId === recentEnrolledPasskey.credentialId ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <span className="font-bold text-emerald-700 truncate block">{recentEnrolledPasskey.credentialId}</span>
            </div>

            <div className="p-3 bg-stone-50 border border-black/[0.06] rounded-xl space-y-1">
              <span className="text-[10px] uppercase text-stone-500 font-semibold block">Security Level</span>
              <span className="font-bold text-stone-900 truncate block">FIDO2 L2+ (ECDSA P-256)</span>
            </div>
          </div>
        </div>
      )}

      {/* Standard Feedback Alert */}
      {statusMessage && !recentEnrolledPasskey && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-stone-900 rounded-2xl text-xs font-mono flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-sans font-medium">{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. REGISTERED PASSKEYS LIST                                    */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-stone-700" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-black">
              Active Hardware Authenticators ({passkeys.length})
            </h2>
          </div>
          <span className="font-mono text-[11px] text-stone-500">
            Backed by physical tamper-resistant microcontrollers
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white border border-black/[0.08] rounded-2xl p-12 text-center font-mono text-xs text-stone-500 shadow-xs">
            QUERYING HARDWARE CREDENTIAL REPOSITORY...
          </div>
        ) : passkeys.length === 0 ? (
          <div className="bg-white border border-black/[0.08] rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-stone-100 border border-black/[0.08] text-stone-400 flex items-center justify-center mx-auto">
              <Fingerprint className="w-6 h-6" />
            </div>
            <h3 className="font-sans text-base font-bold text-stone-900">
              No Passkeys Registered Yet
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto font-sans leading-relaxed">
              Zero-trust defence security mandates at least one registered hardware security token (YubiKey / Nitrokey) or device enclave passkey to decrypt sensitive assets.
            </p>
            <NeonButton
              variant="primary"
              pill={true}
              neonColor="#00E5FF"
              leftIcon={<Plus className="w-4 h-4 text-[#00E5FF]" />}
              onClick={() => {
                setNewKeyName('');
                setIsRegisterModalOpen(true);
              }}
              className="px-6 py-2 text-xs font-bold mt-2"
            >
              Register First Passkey
            </NeonButton>
          </div>
        ) : (
          passkeys.map((pk) => {
            const isHardware = pk.deviceType.toLowerCase().includes('hardware') || pk.deviceType.toLowerCase().includes('yubikey') || pk.deviceType.toLowerCase().includes('nitrokey');
            const isJustEnrolled = recentEnrolledPasskey?.id === pk.id;

            return (
              <div
                key={pk.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isJustEnrolled
                    ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                    : 'border-black/[0.08] hover:border-black/20'
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  {/* Authenticator Icon in Pill Box */}
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isHardware
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-purple-50 border-purple-200 text-purple-700'
                  }`}>
                    {isHardware ? <KeyRound className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                  </div>

                  {/* Passkey Identity Details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-950 font-sans truncate">
                        {pk.friendlyName}
                      </h3>
                      <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full font-bold uppercase">
                        ACTIVE · FIDO2 L2+
                      </span>
                      {isJustEnrolled && (
                        <span className="font-mono text-[10px] text-cyan-800 bg-cyan-50 border border-cyan-300 px-2 py-0.2 rounded-full font-bold uppercase animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 font-sans">
                      {pk.deviceType}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] font-mono text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <span>Cred ID:</span>
                        <code className="text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded border border-black/[0.06] text-[10px]">
                          {pk.credentialId}
                        </code>
                        <button
                          onClick={() => handleCopy(pk.credentialId)}
                          className="text-stone-500 hover:text-black"
                          title="Copy credential ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <span>•</span>
                      <span>Enrolled: {formatTimestamp(pk.createdAt).split(' ')[0]}</span>
                      <span>•</span>
                      <span>Last Used: {pk.lastUsedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.04] w-full md:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setSelectedPasskey(pk);
                      setRenameValue(pk.friendlyName);
                      setIsRenameModalOpen(true);
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenRevoke(pk)}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. SECURITY COMPLIANCE NOTE                                    */}
      {/* ============================================================== */}
      <div className="bg-[#0d0d0d] text-white rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00E5FF]" />
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Bharat Electronics Zero-Trust Authentication Policy
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#00E5FF] bg-white/10 px-2 py-0.5 rounded uppercase">
            POLICY MANDATE
          </span>
        </div>

        <ul className="text-xs text-white/70 space-y-1.5 font-sans leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#00E5FF] font-bold">•</span>
            <span>Only authenticators certified to <strong>FIDO2 Level 2+</strong> or workstation <strong>TPM 2.0 microcontrollers</strong> are cryptographically authorized to sign asset decryption requests.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00E5FF] font-bold">•</span>
            <span>Private keys never leave the physical token hardware. Decryption challenges are computed entirely on-chip using <strong>ECDSA secp256r1 (P-256)</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00E5FF] font-bold">•</span>
            <span>If a physical hardware token is lost, misplaced, or suspected of compromise, revoke the credential immediately to invalidate all on-chain assertions.</span>
          </li>
        </ul>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: REGISTER PASSKEY (Modern Clean UI)                    */}
      {/* ============================================================== */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsRegisterModalOpen(false);
        }}
        title="Enroll FIDO2 Hardware Passkey"
        subtitle="WebAuthn Device Assertion & Public Key Registration"
        icon={<KeyRound className="w-4 h-4 text-[#00E5FF]" />}
        maxWidth="md"
      >
        <form onSubmit={handleRegisterPasskey} className="space-y-5">
          {/* Friendly Name Input */}
          <Input
            label="Passkey Friendly Name"
            placeholder="e.g. YubiKey 5C NFC (Primary Token)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            helperText="A recognizable label for your physical hardware token or workstation enclave"
            required
            autoFocus
          />

          {/* Device Type Select */}
          <Select
            label="Authenticator Hardware Type"
            value={newKeyDeviceType}
            onChange={(e) => setNewKeyDeviceType(e.target.value)}
            helperText="Specifies the hardware security boundary for cryptographic assertions"
          >
            <option value="YubiKey 5C FIPS (Hardware Token)">YubiKey 5C FIPS (Hardware Security Key)</option>
            <option value="Nitrokey 3 Pro (Open Hardware)">Nitrokey 3 Pro (Open-Source Hardware)</option>
            <option value="Defence Workstation TPM 2.0 (Platform)">Defence Workstation TPM 2.0 (Platform Enclave)</option>
            <option value="Windows Hello Enterprise Credential">Windows Hello Enterprise (Biometric Passkey)</option>
            <option value="Apple Secure Enclave (Touch ID / Face ID)">Apple Secure Enclave (Touch ID / Face ID)</option>
          </Select>

          {/* Cryptographic Attestation Technical Preview */}
          <div className="p-4 bg-stone-50 border border-black/[0.08] rounded-xl space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-stone-500 pb-1.5 border-b border-black/[0.06] text-[10px]">
              <span className="font-bold text-stone-800 uppercase flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>WebAuthn Credential Assertion:</span>
              </span>
              <span className="text-emerald-700 font-bold">FIDO2 L2+ CERTIFIED</span>
            </div>

            <div className="space-y-1 text-[11px] text-stone-600">
              <div className="flex justify-between">
                <span>Algorithm:</span>
                <strong className="text-stone-900">ES256 (ECDSA P-256 + SHA-256)</strong>
              </div>
              <div className="flex justify-between">
                <span>Identity DID:</span>
                <strong className="text-stone-900 truncate max-w-[220px]">{currentUser?.did || 'did:aegis:bel:eng:rvignesh'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Key Storage:</span>
                <strong className="text-emerald-700">Hardware Isolated (No Plaintext Export)</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/[0.06]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegisterModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <NeonButton
              type="submit"
              variant="primary"
              pill={true}
              neonColor="#00E5FF"
              disabled={isSubmitting || !newKeyName.trim()}
              className="px-6 py-2.5 text-xs font-bold"
            >
              {isSubmitting ? 'Enrolling Authenticator...' : 'Enroll Authenticator'}
            </NeonButton>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: RENAME PASSKEY                                        */}
      {/* ============================================================== */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename Passkey"
        subtitle="Update Friendly Label"
        icon={<Edit3 className="w-4 h-4 text-stone-700" />}
        maxWidth="sm"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <Input
            label="Friendly Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/[0.06]">
            <Button type="button" variant="outline" onClick={() => setIsRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: REVOKE PASSKEY CONFIRMATION                           */}
      {/* ============================================================== */}
      <Modal
        isOpen={isRevokeModalOpen}
        onClose={() => {
          if (!isRevoking) setIsRevokeModalOpen(false);
        }}
        title="Revoke Hardware Passkey"
        subtitle="Permanent Cryptographic Deauthorization"
        icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
            <p className="font-bold text-rose-900 font-sans">
              Are you sure you want to permanently revoke this passkey?
            </p>
            <p className="text-rose-700 font-sans leading-relaxed">
              Passkey: <strong className="text-rose-950 font-mono">{passkeyToRevoke?.friendlyName}</strong> ({passkeyToRevoke?.deviceType})
            </p>
            <p className="text-rose-600 text-[11px] font-sans">
              Once revoked, this hardware token can no longer assert identity or sign decryption challenges for sensitive defence files. This action cannot be reversed.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/[0.06]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRevokeModalOpen(false)}
              disabled={isRevoking}
            >
              Keep Passkey
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmRevoke}
              isLoading={isRevoking}
            >
              {isRevoking ? 'Revoking Key...' : 'Revoke Key Immediately'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
