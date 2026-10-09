import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileCode, Lock, ShieldCheck, Cpu, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { apiClient } from '../api/client';
import { computeSha256, computeFileSha256 } from '../utils/crypto';
import { SecurityClassification } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';
import { Badge } from '../components/common/Badge';

export const UploadAsset: React.FC = () => {
  const { currentUser } = useAuth();
  const { incrementBlock } = useBlockchain();
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(currentUser?.department || 'Radar & Sensor Systems');
  const [classification, setClassification] = useState<SecurityClassification>('SECRET');
  const [retentionMonths, setRetentionMonths] = useState('36');
  const [description, setDescription] = useState('');
  const [filePayloadContent, setFilePayloadContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Cryptographic progress states
  const [computedSha256, setComputedSha256] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ assetId: string; txHash: string; block: number } | null>(null);

  // Handle file drop / select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').toUpperCase());
    }

    setIsHashing(true);
    setErrorMessage(null);
    try {
      // Real client-side Web Crypto SHA-256 calculation
      const hash = await computeFileSha256(file);
      setComputedSha256(hash);
    } catch (err: any) {
      setErrorMessage('Failed to compute Web Crypto SHA-256 hash: ' + err.message);
    } finally {
      setIsHashing(false);
    }
  };

  // Handle direct text payload input
  const handleTextPayloadChange = async (text: string) => {
    setFilePayloadContent(text);
    if (text.trim().length > 0) {
      setIsHashing(true);
      try {
        const hash = await computeSha256(text);
        setComputedSha256(hash);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsHashing(false);
      }
    } else {
      setComputedSha256('');
    }
  };

  const handlePreloadSampleSpec = async () => {
    const sample = `AEGIS-DEFENCE-SPECIFICATION // BEL-RADAR-DSP-MATRIX
CLASSIFICATION: TOP_SECRET
DATE: ${new Date().toISOString()}
ALGORITHM: PHASED_ARRAY_ADAPTIVE_BEAMFORMING_V4
COEFFICIENTS: [0.9412, -0.1205, 0.4489, 0.7712, -0.3391]
AUTHORIZATION: DID_AEGIS_BEL_MGR_ADESHMUKH`;

    setTitle('Phased Array Adaptive Beamforming Specification');
    setClassification('TOP_SECRET');
    setDescription('High-resolution adaptive antenna nulling coefficients for electronic counter-countermeasures.');
    setDepartment('Radar & Sensor Systems');
    await handleTextPayloadChange(sample);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!selectedFile && !filePayloadContent)) {
      setErrorMessage('Please provide a document title and upload a file or enter confidential payload content.');
      return;
    }

    if (!computedSha256) {
      setErrorMessage('Cryptographic SHA-256 computation pending.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const fileName = selectedFile ? selectedFile.name : `${title.replace(/\s+/g, '_')}.enc`;
      const sizeBytes = selectedFile ? selectedFile.size : new TextEncoder().encode(filePayloadContent).length;

      // Simulated AES-256-GCM off-chain encryption key fingerprint
      const keyFingerprint = 'SHA256:AES_GCM_' + Math.random().toString(36).substring(2, 10).toUpperCase();

      const newAsset = await apiClient.assets.registerAsset({
        title,
        fileName,
        classification,
        department,
        sizeBytes,
        sha256Hash: computedSha256,
        ownerDid: currentUser?.did || 'did:aegis:bel:emp:vrathore',
        ownerName: currentUser?.displayName || 'Authorized Engineer',
        encryptionType: 'AES-256-GCM',
        keyFingerprint,
        retentionExpiry: new Date(Date.now() + parseInt(retentionMonths) * 30 * 24 * 3600 * 1000).toISOString(),
        description: description || 'Defence asset registered to AegisChain smart contract registry.',
        contentSample: filePayloadContent || (selectedFile ? `BINARY ENCRYPTED PAYLOAD (${selectedFile.name})` : ''),
      });

      incrementBlock();

      setSuccessInfo({
        assetId: newAsset.id,
        txHash: newAsset.onChainTxHash,
        block: newAsset.blockNumber,
      });
    } catch (err: any) {
      setErrorMessage('Asset registration failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b-2 border-secure-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
              ASSET REGISTRATION //
            </span>
            <Badge variant="navy">ZERO-TRUST PIPELINE</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Seal & Register Digital Asset
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Off-chain AES-256-GCM encryption + On-chain SHA-256 immutable anchoring
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreloadSampleSpec}
          leftIcon={<FileText className="w-3.5 h-3.5" />}
        >
          Load Defence Sample
        </Button>
      </div>

      {/* Success Notification */}
      {successInfo && (
        <Card theme="navy" className="border-verification-green">
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-verification-green font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>ASSET ANCHORED SUCCESSFULLY ON HYPERLEDGER BESU L2</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-bel-navy-dark p-3 border border-muted-blue/30 text-[11px]">
              <div>
                <span className="text-muted-blue-light block">ASSET ID:</span>
                <span className="font-bold text-warm-white">{successInfo.assetId}</span>
              </div>
              <div>
                <span className="text-muted-blue-light block">BLOCK HEIGHT:</span>
                <span className="font-bold text-warm-white">#{successInfo.block}</span>
              </div>
              <div className="truncate">
                <span className="text-muted-blue-light block">TX HASH:</span>
                <span className="font-bold text-warm-white truncate block">{successInfo.txHash}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/assets/${successInfo.assetId}`)}
              >
                Inspect Asset & Run Integrity Verification
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/assets')}
              >
                Return to Assets
              </Button>
            </div>
          </div>
        </Card>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border-l-4 border-signal-red text-signal-red font-mono text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Metadata */}
          <div className="md:col-span-7 space-y-4">
            <Card title="01. ASSET METADATA" badge={<Badge variant="default">OFF-CHAIN</Badge>} theme="white">
              <div className="space-y-4">
                <Input
                  label="Document Title / Asset Name"
                  placeholder="e.g. S-Band Radar Transceiver Calibration Matrix"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  mono
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Security Classification"
                    value={classification}
                    onChange={(e) => setClassification(e.target.value as SecurityClassification)}
                  >
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="SECRET">SECRET</option>
                    <option value="TOP_SECRET">TOP SECRET</option>
                  </Select>

                  <Select
                    label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Radar & Sensor Systems">Radar & Sensor Systems</option>
                    <option value="Electronic Warfare Directorate">Electronic Warfare Directorate</option>
                    <option value="Cyber Defence Command & SOC">Cyber Defence Command & SOC</option>
                    <option value="Avionics & Missile Guidance">Avionics & Missile Guidance</option>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Retention Schedule"
                    value={retentionMonths}
                    onChange={(e) => setRetentionMonths(e.target.value)}
                  >
                    <option value="12">12 Months (1 Year)</option>
                    <option value="36">36 Months (3 Years)</option>
                    <option value="60">60 Months (5 Years)</option>
                    <option value="120">120 Months (10 Years)</option>
                  </Select>

                  <Input
                    label="Custodian DID"
                    value={currentUser?.did || ''}
                    disabled
                    mono
                    className="opacity-75 bg-stone-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-xs uppercase font-bold text-inherit tracking-wider">
                    Purpose / Operational Notes
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of asset usage and security boundaries..."
                    className="w-full px-3 py-2 text-xs bg-warm-white text-secure-black border-[1.5px] border-secure-black shadow-ink-sm font-mono focus:outline-none focus:ring-1 focus:ring-signal-red"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: File Drop & Web Crypto Hash Output */}
          <div className="md:col-span-5 space-y-4">
            <Card title="02. CRYPTOGRAPHIC PROOF ENGINE" badge={<Badge variant="red">WEB CRYPTO</Badge>} theme="white">
              {/* File Upload Zone */}
              <div className="space-y-3">
                <div className="border-2 border-dashed border-secure-black p-4 text-center bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-bel-navy mx-auto mb-1.5" />
                  <p className="font-mono text-xs font-bold text-stone-800 uppercase">
                    {selectedFile ? selectedFile.name : 'Select or Drop Document'}
                  </p>
                  <p className="font-mono text-[10px] text-stone-500 mt-0.5">
                    Binary, PDF, SVG, CAD, or encrypted bundle
                  </p>
                </div>

                <div className="text-center font-mono text-[11px] text-stone-400 uppercase">
                  — OR DIRECT TEXT PAYLOAD —
                </div>

                <textarea
                  rows={3}
                  value={filePayloadContent}
                  onChange={(e) => handleTextPayloadChange(e.target.value)}
                  placeholder="Paste confidential parameter matrix, seed, or memo..."
                  className="w-full p-2.5 text-xs font-mono bg-stone-50 border border-secure-black shadow-ink-sm placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-signal-red"
                />

                {/* Real-time Computed SHA-256 */}
                <div className="p-3 bg-bel-navy text-parchment-light border border-secure-black technical-corner space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-blue-light uppercase">
                    <span>LIVE SHA-256 DIGEST</span>
                    <span className="text-verification-green font-bold">
                      {isHashing ? 'COMPUTING...' : computedSha256 ? 'ANCHOR READY' : 'AWAITING DATA'}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] bg-bel-navy-dark p-2 border border-muted-blue/30 break-all select-all font-bold text-warm-white">
                    {computedSha256 || '0000000000000000000000000000000000000000000000000000000000000000'}
                  </div>

                  <p className="text-[10px] font-mono text-muted-blue-light">
                    Generated via browser <code className="text-warm-white">crypto.subtle.digest</code>. Zero sensitive bytes leak on-chain.
                  </p>
                </div>
              </div>
            </Card>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              disabled={!computedSha256}
              leftIcon={<ShieldCheck className="w-5 h-5" />}
            >
              Seal Asset & Mint NFT Anchor
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
