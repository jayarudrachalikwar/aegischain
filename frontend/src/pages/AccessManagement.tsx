import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, Trash2, Clock, AlertTriangle, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { apiClient } from '../api/client';
import { AccessGrant } from '../api/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge, ClassificationBadge } from '../components/common/Badge';
import { formatTimestamp } from '../utils/formatters';

export const AccessManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { isGlobalLockdown, toggleLockdown } = useAlerts();

  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Revoke modal
  const [selectedGrant, setSelectedGrant] = useState<AccessGrant | null>(null);
  const [revokeReason, setRevokeReason] = useState('Standard operational rotation / Task concluded.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadGrants();
  }, []);

  const loadGrants = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.grants.listGrants();
      setGrants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrant) return;

    setIsProcessing(true);
    try {
      await apiClient.grants.revokeGrant(
        selectedGrant.id,
        currentUser?.did || 'did:aegis:bel:sec:operator',
        currentUser?.displayName || 'Authorized Officer',
        revokeReason
      );

      setFeedback(`Grant for "${selectedGrant.userName}" revoked immediately. Smart contract ACL updated.`);
      setSelectedGrant(null);
      await loadGrants();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeGrants = grants.filter(g => g.status === 'ACTIVE');
  const inactiveGrants = grants.filter(g => g.status !== 'ACTIVE');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b-2 border-secure-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
              ZERO-TRUST ACCESS MANAGEMENT //
            </span>
            <Badge variant="navy">TIME-BOUND GRANTS</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Active Permissions & Instant Revocation
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Enforce least privilege: grants expire automatically; manual revocations take effect in &lt;1 second
          </p>
        </div>

        {/* Emergency Freeze Button */}
        <Button
          variant={isGlobalLockdown ? 'success' : 'danger'}
          leftIcon={isGlobalLockdown ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          onClick={() => toggleLockdown(isGlobalLockdown ? 'Lockdown lifted by Security Officer' : 'Manual emergency freeze enacted')}
        >
          {isGlobalLockdown ? 'LIFT GLOBAL FREEZE' : 'ENGAGE EMERGENCY FREEZE'}
        </Button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border-l-4 border-verification-green text-stone-900 font-mono text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-800 text-xs">✕</button>
        </div>
      )}

      {/* Global Lockdown Status Box */}
      {isGlobalLockdown && (
        <div className="p-4 bg-red-950 border-2 border-signal-red text-warm-white font-mono text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-signal-red flex-shrink-0" />
            <div>
              <p className="font-bold text-sm uppercase text-signal-red">EMERGENCY DEFENCE LOCKDOWN IN EFFECT</p>
              <p className="text-stone-300">All cryptographic asset decrypt keys and downloads are currently blocked across the consortium.</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Grants Table */}
      <Card
        title={`ACTIVE TIME-LIMITED ACCESS GRANTS (${activeGrants.length})`}
        badge={<Badge variant="green">LIVE ON-CHAIN</Badge>}
        theme="white"
      >
        {isLoading ? (
          <div className="p-12 text-center font-mono text-xs text-stone-500">
            SYNCING ACCESS CONTROL LIST FROM SMART CONTRACT...
          </div>
        ) : activeGrants.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-stone-500">
            NO ACTIVE ACCESS GRANTS CURRENTLY ISSUED
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-secure-black bg-stone-100 text-stone-700 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Asset Target</th>
                  <th className="py-2.5 px-3">Authorized Identity</th>
                  <th className="py-2.5 px-3">Permission</th>
                  <th className="py-2.5 px-3">Smart Contract Expiry</th>
                  <th className="py-2.5 px-3 text-right">Revocation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {activeGrants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-parchment/40 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-bel-navy block">{grant.assetName}</span>
                      <ClassificationBadge classification={grant.assetClassification} className="mt-1" />
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-stone-800 block">{grant.userName}</span>
                      <span className="text-[10px] text-stone-500 truncate block max-w-[160px]">{grant.userDid}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-bel-navy text-parchment-light font-bold text-[10px]">
                        {grant.permission}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-stone-800">
                        <Clock className="w-3.5 h-3.5 text-muted-blue" />
                        <span>{formatTimestamp(grant.expiresAt).split(' ')[1]}</span>
                      </div>
                      <span className="text-[10px] text-verification-green font-bold block mt-0.5">AUTO-EXPIRES</span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedGrant(grant)}
                      >
                        Revoke Now
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Revocation & Expired History */}
      <Card title={`EXPIRED & REVOKED GRANTS ARCHIVE (${inactiveGrants.length})`} badge={<Badge variant="default">HISTORICAL</Badge>} theme="parchment">
        <div className="space-y-2 font-mono text-xs">
          {inactiveGrants.map((g) => (
            <div key={g.id} className="p-2.5 bg-warm-white border border-black/15 flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-800">{g.assetName}</span>
                <span className="text-[11px] text-stone-500 block">
                  Actor: {g.userName} · Permission: {g.permission} · Granted: {formatTimestamp(g.grantedAt).split(' ')[0]}
                </span>
                {g.revocationReason && (
                  <span className="text-[10px] text-signal-red italic block mt-0.5">
                    Reason: {g.revocationReason}
                  </span>
                )}
              </div>
              <Badge variant={g.status === 'REVOKED' ? 'red' : 'default'}>
                {g.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal: Instant Revocation Dialog */}
      <Modal
        isOpen={!!selectedGrant}
        onClose={() => setSelectedGrant(null)}
        title="INSTANT ACCESS REVOCATION"
        subtitle={`Revoke grant for ${selectedGrant?.userName}`}
      >
        <form onSubmit={handleRevoke} className="space-y-4">
          <div className="p-3 bg-red-50 border border-signal-red text-signal-red font-mono text-xs space-y-1">
            <p className="font-bold">CAUTION: INSTANT ON-CHAIN REVOCATION</p>
            <p className="text-stone-700">The smart contract will immediately cancel this grant token. All subsequent download and decrypt attempts will be blocked.</p>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-xs uppercase font-bold text-inherit tracking-wider">
              Reason for Revocation *
            </label>
            <textarea
              rows={3}
              required
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-warm-white text-secure-black border-[1.5px] border-secure-black shadow-ink-sm focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setSelectedGrant(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={isProcessing}>
              Confirm & Revoke On-Chain
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
