import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  FileKey,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Lock,
  ArrowUpRight,
  History,
  Activity,
  Cpu,
  KeyRound,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { useAlerts } from '../context/AlertContext';
import { apiClient } from '../api/client';
import { Asset, AccessRequest, AccessGrant, AuditLog } from '../api/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, ClassificationBadge } from '../components/common/Badge';
import { HashDisplay } from '../components/common/HashDisplay';
import { formatRelativeTime, formatBytes } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { blockNumber, tps } = useBlockchain();
  const { alerts, unresolvedCount, isGlobalLockdown } = useAlerts();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [ast, req, grt, aud] = await Promise.all([
        apiClient.assets.listAssets(),
        apiClient.requests.listRequests(),
        apiClient.grants.listGrants(),
        apiClient.audit.getLogs(),
      ]);
      setAssets(ast);
      setRequests(req);
      setGrants(grt);
      setAuditLogs(aud);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const activeGrants = grants.filter(g => g.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Top Banner: Command Eyebrow & Operator Identity */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-secure-black">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
              AEGISCHAIN SECURE COMMAND CENTRE //
            </span>
            <Badge variant="navy">IBFT 2.0 VALIDATED</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Defence Custody Overview
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Active Identity: <span className="font-bold text-bel-navy">{currentUser?.displayName}</span> ({currentUser?.role}) · DID: <span className="font-semibold text-stone-800">{currentUser?.did}</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(role) && (
            <Link to="/upload">
              <Button variant="primary" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
                Upload Asset
              </Button>
            </Link>
          )}

          {['EMPLOYEE', 'MANAGER'].includes(role) && (
            <Link to="/request-access">
              <Button variant="outline" size="sm" leftIcon={<FileKey className="w-4 h-4" />}>
                Request Access
              </Button>
            </Link>
          )}

          {['MANAGER', 'ADMIN'].includes(role) && (
            <Link to="/approvals">
              <Button variant="secondary" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                Approvals ({pendingRequests.length})
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card theme="white">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-stone-500 uppercase tracking-wider">PROTECTED ASSETS</span>
            <Shield className="w-5 h-5 text-bel-navy" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-bel-navy">{assets.length}</span>
            <span className="font-mono text-[11px] text-verification-green font-bold">100% ANCHORED</span>
          </div>
          <p className="font-mono text-[11px] text-stone-500 mt-1">SHA-256 registered on-chain</p>
        </Card>

        {/* Metric 2 */}
        <Card theme="white">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-stone-500 uppercase tracking-wider">ACTIVE GRANTS</span>
            <KeyRound className="w-5 h-5 text-bel-navy" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-bel-navy">{activeGrants.length}</span>
            <span className="font-mono text-[11px] text-stone-600 font-semibold">TIME-BOUND</span>
          </div>
          <p className="font-mono text-[11px] text-stone-500 mt-1">Smart contract auto-expiry</p>
        </Card>

        {/* Metric 3 */}
        <Card theme="white">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-stone-500 uppercase tracking-wider">PENDING APPROVALS</span>
            <FileKey className="w-5 h-5 text-bel-navy" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-black text-bel-navy">{pendingRequests.length}</span>
            {pendingRequests.length > 0 && (
              <span className="font-mono text-[11px] text-signal-red font-bold">ATTENTION</span>
            )}
          </div>
          <p className="font-mono text-[11px] text-stone-500 mt-1">Dual-custody verification</p>
        </Card>

        {/* Metric 4 */}
        <Card theme={unresolvedCount > 0 ? 'white' : 'white'} className={unresolvedCount > 0 ? 'border-signal-red' : ''}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-stone-500 uppercase tracking-wider">SECURITY INCIDENTS</span>
            <AlertTriangle className={`w-5 h-5 ${unresolvedCount > 0 ? 'text-signal-red' : 'text-stone-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`font-mono text-3xl font-black ${unresolvedCount > 0 ? 'text-signal-red' : 'text-bel-navy'}`}>
              {unresolvedCount}
            </span>
            <span className="font-mono text-[11px] text-stone-600 font-semibold">
              {isGlobalLockdown ? 'DEFENCE LOCKDOWN' : 'NORMAL'}
            </span>
          </div>
          <p className="font-mono text-[11px] text-stone-500 mt-1">Zero-trust tamper telemetry</p>
        </Card>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Protected Asset Registry Preview */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title="CRITICAL ASSETS IN CUSTODY"
            badge={<Badge variant="navy">OFF-CHAIN ENCRYPTED</Badge>}
            theme="white"
            headerAction={
              <Link to="/assets" className="font-mono text-xs text-bel-navy hover:text-signal-red font-bold uppercase inline-flex items-center gap-1">
                <span>View All ({assets.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3">
              {assets.slice(0, 4).map((ast) => (
                <div
                  key={ast.id}
                  className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ClassificationBadge classification={ast.classification} />
                      <Link
                        to={`/assets/${ast.id}`}
                        className="font-mono text-xs font-bold text-bel-navy hover:text-signal-red truncate"
                      >
                        {ast.title}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-mono text-stone-500">
                      <span>Token: <strong className="text-stone-700">{ast.onChainTokenId}</strong></span>
                      <span>•</span>
                      <span>Size: {formatBytes(ast.sizeBytes)}</span>
                      <span>•</span>
                      <span>Owner: {ast.ownerName}</span>
                    </div>

                    <div className="mt-1.5">
                      <HashDisplay hash={ast.sha256Hash} lead={6} trail={6} label="SHA-256" />
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Link to={`/assets/${ast.id}`}>
                      <Button variant="outline" size="sm">
                        Verify
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Separation of Duties Compliance Note */}
          <Card theme="parchment">
            <div className="font-mono text-xs text-stone-800 space-y-1.5">
              <div className="flex items-center gap-2 text-bel-navy font-bold uppercase">
                <FileCheck className="w-4 h-4 text-signal-red" />
                <span>BEL Defence Zero-Trust Architectural Compliance</span>
              </div>
              <p className="text-stone-700 leading-relaxed">
                AegisChain enforces cryptographic separation of powers: Identity admins manage DIDs but cannot read file payloads. Managers approve grants without modifying audit logs. Off-chain files are strictly decrypted after client-side SHA-256 match confirmation.
              </p>
            </div>
          </Card>
        </div>

        {/* Right: Real-time Immutable On-Chain Audit Feed */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="BESU AUDIT LEDGER (L2)"
            badge={<Badge variant="default">BLOCK #{blockNumber}</Badge>}
            theme="navy"
            headerAction={
              <Link to="/audit-logs" className="font-mono text-xs text-parchment-light/80 hover:text-warm-white font-bold uppercase inline-flex items-center gap-1">
                <span>Full Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3 font-mono text-xs">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-bel-navy-dark border border-muted-blue/30 text-parchment-light/90 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-blue-light">
                    <span className="font-bold text-warm-white">BLOCK #{log.blockNumber}</span>
                    <span>{formatRelativeTime(log.timestamp)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 font-bold tracking-wider uppercase ${
                        log.eventType === 'INTEGRITY_MISMATCH' || log.eventType === 'BULK_LOCKDOWN'
                          ? 'bg-signal-red text-warm-white'
                          : log.eventType === 'DOWNLOAD_VERIFIED'
                          ? 'bg-verification-green text-stone-900'
                          : 'bg-muted-blue/20 text-warm-white border border-muted-blue/40'
                      }`}
                    >
                      {log.eventType}
                    </span>
                    <span className="text-[11px] truncate text-stone-300">
                      by {log.actorName}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-blue-light leading-relaxed line-clamp-2">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-muted-blue/20 flex items-center justify-between text-[11px] font-mono text-muted-blue-light">
              <span>CONSENSUS: IBFT 2.0</span>
              <span className="text-verification-green font-bold">14.8 TPS</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
