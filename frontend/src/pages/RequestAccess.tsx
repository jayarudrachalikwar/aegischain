import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileKey, ShieldAlert, CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { apiClient } from '../api/client';
import { Asset, SecurityClassification } from '../api/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';
import { Badge, ClassificationBadge } from '../components/common/Badge';

export const RequestAccess: React.FC = () => {
  const { currentUser } = useAuth();
  const { incrementBlock } = useBlockchain();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAssetId = searchParams.get('assetId');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(preselectedAssetId || '');
  const [permission, setPermission] = useState<'READ' | 'DOWNLOAD' | 'CUSTODY'>('DOWNLOAD');
  const [durationHours, setDurationHours] = useState('4');
  const [justification, setJustification] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    const list = await apiClient.assets.listAssets();
    setAssets(list);
    if (!selectedAssetId && list.length > 0) {
      setSelectedAssetId(list[0].id);
    }
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !justification.trim()) {
      setErrorMessage('Please specify an asset and provide a detailed operational justification.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.requests.submitRequest({
        assetId: selectedAssetId,
        requesterId: currentUser?.id || 'usr-001',
        requesterName: currentUser?.displayName || 'Authorized Engineer',
        requesterDid: currentUser?.did || 'did:aegis:bel:emp:vrathore',
        permission,
        durationHours: parseInt(durationHours),
        justification,
        isEmergency,
      });

      incrementBlock();

      setSuccessMessage('Access request submitted to smart contract approval queue. Pending Manager authorization.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      setErrorMessage('Request submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b-2 border-secure-black">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
            GOVERNANCE & CLEARANCE //
          </span>
          <Badge variant="navy">TIME-BOUND GRANT</Badge>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
          Request Asset Access
        </h1>
        <p className="font-mono text-xs text-stone-600 mt-1">
          Zero-trust principle: all access grants are temporary, auditable, and subject to cryptographic review
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border-l-4 border-verification-green text-stone-900 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-verification-green" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border-l-4 border-signal-red text-signal-red font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card title="REQUEST SPECIFICATION" badge={<Badge variant="default">FORM 04-A</Badge>} theme="white">
          <div className="space-y-4">
            {/* Asset Selection */}
            <div className="space-y-1">
              <label className="block font-mono text-xs uppercase font-bold text-inherit tracking-wider">
                Select Critical Asset
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-warm-white text-secure-black border-[1.5px] border-secure-black shadow-ink-sm focus:outline-none focus:ring-1 focus:ring-signal-red"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.classification}] {a.title} ({a.onChainTokenId})
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Preview Box */}
            {selectedAsset && (
              <div className="p-3 bg-stone-50 border border-stone-200 font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-bel-navy">{selectedAsset.title}</span>
                  <ClassificationBadge classification={selectedAsset.classification} />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-stone-500">
                  <span>Owner: {selectedAsset.ownerName}</span>
                  <span>•</span>
                  <span>Dept: {selectedAsset.department}</span>
                  <span>•</span>
                  <span>Hash: {selectedAsset.sha256Hash.slice(0, 12)}...</span>
                </div>
              </div>
            )}

            {/* Permission Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Requested Permission"
                value={permission}
                onChange={(e) => setPermission(e.target.value as any)}
              >
                <option value="READ">READ (In-Browser Viewer Only)</option>
                <option value="DOWNLOAD">DOWNLOAD (Verified Off-Chain Decrypt)</option>
                <option value="CUSTODY">TIME-BOUND CUSTODY (Field Lab Deployment)</option>
              </Select>

              <Select
                label="Requested Duration"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
              >
                <option value="1">1 Hour (Short Inspection)</option>
                <option value="4">4 Hours (Standard Shift)</option>
                <option value="12">12 Hours (Flight / Lab Test)</option>
                <option value="24">24 Hours (Full Day)</option>
                <option value="168">7 Days (Extended Mission)</option>
              </Select>
            </div>

            {/* Emergency Fast-Track Toggle */}
            <div className="p-3 bg-stone-50 border border-black/20 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-stone-800 block">
                  Urgent / Emergency Clearance
                </span>
                <span className="font-mono text-[11px] text-stone-500">
                  Flags request for priority SOC attention under operational emergency protocol
                </span>
              </div>
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 text-signal-red focus:ring-signal-red cursor-pointer"
              />
            </div>

            {/* Operational Justification */}
            <div className="space-y-1">
              <label className="block font-mono text-xs uppercase font-bold text-inherit tracking-wider">
                Operational Rationale & Justification *
              </label>
              <textarea
                rows={3}
                required
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="State mission mandate, test bench reference, or specific defence directive..."
                className="w-full px-3 py-2 text-xs bg-warm-white text-secure-black border-[1.5px] border-secure-black shadow-ink-sm font-mono focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>

            <div className="pt-2 border-t border-black/10 font-mono text-[11px] text-stone-500">
              <p>• Submissions are signed with your DID: <code className="text-stone-800">{currentUser?.did}</code></p>
              <p>• Smart contract automatically revokes grant upon expiration timestamp.</p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={<ShieldCheck className="w-5 h-5" />}
          >
            Submit for Smart Contract Review
          </Button>
        </div>
      </form>
    </div>
  );
};
