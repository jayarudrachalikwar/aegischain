import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Fingerprint, KeyRound, ShieldAlert, CheckCircle2, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';

export const Login: React.FC = () => {
  const { loginWithPasskey, verifyTotp, allUsers } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('vrathore');
  const [step, setStep] = useState<'PASSKEY_PROMPT' | 'TOTP_CHALLENGE'>('PASSKEY_PROMPT');
  const [totpCode, setTotpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePasskeyAuth = async (targetUsername?: string) => {
    const userToAuth = targetUsername || username;
    if (!userToAuth) {
      setErrorMessage('Please enter an identity username or select a test role.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // In real WebAuthn, we would invoke navigator.credentials.get
      // In DEMO MODE, our API client handles the simulated FIDO2 challenge
      await new Promise(r => setTimeout(r, 600)); // Haptic simulation delay

      const res = await loginWithPasskey(userToAuth);
      if (!res) {
        // Requires TOTP MFA challenge
        setStep('TOTP_CHALLENGE');
        setSuccessMessage('Passkey verified successfully. Enter your 6-digit TOTP MFA code.');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Passkey authentication failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      setErrorMessage('Enter a valid 6-digit TOTP security token.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const ok = await verifyTotp(totpCode);
      if (ok) {
        setSuccessMessage('Zero-trust authentication verified. Redirecting...');
        setTimeout(() => navigate('/dashboard'), 400);
      } else {
        setErrorMessage('Invalid TOTP token. Please check your authenticator application.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'TOTP verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Eyebrow */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-bel-navy text-parchment-light border border-secure-black font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
          <Shield className="w-3.5 h-3.5 text-signal-red" />
          <span>ZERO-TRUST AUTHENTICATION GATEWAY // LEVEL 4</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight">
          AegisChain Security Login
        </h1>
        <p className="font-mono text-xs text-stone-600 mt-1 uppercase tracking-wider">
          FIDO2 / WebAuthn Hardware Passkey + TOTP Two-Factor Authentication
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Authentication Box */}
        <div className="md:col-span-7">
          <Card
            title={step === 'PASSKEY_PROMPT' ? '01. HARDWARE PASSKEY ASSERTION' : '02. TIME-BASED OTP VERIFICATION'}
            badge={<Badge variant="navy">FIDO2</Badge>}
            theme="white"
          >
            {/* Error & Info Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-signal-red text-signal-red font-mono text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-verification-green text-stone-900 font-mono text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-verification-green" />
                <span>{successMessage}</span>
              </div>
            )}

            {step === 'PASSKEY_PROMPT' ? (
              <div className="space-y-5">
                <p className="font-mono text-xs text-stone-700 leading-relaxed">
                  Authenticate using your registered hardware security key (e.g. YubiKey FIPS, Windows Hello TPM, or platform passkey).
                </p>

                <div className="space-y-3">
                  <Input
                    label="Operator Identity Username"
                    placeholder="e.g. vrathore"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    helperText="Belonging to the authorized organisation roster"
                    mono
                  />

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      isLoading={isProcessing}
                      onClick={() => handlePasskeyAuth()}
                      leftIcon={<Fingerprint className="w-5 h-5" />}
                    >
                      Authenticate with Passkey
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10 font-mono text-[11px] text-stone-500 space-y-1">
                  <p>• WebAuthn Client Data Hash generated client-side.</p>
                  <p>• Zero passwords stored or transmitted over the wire.</p>
                  <p>• Private keys remain inside hardware secure enclave.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTotpVerify} className="space-y-4">
                <p className="font-mono text-xs text-stone-700 leading-relaxed">
                  Enter the 6-digit dynamic token generated by your configured authenticator application (Google Authenticator, YubiKey Authenticator).
                </p>

                <Input
                  label="6-Digit TOTP Token"
                  placeholder="000 000"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  helperText="Tokens rotate every 30 seconds (RFC 6238)"
                  mono
                  className="text-center tracking-widest text-lg font-bold"
                  autoFocus
                />

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="flex-1"
                    isLoading={isProcessing}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                  >
                    Verify & Enter Vault
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setStep('PASSKEY_PROMPT');
                      setErrorMessage(null);
                    }}
                  >
                    Back
                  </Button>
                </div>

                <div className="p-2.5 bg-black/5 border border-black/10 font-mono text-[10px] text-stone-600">
                  <span className="font-bold">DEMO HELPER:</span> In prototype mode, any 6-digit number (e.g. <code className="font-bold text-signal-red">123456</code>) will pass verification.
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Demo Fast-Login Selector with all 5 roles */}
        <div className="md:col-span-5 space-y-4">
          <Card
            title="FAST ROLE TESTER (DEMO MODE)"
            badge={<Badge variant="red">PROTOTYPE</Badge>}
            theme="navy"
          >
            <p className="font-mono text-xs text-muted-blue-light mb-3">
              One-click simulate passkey authentication for any role to test specific governance and access control paths:
            </p>

            <div className="space-y-2">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setUsername(u.username);
                    handlePasskeyAuth(u.username);
                  }}
                  className="w-full text-left p-2.5 bg-bel-navy-dark hover:bg-black/40 border border-muted-blue/40 text-parchment-light transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase group-hover:text-signal-red transition-colors">
                        {u.displayName}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-muted-blue-light flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-warm-white">{u.role}</span>
                      <span>·</span>
                      <span className="truncate">{u.department}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-blue group-hover:text-signal-red group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-muted-blue/20 font-mono text-[10px] text-muted-blue">
              <span>AegisChain · Identity Management</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
