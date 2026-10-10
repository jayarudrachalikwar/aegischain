import { User, Asset, AccessRequest, AccessGrant, AuditLog, SecurityAlert, PasskeyRecord, UserRole } from './types';
import { computeSha256 } from '../utils/crypto';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-001',
    username: 'vrathore',
    displayName: 'Vikram Rathore',
    email: 'v.rathore@aegis.bel.internal',
    role: 'EMPLOYEE',
    did: 'did:aegis:bel:emp:vrathore',
    clearanceLevel: 'SECRET',
    department: 'Radar & Sensor Systems',
    passkeysCount: 2,
    totpEnabled: true,
    status: 'ACTIVE',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'usr-002',
    username: 'adeshmukh',
    displayName: 'Dr. Anita Deshmukh',
    email: 'a.deshmukh@aegis.bel.internal',
    role: 'MANAGER',
    did: 'did:aegis:bel:mgr:adeshmukh',
    clearanceLevel: 'TOP_SECRET',
    department: 'Electronic Warfare Directorate',
    passkeysCount: 3,
    totpEnabled: true,
    status: 'ACTIVE',
    createdAt: '2025-11-01T10:30:00Z',
  },
  {
    id: 'usr-003',
    username: 'rnair',
    displayName: 'Rajesh Nair',
    email: 'r.nair@aegis.bel.internal',
    role: 'ADMIN',
    did: 'did:aegis:bel:adm:rnair',
    clearanceLevel: 'SECRET',
    department: 'Identity & PKI Operations',
    passkeysCount: 2,
    totpEnabled: true,
    status: 'ACTIVE',
    createdAt: '2025-10-10T08:15:00Z',
  },
  {
    id: 'usr-004',
    username: 'skverma',
    displayName: 'Col. S. K. Verma',
    email: 'sk.verma@aegis.bel.internal',
    role: 'AUDITOR',
    did: 'did:aegis:bel:aud:skverma',
    clearanceLevel: 'TOP_SECRET',
    department: 'Independent Defence Oversight Board',
    passkeysCount: 1,
    totpEnabled: true,
    status: 'ACTIVE',
    createdAt: '2025-12-05T14:00:00Z',
  },
  {
    id: 'usr-005',
    username: 'piyer',
    displayName: 'Major Priya Iyer',
    email: 'p.iyer@aegis.bel.internal',
    role: 'SECURITY_OFFICER',
    did: 'did:aegis:bel:sec:piyer',
    clearanceLevel: 'TOP_SECRET',
    department: 'Cyber Defence Command & SOC',
    passkeysCount: 2,
    totpEnabled: true,
    status: 'ACTIVE',
    createdAt: '2026-02-01T11:45:00Z',
  },
  {
    id: 'usr-006',
    username: 'spatil',
    displayName: 'Sunita Patil',
    email: 's.patil@aegis.bel.internal',
    role: 'QA_VERIFIER',
    did: 'did:aegis:bel:qa:spatil',
    clearanceLevel: 'SECRET',
    department: 'Quality Assurance & Calibration Wing',
    passkeysCount: 2,
    totpEnabled: true,
    status: 'ACTIVE',
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'usr-007',
    username: 'kmurthy',
    displayName: 'Air Commodore K. Murthy (Retd.)',
    email: 'k.murthy@aegis.bel.internal',
    role: 'DEPT_MANAGER',
    did: 'did:aegis:bel:dmgr:kmurthy',
    clearanceLevel: 'TOP_SECRET',
    department: 'Radar Directorate & Project Leadership',
    passkeysCount: 3,
    totpEnabled: true,
    status: 'ACTIVE',
    createdAt: '2025-09-15T09:30:00Z',
  },
  {
    id: 'usr-008',
    username: 'jdev',
    displayName: 'Lt. Cmdr. Jaydev Sen',
    email: 'j.sen@navy.gov.in',
    role: 'EXTERNAL_COLLABORATOR',
    did: 'did:aegis:bel:ext:jsen',
    clearanceLevel: 'RESTRICTED',
    department: 'MoD / Naval Liaison Trials Team',
    passkeysCount: 1,
    totpEnabled: true,
    status: 'ACTIVE',
    createdAt: '2026-03-01T14:20:00Z',
  },
];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'ast-9921',
    title: 'X-Band AESA Radar Pulse Timing Matrix v4',
    fileName: 'X_BAND_AESA_PULSE_TIMING_V4.enc',
    classification: 'TOP_SECRET',
    department: 'Radar & Sensor Systems',
    sizeBytes: 4892160,
    sha256Hash: '9f3ac1d200482b45e89a62bc34107e3f89012345bc89fa0124de56789abcdef0',
    onChainTokenId: 'NFT-BEL-00482',
    onChainTxHash: '0x3c8b417e923e38712bfda28723c3b0dfb1940a421cba9ef441094892305a2871',
    blockNumber: 48291,
    ownerDid: 'did:aegis:bel:mgr:adeshmukh',
    ownerName: 'Dr. Anita Deshmukh',
    encryptionType: 'AES-256-GCM',
    keyFingerprint: 'SHA256:7BqP8vQ2X0+KzN7dJ8x3W2M6eT4uR1vC8xY3zA5bE=',
    createdAt: '2026-10-01T08:12:00Z',
    integrityStatus: 'VERIFIED',
    retentionExpiry: '2029-10-01T00:00:00Z',
    description: 'Mission-critical phased array pulse timing and frequency modulation tables for maritime surveillance radar.',
    contentSample: 'AEGIS-BEL-ASSET: X-BAND AESA RADAR SPECIFICATION. PULSE WIDTH: 12.4us. PRF: 2400Hz. HOPPING SCHEDULE: PSEUDO-RANDOM ORTHOGONAL CODE 0x7E3A99B1.',
  },
  {
    id: 'ast-9922',
    title: 'Tactical SDR Cryptographic Key Schedule (Q4-2026)',
    fileName: 'TAC_SDR_KEY_SCHEDULE_Q4.bin.enc',
    classification: 'TOP_SECRET',
    department: 'Cyber Defence Command & SOC',
    sizeBytes: 1048576,
    sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    onChainTokenId: 'NFT-BEL-00483',
    onChainTxHash: '0x8892ca019482bfce102948cbb391204981caee94827103891048291048bcefa1',
    blockNumber: 48294,
    ownerDid: 'did:aegis:bel:sec:piyer',
    ownerName: 'Major Priya Iyer',
    encryptionType: 'AES-256-GCM',
    keyFingerprint: 'SHA256:M2m9qL7xW4kP1rT8yB6vC3dE0fZ5aN9sH2jK4uX7vB=',
    createdAt: '2026-10-03T11:40:00Z',
    integrityStatus: 'VERIFIED',
    retentionExpiry: '2026-12-31T23:59:59Z',
    description: 'Quantum-resistant symmetric seed matrices for tactical VHF/UHF battlefield software defined radios.',
    contentSample: 'TAC_SDR_ROOT_SEED_SCHEDULE: EPOCH 2026-Q4. POLYNOMIAL RING: NTRU-HRSS-701. ZERO TOLERANCE DIRECT LEAKAGE.',
  },
  {
    id: 'ast-9923',
    title: 'Combat UAV Telemetry & Link Protocol v2.8',
    fileName: 'UAV_TELEMETRY_LINK_V28.pdf.enc',
    classification: 'SECRET',
    department: 'Radar & Sensor Systems',
    sizeBytes: 15420000,
    sha256Hash: 'a589c301bf4e7230491823901bcefa8102948201bfde48102948192048290123',
    onChainTokenId: 'NFT-BEL-00484',
    onChainTxHash: '0x12fa998341029481bfce92018491024981029481920481029481029481920481',
    blockNumber: 48301,
    ownerDid: 'did:aegis:bel:emp:vrathore',
    ownerName: 'Vikram Rathore',
    encryptionType: 'AES-256-GCM',
    keyFingerprint: 'SHA256:K3dE0fZ5aN9sH2jK4uX7vBM2m9qL7xW4kP1rT8yB6v=',
    createdAt: '2026-10-05T14:22:00Z',
    integrityStatus: 'VERIFIED',
    retentionExpiry: '2028-10-05T00:00:00Z',
    description: 'Anti-jamming satellite datalink schema and authenticated command framing for unmanned strike aerial vehicles.',
    contentSample: 'UAV-DLINK-FRAME: SYNC_BYTE: 0x55AA. HMAC_ALGO: BLAKE2b-256. FAILSAFE: RETURN TO RALLY COORD 17.3850 N 78.4867 E.',
  },
  {
    id: 'ast-9924',
    title: 'Electronic Warfare Jammer Countermeasure Firmware',
    fileName: 'EW_JAMMER_CM_FW_V19.bin.enc',
    classification: 'CONFIDENTIAL',
    department: 'Electronic Warfare Directorate',
    sizeBytes: 8192000,
    sha256Hash: 'e7102948201bfda3910294810294810294819204810294819204819204810294',
    onChainTokenId: 'NFT-BEL-00485',
    onChainTxHash: '0x9920184910249810294819204810294819204810294810294819204810294810',
    blockNumber: 48310,
    ownerDid: 'did:aegis:bel:mgr:adeshmukh',
    ownerName: 'Dr. Anita Deshmukh',
    encryptionType: 'AES-256-GCM',
    keyFingerprint: 'SHA256:R1vC8xY3zA5bEM2m9qL7xW4kP1rT8yB6vC3dE0fZ5a=',
    createdAt: '2026-10-07T09:15:00Z',
    integrityStatus: 'VERIFIED',
    retentionExpiry: '2027-10-07T00:00:00Z',
    description: 'Digital RF memory (DRFM) spoofing suppression firmware for naval electronic warfare pods.',
    contentSample: 'EW-DRFM-FW: CORE VERSION 19.3. DSP CLOCK: 1.2GHz. THRESHOLD NOISE FLOOR: -114dBm. SIGNED BY BEL KEYMASTER.',
  },
  {
    id: 'ast-9925',
    title: 'Integrated Coastal Defence Network Topology',
    fileName: 'COASTAL_DEF_NETWORK_TOPOLOGY.svg.enc',
    classification: 'RESTRICTED',
    department: 'Cyber Defence Command & SOC',
    sizeBytes: 3145728,
    sha256Hash: 'c491823901bcefa8102948201bfde48102948192048290123a589c301bf4e723',
    onChainTokenId: 'NFT-BEL-00486',
    onChainTxHash: '0x7710294819204810294819204819204810294810294819204819204810294810',
    blockNumber: 48318,
    ownerDid: 'did:aegis:bel:adm:rnair',
    ownerName: 'Rajesh Nair',
    encryptionType: 'AES-256-GCM',
    keyFingerprint: 'SHA256:N9sH2jK4uX7vBM2m9qL7xW4kP1rT8yB6vC3dE0fZ5a=',
    createdAt: '2026-10-08T16:45:00Z',
    integrityStatus: 'VERIFIED',
    retentionExpiry: '2030-01-01T00:00:00Z',
    description: 'Fiber-optic resilient ring architecture connecting coastal radar stations to central command bunker.',
    contentSample: 'COASTAL_TOPOLOGY: RING_01 (WESTERN COMMAND). NODES: 14. BANDWIDTH: 100Gbps WDM. ENCRYPTOR: BEL-CRYPTO-L2.',
  }
];

export const INITIAL_REQUESTS: AccessRequest[] = [
  {
    id: 'req-101',
    assetId: 'ast-9921',
    assetName: 'X-Band AESA Radar Pulse Timing Matrix v4',
    assetClassification: 'TOP_SECRET',
    requesterId: 'usr-001',
    requesterName: 'Vikram Rathore',
    requesterDid: 'did:aegis:bel:emp:vrathore',
    permission: 'DOWNLOAD',
    durationHours: 4,
    justification: 'Required for simulated frequency-hopping hardware-in-the-loop test at Test Facility Alpha.',
    isEmergency: false,
    status: 'PENDING',
    submittedAt: '2026-10-09T06:15:00Z',
  },
  {
    id: 'req-102',
    assetId: 'ast-9922',
    assetName: 'Tactical SDR Cryptographic Key Schedule (Q4-2026)',
    assetClassification: 'TOP_SECRET',
    requesterId: 'usr-001',
    requesterName: 'Vikram Rathore',
    requesterDid: 'did:aegis:bel:emp:vrathore',
    permission: 'READ',
    durationHours: 2,
    justification: 'Verify firmware cipher alignment against current Q4 symmetric seed specifications.',
    isEmergency: true,
    status: 'APPROVED',
    submittedAt: '2026-10-08T10:00:00Z',
    reviewedAt: '2026-10-08T10:14:00Z',
    reviewerName: 'Dr. Anita Deshmukh',
    reviewNote: 'Approved under urgent pre-flight verification protocol.',
  },
  {
    id: 'req-103',
    assetId: 'ast-9924',
    assetName: 'Electronic Warfare Jammer Countermeasure Firmware',
    assetClassification: 'CONFIDENTIAL',
    requesterId: 'usr-001',
    requesterName: 'Vikram Rathore',
    requesterDid: 'did:aegis:bel:emp:vrathore',
    permission: 'CUSTODY',
    durationHours: 24,
    justification: 'Field deployment onto laboratory test bench for firmware burning.',
    isEmergency: false,
    status: 'PENDING',
    submittedAt: '2026-10-09T05:30:00Z',
  }
];

export const INITIAL_GRANTS: AccessGrant[] = [
  {
    id: 'grt-501',
    assetId: 'ast-9922',
    assetName: 'Tactical SDR Cryptographic Key Schedule (Q4-2026)',
    assetClassification: 'TOP_SECRET',
    userDid: 'did:aegis:bel:emp:vrathore',
    userName: 'Vikram Rathore',
    permission: 'READ',
    grantedAt: '2026-10-09T06:00:00Z',
    expiresAt: '2026-10-09T18:00:00Z', // 12h grant
    status: 'ACTIVE',
    onChainTxHash: '0x4410294819204810294819204819204810294810294819204819204810294810',
  },
  {
    id: 'grt-502',
    assetId: 'ast-9923',
    assetName: 'Combat UAV Telemetry & Link Protocol v2.8',
    assetClassification: 'SECRET',
    userDid: 'did:aegis:bel:mgr:adeshmukh',
    userName: 'Dr. Anita Deshmukh',
    permission: 'DOWNLOAD',
    grantedAt: '2026-10-08T08:00:00Z',
    expiresAt: '2026-10-15T08:00:00Z',
    status: 'ACTIVE',
    onChainTxHash: '0x5510294819204810294819204819204810294810294819204819204810294810',
  },
  {
    id: 'grt-503',
    assetId: 'ast-9925',
    assetName: 'Integrated Coastal Defence Network Topology',
    assetClassification: 'RESTRICTED',
    userDid: 'did:aegis:bel:emp:vrathore',
    userName: 'Vikram Rathore',
    permission: 'DOWNLOAD',
    grantedAt: '2026-10-07T09:00:00Z',
    expiresAt: '2026-10-07T17:00:00Z',
    status: 'EXPIRED',
    onChainTxHash: '0x6610294819204810294819204819204810294810294819204819204810294810',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-801',
    blockNumber: 48325,
    txHash: '0x9f3ac1d200482b45e89a62bc34107e3f89012345bc89fa0124de56789abcdef0',
    timestamp: '2026-10-09T06:50:12Z',
    eventType: 'DOWNLOAD_VERIFIED',
    actorDid: 'did:aegis:bel:emp:vrathore',
    actorName: 'Vikram Rathore',
    targetAssetId: 'ast-9922',
    targetAssetName: 'Tactical SDR Cryptographic Key Schedule (Q4-2026)',
    details: 'SHA-256 integrity match confirmed against on-chain anchor: 4b227777...bf8a. Access granted.',
    verifiedOnChain: true,
  },
  {
    id: 'aud-802',
    blockNumber: 48322,
    txHash: '0x8fa1bc9401928401924810294810294810294819204810294819204810294810',
    timestamp: '2026-10-09T06:00:00Z',
    eventType: 'ACCESS_GRANTED',
    actorDid: 'did:aegis:bel:mgr:adeshmukh',
    actorName: 'Dr. Anita Deshmukh',
    targetAssetId: 'ast-9922',
    targetAssetName: 'Tactical SDR Cryptographic Key Schedule (Q4-2026)',
    details: 'Time-limited READ grant issued to did:aegis:bel:emp:vrathore for 12 hours. Smart contract grant active.',
    verifiedOnChain: true,
  },
  {
    id: 'aud-803',
    blockNumber: 48318,
    txHash: '0x7710294819204810294819204819204810294810294819204819204810294810',
    timestamp: '2026-10-08T16:45:00Z',
    eventType: 'ASSET_MINTED',
    actorDid: 'did:aegis:bel:adm:rnair',
    actorName: 'Rajesh Nair',
    targetAssetId: 'ast-9925',
    targetAssetName: 'Integrated Coastal Defence Network Topology',
    details: 'Asset anchored as NFT-BEL-00486. SHA-256 hash locked on-chain. Encrypted payload stored off-chain.',
    verifiedOnChain: true,
  },
  {
    id: 'aud-804',
    blockNumber: 48312,
    txHash: '0x3310294819204810294819204819204810294810294819204819204810294810',
    timestamp: '2026-10-08T11:15:33Z',
    eventType: 'INTEGRITY_MISMATCH',
    actorDid: 'did:aegis:bel:emp:unknown',
    actorName: 'External Probe / Unverified Agent',
    targetAssetId: 'ast-9921',
    targetAssetName: 'X-Band AESA Radar Pulse Timing Matrix v4',
    details: 'CRITICAL: Download hash mismatch detected! Off-chain file differed by 3 bits. Download blocked instantly.',
    verifiedOnChain: true,
  },
  {
    id: 'aud-805',
    blockNumber: 48305,
    txHash: '0x2210294819204810294819204819204810294810294819204819204810294810',
    timestamp: '2026-10-07T14:30:00Z',
    eventType: 'BULK_LOCKDOWN',
    actorDid: 'did:aegis:bel:emp:jdoe',
    actorName: 'Suspended Contractor ID',
    details: 'Automated defense rule triggered: 6 rapid download requests in 45s. Account locked automatically.',
    verifiedOnChain: true,
  }
];

export const INITIAL_ALERTS: SecurityAlert[] = [
  {
    id: 'alt-401',
    severity: 'CRITICAL',
    alertType: 'INTEGRITY_MISMATCH',
    timestamp: '2026-10-08T11:15:33Z',
    actorDid: 'did:aegis:bel:emp:unknown',
    actorName: 'Test Node 04B',
    assetId: 'ast-9921',
    assetName: 'X-Band AESA Radar Pulse Timing Matrix v4',
    details: 'Hash check failed: expected on-chain 9f3ac1d2... != computed 9f3ac1d3... Off-chain tampering blocked.',
    resolved: false,
    actionTaken: 'Zero-trust gate aborted decrypt. Alert logged to smart contract ledger.',
  },
  {
    id: 'alt-402',
    severity: 'HIGH',
    alertType: 'BULK_DOWNLOAD_ATTEMPT',
    timestamp: '2026-10-07T14:30:00Z',
    actorDid: 'did:aegis:bel:emp:jdoe',
    actorName: 'Suspended Contractor ID',
    details: 'Threshold exceeded: 6 sequential asset requests within 45 seconds. Automated defensive lockdown engaged.',
    resolved: true,
    resolvedAt: '2026-10-07T15:00:00Z',
    resolvedBy: 'Major Priya Iyer',
    actionTaken: 'Session invalidated. Passkey revoked pending manual security interview.',
  },
  {
    id: 'alt-403',
    severity: 'MEDIUM',
    alertType: 'UNAUTHORIZED_ACCESS',
    timestamp: '2026-10-06T09:12:00Z',
    actorDid: 'did:aegis:bel:emp:vrathore',
    actorName: 'Vikram Rathore',
    assetId: 'ast-9921',
    assetName: 'X-Band AESA Radar Pulse Timing Matrix v4',
    details: 'Attempted access without active smart contract grant. Blocked at application boundary.',
    resolved: true,
    resolvedAt: '2026-10-06T09:20:00Z',
    resolvedBy: 'Major Priya Iyer',
    actionTaken: 'User redirected to formal Access Request submission form.',
  }
];

export const INITIAL_PASSKEYS: PasskeyRecord[] = [
  {
    id: 'pk-01',
    friendlyName: 'YubiKey 5C FIPS (Primary Hardware Token)',
    credentialId: 'cred_fips_9824_bel_sec',
    aaguid: 'ee88282e-e650-4498-8ec0-213f8d3dcf72',
    deviceType: 'Hardware Security Key (FIDO2 / WebAuthn)',
    createdAt: '2026-01-15T09:10:00Z',
    lastUsedAt: '2026-10-09T06:50:00Z',
  },
  {
    id: 'pk-02',
    friendlyName: 'Defence Workstation TPM 2.0 (BEL-WS-492)',
    credentialId: 'cred_tpm_4921_bel_local',
    aaguid: '00000000-0000-0000-0000-000000000000',
    deviceType: 'Internal Platform Authenticator (Windows Hello / TPM)',
    createdAt: '2026-02-01T10:00:00Z',
    lastUsedAt: '2026-10-08T18:15:00Z',
  }
];

// In-Memory state store for DEMO MODE persistence within browser session
class MockDataStore {
  users: User[] = [...INITIAL_USERS];
  assets: Asset[] = [...INITIAL_ASSETS];
  requests: AccessRequest[] = [...INITIAL_REQUESTS];
  grants: AccessGrant[] = [...INITIAL_GRANTS];
  auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  alerts: SecurityAlert[] = [...INITIAL_ALERTS];
  passkeys: PasskeyRecord[] = [...INITIAL_PASSKEYS];
  isGlobalLockdown = false;
  currentBlockNumber = 48330;

  getUsers() { return this.users; }
  getAssets() { return this.assets; }
  getAssetById(id: string) { return this.assets.find(a => a.id === id); }
  getRequests() { return this.requests; }
  getGrants() { return this.grants; }
  getAuditLogs() { return this.auditLogs; }
  getAlerts() { return this.alerts; }
  getPasskeys() { return this.passkeys; }

  async addAsset(assetData: Omit<Asset, 'id' | 'onChainTokenId' | 'onChainTxHash' | 'blockNumber' | 'createdAt' | 'integrityStatus'>) {
    this.currentBlockNumber += 1;
    const count = this.assets.length + 1;
    const id = `ast-${Math.floor(1000 + Math.random() * 9000)}`;
    const tokenId = `NFT-BEL-00${480 + count}`;

    // Generate realistic on-chain tx hash
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newAsset: Asset = {
      ...assetData,
      id,
      onChainTokenId: tokenId,
      onChainTxHash: txHash,
      blockNumber: this.currentBlockNumber,
      createdAt: new Date().toISOString(),
      integrityStatus: 'VERIFIED',
    };

    this.assets.unshift(newAsset);

    // Record on-chain audit event
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      blockNumber: this.currentBlockNumber,
      txHash,
      timestamp: new Date().toISOString(),
      eventType: 'ASSET_MINTED',
      actorDid: assetData.ownerDid,
      actorName: assetData.ownerName,
      targetAssetId: id,
      targetAssetName: assetData.title,
      details: `Asset sealed and anchored as ${tokenId}. SHA-256 hash committed to Besu smart contract.`,
      verifiedOnChain: true,
    });

    return newAsset;
  }

  createAccessRequest(req: {
    assetId: string;
    requesterId: string;
    requesterName: string;
    requesterDid: string;
    permission: 'READ' | 'DOWNLOAD' | 'CUSTODY';
    durationHours: number;
    justification: string;
    isEmergency: boolean;
  }) {
    const asset = this.getAssetById(req.assetId);
    const newRequest: AccessRequest = {
      id: `req-${Date.now().toString().slice(-4)}`,
      assetId: req.assetId,
      assetName: asset?.title || 'Unknown Asset',
      assetClassification: asset?.classification || 'RESTRICTED',
      requesterId: req.requesterId,
      requesterName: req.requesterName,
      requesterDid: req.requesterDid,
      permission: req.permission,
      durationHours: req.durationHours,
      justification: req.justification,
      isEmergency: req.isEmergency,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    this.requests.unshift(newRequest);

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      blockNumber: this.currentBlockNumber,
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString(),
      eventType: 'ACCESS_REQUESTED',
      actorDid: req.requesterDid,
      actorName: req.requesterName,
      targetAssetId: req.assetId,
      targetAssetName: newRequest.assetName,
      details: `Requested ${req.permission} grant for ${req.durationHours}h. Emergency: ${req.isEmergency}`,
      verifiedOnChain: true,
    });

    return newRequest;
  }

  reviewAccessRequest(requestId: string, decision: 'APPROVED' | 'REJECTED', reviewerName: string, reviewerDid: string, reviewNote?: string) {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    req.status = decision;
    req.reviewedAt = new Date().toISOString();
    req.reviewerName = reviewerName;
    req.reviewNote = reviewNote;

    this.currentBlockNumber += 1;
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    if (decision === 'APPROVED') {
      const expiresAt = new Date(Date.now() + req.durationHours * 3600 * 1000).toISOString();
      const newGrant: AccessGrant = {
        id: `grt-${Math.floor(100 + Math.random() * 900)}`,
        assetId: req.assetId,
        assetName: req.assetName,
        assetClassification: req.assetClassification,
        userDid: req.requesterDid,
        userName: req.requesterName,
        permission: req.permission,
        grantedAt: new Date().toISOString(),
        expiresAt,
        status: 'ACTIVE',
        onChainTxHash: txHash,
      };
      this.grants.unshift(newGrant);

      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        blockNumber: this.currentBlockNumber,
        txHash,
        timestamp: new Date().toISOString(),
        eventType: 'ACCESS_GRANTED',
        actorDid: reviewerDid,
        actorName: reviewerName,
        targetAssetId: req.assetId,
        targetAssetName: req.assetName,
        details: `Grant approved for ${req.requesterName} (${req.permission}). Expires: ${expiresAt}`,
        verifiedOnChain: true,
      });
    }

    return req;
  }

  revokeGrant(grantId: string, revokerDid: string, revokerName: string, reason: string) {
    const grant = this.grants.find(g => g.id === grantId);
    if (!grant) throw new Error('Grant not found');

    grant.status = 'REVOKED';
    grant.revokedAt = new Date().toISOString();
    grant.revocationReason = reason;

    this.currentBlockNumber += 1;
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      blockNumber: this.currentBlockNumber,
      txHash,
      timestamp: new Date().toISOString(),
      eventType: 'ACCESS_REVOKED',
      actorDid: revokerDid,
      actorName: revokerName,
      targetAssetId: grant.assetId,
      targetAssetName: grant.assetName,
      details: `Revoked grant for ${grant.userName}. Reason: ${reason}`,
      verifiedOnChain: true,
    });

    return grant;
  }

  recordSecurityIncident(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>) {
    const id = `alt-${Math.floor(100 + Math.random() * 900)}`;
    const newAlert: SecurityAlert = {
      ...alert,
      id,
      timestamp: new Date().toISOString(),
      resolved: false,
    };
    this.alerts.unshift(newAlert);

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      blockNumber: this.currentBlockNumber,
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString(),
      eventType: alert.alertType === 'BULK_DOWNLOAD_ATTEMPT' ? 'BULK_LOCKDOWN' : 'INTEGRITY_MISMATCH',
      actorDid: alert.actorDid,
      actorName: alert.actorName,
      targetAssetId: alert.assetId,
      targetAssetName: alert.assetName,
      details: `ALERT: ${alert.details} | Action: ${alert.actionTaken}`,
      verifiedOnChain: true,
    });

    return newAlert;
  }

  resolveAlert(alertId: string, resolvedBy: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedBy = resolvedBy;
    }
    return alert;
  }

  toggleGlobalLockdown(enactedBy: string, actorDid: string, reason: string) {
    this.isGlobalLockdown = !this.isGlobalLockdown;
    this.currentBlockNumber += 1;
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      blockNumber: this.currentBlockNumber,
      txHash,
      timestamp: new Date().toISOString(),
      eventType: 'EMERGENCY_FREEZE',
      actorDid,
      actorName: enactedBy,
      details: `GLOBAL EMERGENCY FREEZE ${this.isGlobalLockdown ? 'ENGAGED' : 'LIFTED'}. Rationale: ${reason}`,
      verifiedOnChain: true,
    });

    return this.isGlobalLockdown;
  }

  addPasskey(name: string, deviceType: string) {
    const newPk: PasskeyRecord = {
      id: `pk-0${this.passkeys.length + 1}`,
      friendlyName: name,
      credentialId: `cred_${Math.random().toString(36).substring(2, 10)}_bel`,
      aaguid: '00000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14),
      deviceType,
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Never',
    };
    this.passkeys.push(newPk);
    return newPk;
  }

  removePasskey(id: string) {
    this.passkeys = this.passkeys.filter(p => p.id !== id);
  }
}

export const mockStore = new MockDataStore();
