import { SecurityClassification } from '../utils/formatters';
export type { SecurityClassification };

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN' | 'AUDITOR' | 'SECURITY_OFFICER';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  did: string;
  department: string;
  passkeysCount: number;
  totpEnabled: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  createdAt: string;
}

export interface Asset {
  id: string;
  title: string;
  fileName: string;
  classification: SecurityClassification;
  department: string;
  sizeBytes: number;
  sha256Hash: string;
  onChainTokenId: string;
  onChainTxHash: string;
  blockNumber: number;
  ownerDid: string;
  ownerName: string;
  encryptionType: string; // e.g. AES-256-GCM
  keyFingerprint: string;
  createdAt: string;
  integrityStatus: 'VERIFIED' | 'TAMPERED' | 'SUSPECT';
  retentionExpiry: string;
  description: string;
  contentSample?: string;
}

export interface AccessRequest {
  id: string;
  assetId: string;
  assetName: string;
  assetClassification: SecurityClassification;
  requesterId: string;
  requesterName: string;
  requesterDid: string;
  permission: 'READ' | 'DOWNLOAD' | 'CUSTODY';
  durationHours: number;
  justification: string;
  isEmergency: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  submittedAt: string;
  reviewedAt?: string;
  reviewerName?: string;
  reviewNote?: string;
}

export interface AccessGrant {
  id: string;
  assetId: string;
  assetName: string;
  assetClassification: SecurityClassification;
  userDid: string;
  userName: string;
  permission: 'READ' | 'DOWNLOAD' | 'CUSTODY';
  grantedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  revokedAt?: string;
  revocationReason?: string;
  onChainTxHash: string;
}

export type AuditEventType =
  | 'ASSET_MINTED'
  | 'ACCESS_REQUESTED'
  | 'ACCESS_GRANTED'
  | 'ACCESS_REVOKED'
  | 'DOWNLOAD_VERIFIED'
  | 'INTEGRITY_MISMATCH'
  | 'BULK_LOCKDOWN'
  | 'IDENTITY_ISSUED'
  | 'PASSKEY_REGISTERED'
  | 'EMERGENCY_FREEZE';

export interface AuditLog {
  id: string;
  blockNumber: number;
  txHash: string;
  timestamp: string;
  eventType: AuditEventType;
  actorDid: string;
  actorName: string;
  targetAssetId?: string;
  targetAssetName?: string;
  details: string;
  verifiedOnChain: boolean;
}

export interface SecurityAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  alertType: 'INTEGRITY_MISMATCH' | 'BULK_DOWNLOAD_ATTEMPT' | 'TAMPER_DETECTED' | 'UNAUTHORIZED_ACCESS' | 'EMERGENCY_LOCKDOWN';
  timestamp: string;
  actorDid: string;
  actorName: string;
  assetId?: string;
  assetName?: string;
  details: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  actionTaken: string;
}

export interface PasskeyRecord {
  id: string;
  friendlyName: string;
  credentialId: string;
  aaguid: string;
  deviceType: string;
  createdAt: string;
  lastUsedAt: string;
}
