import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck, Zap, Lock, Unlock, RefreshCw } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { SecurityAlert } from '../api/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatTimestamp, formatRelativeTime } from '../utils/formatters';

export const SecurityAlerts: React.FC = () => {
  const { alerts, unresolvedCount, isGlobalLockdown, toggleLockdown, resolveAlert, triggerSimulatedTamperAlert, triggerBulkDownloadAlert } = useAlerts();
  const { currentUser, role } = useAuth();

  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [resolutionNote, setResolutionNote] = useState('Reviewed audit trail; verified payload isolation.');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    setIsProcessing(true);
    try {
      await resolveAlert(selectedAlert.id);
      setSelectedAlert(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b-2 border-secure-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
              CYBER DEFENCE & INCIDENT RESPONSE //
            </span>
            <Badge variant="red">{unresolvedCount} ACTIVE INCIDENTS</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Zero-Trust Security Telemetry
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Real-time detection of off-chain file tampering, hash mismatches, and bulk download anomalies
          </p>
        </div>

        {/* Quick Simulation Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Zap className="w-3.5 h-3.5" />}
            onClick={() => triggerSimulatedTamperAlert(
              'ast-9921',
              'X-Band AESA Radar Pulse Timing Matrix v4',
              '9f3ac1d200482b45e89a62bc34107e3f89012345bc89fa0124de56789abcdef9',
              '9f3ac1d200482b45e89a62bc34107e3f89012345bc89fa0124de56789abcdef0'
            )}
          >
            Simulate Tamper Violation
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
            onClick={() => triggerBulkDownloadAlert(currentUser?.did || 'did:aegis:bel:operator', 6)}
          >
            Simulate Bulk Attack
          </Button>
        </div>
      </div>

      {/* Global Lockdown Banner */}
      {isGlobalLockdown && (
        <Card theme="navy" className="border-signal-red">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-signal-red flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-mono text-sm font-bold uppercase text-signal-red tracking-wider">
                  DEFENCE LOCKDOWN ENGAGED ACROSS CONSORTIUM
                </h3>
                <p className="font-mono text-xs text-stone-300 mt-0.5">
                  Automated defence response triggered: asset downloads and decryption pipelines are frozen.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toggleLockdown('Manual clearance by Security Officer')}
            >
              Lift Lockdown (SOC)
            </Button>
          </div>
        </Card>
      )}

      {/* Incident Cards List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card theme="white">
            <div className="p-8 text-center font-mono text-xs text-stone-500">
              NO SECURITY ALERTS RECORDED · CONSORTIUM SECURE
            </div>
          </Card>
        ) : (
          alerts.map((alt) => (
            <Card
              key={alt.id}
              theme="white"
              className={alt.resolved ? 'opacity-70' : 'border-l-4 border-l-signal-red'}
            >
              <div className="space-y-3 font-mono text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 font-bold uppercase text-[10px] tracking-wider ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-signal-red text-warm-white'
                          : alt.severity === 'HIGH'
                          ? 'bg-amber-600 text-warm-white'
                          : 'bg-bel-navy text-parchment-light'
                      }`}
                    >
                      {alt.severity} · {alt.alertType}
                    </span>
                    {alt.assetName && (
                      <span className="font-bold text-bel-navy truncate">{alt.assetName}</span>
                    )}
                  </div>

                  <span className="text-[11px] text-stone-500">
                    {formatRelativeTime(alt.timestamp)} ({formatTimestamp(alt.timestamp).split(' ')[1]})
                  </span>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 text-stone-800 leading-relaxed">
                  {alt.details}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-stone-500 pt-1">
                  <div>
                    <span>Actor: <strong className="text-stone-700">{alt.actorName}</strong> ({alt.actorDid})</span>
                    <span className="block text-[10px] text-stone-400 mt-0.5">Enforced Action: {alt.actionTaken}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {alt.resolved ? (
                      <span className="stamp-verified text-[10px]">RESOLVED BY {alt.resolvedBy}</span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-verification-green" />}
                        onClick={() => setSelectedAlert(alt)}
                      >
                        Acknowledge & Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Acknowledge Alert */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="ACKNOWLEDGE & RESOLVE SECURITY INCIDENT"
        subtitle={`Incident Ref: ${selectedAlert?.id} · ${selectedAlert?.alertType}`}
      >
        <form onSubmit={handleConfirmResolve} className="space-y-4">
          <div className="p-3 bg-stone-100 border border-stone-300 font-mono text-xs space-y-1">
            <p><strong>Incident Type:</strong> {selectedAlert?.alertType}</p>
            <p><strong>Actor:</strong> {selectedAlert?.actorName} ({selectedAlert?.actorDid})</p>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-xs uppercase font-bold text-inherit tracking-wider">
              SOC Investigation & Resolution Notes *
            </label>
            <textarea
              rows={3}
              required
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-warm-white text-secure-black border-[1.5px] border-secure-black shadow-ink-sm focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setSelectedAlert(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isProcessing}>
              Confirm Resolution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
