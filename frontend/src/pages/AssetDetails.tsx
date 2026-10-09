import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Download,
  AlertTriangle,
  History,
  Lock,
  FileText,
  Key,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { apiClient } from '../api/client';
import { Asset, AccessGrant, AuditLog } from '../api/types';
import { computeSha256, compareHashes } from '../utils/crypto';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, ClassificationBadge } from '../components/common/Badge';
import { HashDisplay } from '../components/common/HashDisplay';
import { formatBytes, formatTimestamp, formatRelativeTime } from '../utils/formatters';

export const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, role } = useAuth();
  const { triggerSimulatedTamperAlert, triggerBulkDownloadAlert, isGlobalLockdown } = useAlerts();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live Verification Engine State
  const [verificationState, setVerificationState] = useState<'IDLE' | 'VERIFYING' | 'PASS' | 'FAIL' | 'LOCKDOWN'>('IDLE');
  const [computedHash, setComputedHash] = useState<string>('');
  const [isTampered, setIsTampered] = useState(false);
  const [payloadBuffer, setPayloadBuffer] = useState<string>('');
  const [downloadCount, setDownloadCount] = useState(0);

  useEffect(() => {
    loadAssetData();
  }, [id]);

  const loadAssetData = async () => {
    setIsLoading(true);
    try {
      const allAssets = await apiClient.assets.listAssets();
      const target = allAssets.find(a => a.id === id) || allAssets[0];
      setAsset(target);

      const [allGrants, allLogs] = await Promise.all([
        apiClient.grants.listGrants(),
        apiClient.audit.getLogs(),
      ]);

      setGrants(allGrants.filter(g => g.assetId === target?.id));
      setHistoryLogs(allLogs.filter(l => l.targetAssetId === target?.id));

      setPayloadBuffer(target?.contentSample || 'AEGISCHAIN SECURE PAYLOAD CONTAINER');
      setComputedHash(target?.sha256Hash || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Integrity Check & Safe Decrypt
  const handleVerifyAndDownload = async (customPayload?: string) => {
    if (!asset) return;
    if (isGlobalLockdown) {
      setVerificationState('LOCKDOWN');
      return;
    }

    setVerificationState('VERIFYING');

    const dataToHash = customPayload !== undefined ? customPayload : payloadBuffer;
    await new Promise(r => setTimeout(r, 450)); // Haptic simulation delay

    // Real client-side Web Crypto SHA-256 calculation
    const calculated = await computeSha256(dataToHash);
    setComputedHash(calculated);

    const check = compareHashes(calculated, asset.sha256Hash);

    if (check.isMatch) {
      setVerificationState('PASS');
      const newCount = downloadCount + 1;
      setDownloadCount(newCount);

      // Check automated bulk download rule (if >3 rapid downloads in session)
      if (newCount >= 4) {
        setVerificationState('LOCKDOWN');
        triggerBulkDownloadAlert(currentUser?.did || 'did:aegis:bel:operator', newCount);
      }
    } else {
      setVerificationState('FAIL');
      // Trigger SOC security incident alert
      triggerSimulatedTamperAlert(asset.id, asset.title, calculated, asset.sha256Hash);
    }
  };

  const handleSimulateTamper = async () => {
    if (!asset) return;
    setIsTampered(true);
    // Flip a single character in the off-chain payload to simulate malicious bit alteration
    const tamperedPayload = payloadBuffer + ' [UNAUTHORIZED_BYTE_INJECTION_0xFF]';
    setPayloadBuffer(tamperedPayload);
    await handleVerifyAndDownload(tamperedPayload);
  };

  const handleRestoreOriginal = async () => {
    if (!asset) return;
    setIsTampered(false);
    const original = asset.contentSample || 'AEGISCHAIN SECURE PAYLOAD CONTAINER';
    setPayloadBuffer(original);
    setVerificationState('IDLE');
    setComputedHash(asset.sha256Hash);
  };

  const handleSimulateBulkDownload = () => {
    // Rapid succession trigger
    setDownloadCount(4);
    setVerificationState('LOCKDOWN');
    triggerBulkDownloadAlert(currentUser?.did || 'did:aegis:bel:operator', 5);
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center font-mono text-xs text-stone-500">
        LOADING IMMUTABLE ASSET SPECIFICATION...
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-16 text-center">
        <p className="font-mono text-sm font-bold text-signal-red">Asset Not Found in On-Chain Registry</p>
        <Link to="/assets" className="mt-2 inline-block font-mono text-xs text-bel-navy underline">
          Return to Protected Assets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Title */}
      <div className="pb-4 border-b-2 border-secure-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/assets" className="font-mono text-xs text-stone-500 hover:text-bel-navy">
              ASSETS
            </Link>
            <span className="font-mono text-xs text-stone-400">/</span>
            <span className="font-mono text-xs text-signal-red font-bold uppercase">{asset.onChainTokenId}</span>
            <ClassificationBadge classification={asset.classification} />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            {asset.title}
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Registered on Hyperledger Besu L2 · Block #{asset.blockNumber} · Encrypted Off-Chain
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['EMPLOYEE', 'MANAGER'].includes(role) && (
            <Link to={`/request-access?assetId=${asset.id}`}>
              <Button variant="outline" size="sm" leftIcon={<Key className="w-3.5 h-3.5" />}>
                Request Access Grant
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Details + Interactive Integrity Showpiece */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Asset Specification & Provenance */}
        <div className="lg:col-span-6 space-y-4">
          <Card title="01. ON-CHAIN SPECIFICATION & PROVENANCE" badge={<Badge variant="navy">NFT-ANCHOR</Badge>} theme="white">
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 border border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">TOKEN ID:</span>
                  <span className="font-bold text-bel-navy">{asset.onChainTokenId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">BLOCK NUMBER:</span>
                  <span className="font-bold text-stone-800">#{asset.blockNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">DEPARTMENT:</span>
                  <span className="font-semibold text-stone-700">{asset.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">FILE SIZE:</span>
                  <span className="font-semibold text-stone-700">{formatBytes(asset.sizeBytes)}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 uppercase block mb-1">RECORDED OWNER DID:</span>
                <div className="p-2 bg-black/5 border border-black/15 flex items-center justify-between">
                  <span className="font-bold text-bel-navy truncate">{asset.ownerName}</span>
                  <span className="text-[11px] text-stone-600 truncate">{asset.ownerDid}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 uppercase block mb-1">ON-CHAIN SHA-256 ANCHOR:</span>
                <HashDisplay hash={asset.sha256Hash} full className="w-full justify-between" />
              </div>

              <div>
                <span className="text-[10px] text-stone-500 uppercase block mb-1">OFF-CHAIN ENCRYPTION CIPHER:</span>
                <div className="p-2 bg-stone-50 border border-stone-200 text-[11px]">
                  <p className="font-bold text-stone-800">{asset.encryptionType} (Zero-Knowledge Symmetric Key)</p>
                  <p className="text-stone-500 truncate mt-0.5">Key Fingerprint: {asset.keyFingerprint}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 uppercase block mb-1">TRANSACTION HASH:</span>
                <HashDisplay hash={asset.onChainTxHash} lead={10} trail={10} className="w-full justify-between" />
              </div>
            </div>
          </Card>

          {/* Active Grants for this Asset */}
          <Card title="02. ACTIVE ACCESS CONTROL LIST (ACL)" badge={<Badge variant="default">{grants.length} GRANTS</Badge>} theme="white">
            {grants.length === 0 ? (
              <p className="font-mono text-xs text-stone-500 py-3">No active access grants for this asset.</p>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {grants.map((g) => (
                  <div key={g.id} className="p-2.5 bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-bel-navy">{g.userName}</span>
                        <span className="px-1.5 py-0.2 bg-bel-navy text-parchment-light text-[10px] font-bold">
                          {g.permission}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500">{g.userDid}</span>
                    </div>

                    <div className="text-right text-[11px]">
                      <span className="text-verification-green font-bold block">ACTIVE</span>
                      <span className="text-[10px] text-stone-500">Exp: {formatTimestamp(g.expiresAt).split(' ')[1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Interactive Live Verification Showpiece */}
        <div className="lg:col-span-6 space-y-4">
          <Card
            title="03. ZERO-TRUST DOWNLOAD INTEGRITY GATE"
            badge={<Badge variant="red">LIVE VERIFICATION</Badge>}
            theme="navy"
          >
            <div className="space-y-4 font-mono text-xs text-parchment-light">
              <p className="text-muted-blue-light leading-relaxed">
                Zero-Trust Rule: On every download, the file payload is re-hashed client-side using Web Crypto (<code className="text-warm-white">crypto.subtle.digest</code>) and compared to the on-chain SHA-256 anchor. Any mismatch blocks decrypt instantly.
              </p>

              {/* Status Display Screen */}
              {verificationState === 'PASS' && (
                <div className="p-3.5 bg-verification-green/20 border-2 border-verification-green text-warm-white space-y-1">
                  <div className="flex items-center gap-2 font-bold text-verification-green text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>VERIFIED · HASH MATCH · ACCESS ALLOWED</span>
                  </div>
                  <p className="text-[11px] text-stone-200">
                    Off-chain file integrity 100% matches on-chain anchor. AES-256-GCM decryption unlocked.
                  </p>
                </div>
              )}

              {verificationState === 'FAIL' && (
                <div className="p-3.5 bg-red-950/80 border-2 border-signal-red text-warm-white space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 font-bold text-signal-red text-sm">
                    <XCircle className="w-5 h-5" />
                    <span>TAMPER DETECTED · ACCESS BLOCKED</span>
                  </div>
                  <p className="text-[11px] text-stone-200">
                    CRITICAL: Download aborted. Off-chain payload hash diverges from on-chain anchor. Security incident logged to SOC.
                  </p>
                  <div className="p-2 bg-black/60 border border-signal-red/60 text-[10px] space-y-1">
                    <div>Expected On-Chain: <code className="text-verification-green">{asset.sha256Hash}</code></div>
                    <div>Computed Download: <code className="text-signal-red">{computedHash}</code></div>
                  </div>
                </div>
              )}

              {verificationState === 'LOCKDOWN' && (
                <div className="p-3.5 bg-signal-red text-warm-white space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5" />
                    <span>AUTOMATIC TEMPORARY LOCKDOWN ENGAGED</span>
                  </div>
                  <p className="text-[11px]">
                    Bulk-download threshold triggered. Identity suspended pending security review.
                  </p>
                </div>
              )}

              {/* Interactive Payload Preview Window */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-blue-light">
                  <span>OFF-CHAIN SIMULATED BUFFER ({isTampered ? 'TAMPERED' : 'GENUINE'}):</span>
                  {isTampered && <span className="text-signal-red font-bold">BIT ALTERED</span>}
                </div>
                <textarea
                  rows={4}
                  value={payloadBuffer}
                  onChange={(e) => setPayloadBuffer(e.target.value)}
                  className={`w-full p-2.5 text-xs font-mono bg-bel-navy-dark text-warm-white border ${
                    isTampered ? 'border-signal-red' : 'border-muted-blue/40'
                  } focus:outline-none`}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={verificationState === 'VERIFYING'}
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => handleVerifyAndDownload()}
                >
                  Verify Hash & Download
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Zap className="w-3.5 h-3.5" />}
                    onClick={handleSimulateTamper}
                  >
                    Simulate Tamper
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={handleRestoreOriginal}
                  >
                    Restore Original
                  </Button>
                </div>

                <div className="pt-2 border-t border-muted-blue/20">
                  <button
                    type="button"
                    onClick={handleSimulateBulkDownload}
                    className="w-full py-1.5 text-[11px] font-mono text-muted-blue-light hover:text-signal-red uppercase underline text-center"
                  >
                    Simulate Rapid Bulk Download Attack (Triggers Lockdown)
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Asset Audit History */}
          <Card title="04. ASSET AUDIT TRAIL" badge={<Badge variant="navy">BESU LEDGER</Badge>} theme="white">
            <div className="space-y-2.5 font-mono text-xs">
              {historyLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-2 bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                    <span className="font-bold text-stone-700">{log.eventType}</span>
                    <span>{formatRelativeTime(log.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">{log.details}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
