import React, { useState, useEffect } from 'react';
import { Fingerprint, Plus, Trash2, Edit3, ShieldCheck, Check, AlertCircle, Key, Laptop, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { PasskeyRecord } from '../api/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { formatTimestamp } from '../utils/formatters';

export const PasskeySetup: React.FC = () => {
  const { currentUser } = useAuth();
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [selectedPasskey, setSelectedPasskey] = useState<PasskeyRecord | null>(null);

  // Form states
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDeviceType, setNewKeyDeviceType] = useState('YubiKey 5C FIPS (Hardware Token)');
  const [renameValue, setRenameValue] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    setIsSubmitting(true);
    try {
      const created = await apiClient.auth.registerPasskey(newKeyName, newKeyDeviceType);
      setPasskeys(prev => [...prev, created]);
      setStatusMessage(`Passkey "${newKeyName}" registered with FIDO2 Level 2 attestation.`);
      setIsRegisterModalOpen(false);
      setNewKeyName('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPasskey || !renameValue) return;

    setPasskeys(prev =>
      prev.map(p => (p.id === selectedPasskey.id ? { ...p, friendlyName: renameValue } : p))
    );
    setStatusMessage(`Passkey renamed to "${renameValue}".`);
    setIsRenameModalOpen(false);
    setSelectedPasskey(null);
  };

  const handleRemove = async (id: string, name: string) => {
    if (window.confirm(`Revoke and remove hardware passkey "${name}"? This action cannot be undone.`)) {
      await apiClient.auth.removePasskey(id);
      setPasskeys(prev => prev.filter(p => p.id !== id));
      setStatusMessage(`Passkey "${name}" revoked from identity record.`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-secure-black">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
              IDENTITY CREDENTIALS //
            </span>
            <Badge variant="navy">FIDO2 / WEBAUTHN</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Passkey & Hardware Security Keys
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Manage cryptographic authenticators tied to <span className="font-bold text-bel-navy">{currentUser?.did}</span>
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsRegisterModalOpen(true)}
        >
          Register New Passkey
        </Button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border-l-4 border-verification-green text-stone-900 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-verification-green" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-stone-400 hover:text-stone-800 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main Passkey Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center font-mono text-xs text-stone-500">
            LOADING HARDWARE CREDENTIALS...
          </div>
        ) : passkeys.length === 0 ? (
          <Card theme="white">
            <div className="text-center py-8">
              <Fingerprint className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <p className="font-mono text-sm font-bold text-stone-700 uppercase">No Passkeys Registered</p>
              <p className="font-mono text-xs text-stone-500 mt-1">
                Zero-trust authentication requires at least one registered hardware key or platform passkey.
              </p>
            </div>
          </Card>
        ) : (
          passkeys.map(pk => (
            <Card key={pk.id} theme="white" className="hover:border-bel-navy transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-bel-navy text-parchment-light border border-secure-black mt-1">
                    <Key className="w-5 h-5 text-signal-red" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-sm font-bold uppercase text-bel-navy">
                        {pk.friendlyName}
                      </h3>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-verification-green/20 text-stone-900 border border-verification-green font-semibold">
                        ACTIVE
                      </span>
                    </div>

                    <p className="font-mono text-xs text-stone-600 mt-0.5">
                      {pk.deviceType}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] font-mono text-stone-500">
                      <span>Cred ID: <code className="text-stone-800 font-semibold">{pk.credentialId}</code></span>
                      <span>•</span>
                      <span>Enrolled: {formatTimestamp(pk.createdAt).split(' ')[0]}</span>
                      <span>•</span>
                      <span>Last Used: {pk.lastUsedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10">
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
                    onClick={() => handleRemove(pk.id, pk.friendlyName)}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Security Guidance Note */}
      <Card theme="navy">
        <div className="font-mono text-xs text-stone-200 space-y-1">
          <p className="font-bold text-warm-white uppercase">BEL ZERO-TRUST AUTHENTICATION POLICY:</p>
          <p>• Only FIDO2 L2+ certified authenticators or defence workstation TPM 2.0 chips are approved for asset decryption.</p>
          <p>• In the event of device compromise or loss, revoke the credential immediately to prevent unauthorized on-chain transactions.</p>
        </div>
      </Card>

      {/* Modal: Register Passkey */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="ENROLL NEW FIDO2 PASSKEY"
        subtitle="WebAuthn Device Assertion & Public Key Registration"
      >
        <form onSubmit={handleRegisterPasskey} className="space-y-4">
          <Input
            label="Passkey Friendly Name"
            placeholder="e.g. YubiKey 5C NFC - Desk Backup"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            helperText="A recognizable label for your hardware token"
            required
            mono
            autoFocus
          />

          <div className="space-y-1">
            <label className="block font-mono text-xs uppercase font-bold text-inherit tracking-wider">
              Authenticator Hardware Type
            </label>
            <select
              value={newKeyDeviceType}
              onChange={(e) => setNewKeyDeviceType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-warm-white text-secure-black border-[1.5px] border-secure-black shadow-ink-sm font-mono"
            >
              <option value="YubiKey 5C FIPS (Hardware Token)">YubiKey 5C FIPS (Hardware Token)</option>
              <option value="Nitrokey 3 Pro (Open Hardware)">Nitrokey 3 Pro (Open Hardware)</option>
              <option value="Defence Workstation TPM 2.0 (Platform)">Defence Workstation TPM 2.0 (Platform)</option>
              <option value="Windows Hello Enterprise Credential">Windows Hello Enterprise Credential</option>
              <option value="Apple Secure Enclave (Touch ID / Face ID)">Apple Secure Enclave (Touch ID / Face ID)</option>
            </select>
          </div>

          <div className="p-3 bg-black/5 border border-black/10 font-mono text-xs text-stone-600">
            <p className="font-bold mb-1">PROTOTYPE WEBAUTHN SIMULATION:</p>
            <p>A simulated public key credential with SHA-256 attestation certificate will be anchored to your DID.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Enroll Authenticator
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Rename Passkey */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="RENAME PASSKEY"
        subtitle="Update Friendly Label"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <Input
            label="Friendly Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            required
            mono
            autoFocus
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
