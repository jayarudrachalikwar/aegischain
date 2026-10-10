import React, { useState, useEffect } from 'react';
import { CheckSquare, Check, X, ShieldAlert, Clock, User, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { apiClient } from '../api/client';
import { AccessRequest } from '../api/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge, ClassificationBadge } from '../components/common/Badge';
import { formatRelativeTime } from '../utils/formatters';

export const ApprovalPanel: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { incrementBlock } = useBlockchain();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review Modal state
  const [activeModalRequest, setActiveModalRequest] = useState<AccessRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.requests.listRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReview = (req: AccessRequest, decision: 'APPROVED' | 'REJECTED') => {
    setActiveModalRequest(req);
    setReviewDecision(decision);
    setReviewNote(decision === 'APPROVED' ? 'Approved under operational mandate.' : 'Insufficient clearance for this payload.');
  };

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalRequest) return;

    setIsProcessing(true);
    try {
      await apiClient.requests.reviewRequest(
        activeModalRequest.id,
        reviewDecision,
        currentUser?.displayName || 'Dr. Anita Deshmukh',
        currentUser?.did || 'did:aegis:bel:mgr:adeshmukh',
        reviewNote
      );

      incrementBlock();
      setFeedback(`Request ${activeModalRequest.id} marked as ${reviewDecision}. On-chain transaction committed.`);
      setActiveModalRequest(null);
      await loadRequests();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingList = requests.filter(r => r.status === 'PENDING');
  const reviewedList = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b-2 border-secure-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
              MANAGER & GOVERNANCE //
            </span>
            <Badge variant="navy">DUAL-SIGN CLEARANCE</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Access Approval Queue
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Authorize or reject time-limited access grants. Smart contracts enforce expiry timestamps.
          </p>
        </div>

        {['MANAGER', 'ADMIN'].includes(role) ? (
          <Badge variant="green">AUTHORIZED REVIEWER ({role})</Badge>
        ) : (
          <Badge variant="amber">READ-ONLY SIMULATION MODE</Badge>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border-l-4 border-verification-green text-stone-900 font-mono text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-800 text-xs">✕</button>
        </div>
      )}

      {/* Pending Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-bel-navy">
          <span>Pending Authorizations ({pendingList.length})</span>
          <span className="text-[10px] text-stone-500 font-normal">Awaiting Manager Digital Signature</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center font-mono text-xs text-stone-500">
            LOADING REQUEST QUEUE...
          </div>
        ) : pendingList.length === 0 ? (
          <Card theme="white">
            <div className="text-center py-8 font-mono text-xs text-stone-500">
              NO PENDING ACCESS REQUESTS IN QUEUE
            </div>
          </Card>
        ) : (
          pendingList.map((req) => (
            <Card key={req.id} theme="white" className="hover:border-bel-navy transition-colors">
              <div className="space-y-3 font-mono text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-2">
                  <div className="flex items-center gap-2">
                    <ClassificationBadge classification={req.assetClassification} />
                    <span className="font-bold text-bel-navy text-sm">{req.assetName}</span>
                    {req.isEmergency && (
                      <span className="px-1.5 py-0.2 bg-signal-red text-warm-white text-[10px] font-bold animate-pulse">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500">{formatRelativeTime(req.submittedAt)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-stone-50 p-2.5 border border-stone-200 text-[11px]">
                  <div>
                    <span className="text-stone-500 uppercase block text-[10px]">REQUESTER:</span>
                    <span className="font-bold text-stone-800">{req.requesterName}</span>
                    <span className="text-[10px] text-stone-500 block truncate">{req.requesterDid}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase block text-[10px]">PERMISSION:</span>
                    <span className="font-bold text-bel-navy">{req.permission}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase block text-[10px]">REQUESTED DURATION:</span>
                    <span className="font-bold text-stone-800">{req.durationHours} Hours</span>
                  </div>
                </div>

                <div>
                  <span className="text-stone-500 uppercase text-[10px] block mb-0.5">OPERATIONAL JUSTIFICATION:</span>
                  <p className="p-2 bg-black/5 border border-black/10 text-stone-800 italic">
                    "{req.justification}"
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-signal-red text-signal-red hover:bg-red-50"
                    leftIcon={<X className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenReview(req, 'REJECTED')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenReview(req, 'APPROVED')}
                  >
                    Approve & Issue Grant
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Reviewed Requests Archive */}
      <div className="space-y-3 pt-6 border-t-2 border-secure-black">
        <h3 className="font-mono text-xs font-bold uppercase text-stone-700">
          Recent Decision History ({reviewedList.length})
        </h3>
        <div className="space-y-2 font-mono text-xs">
          {reviewedList.slice(0, 5).map((req) => (
            <div key={req.id} className="p-2.5 bg-warm-white border border-black/15 flex items-center justify-between">
              <div>
                <span className="font-bold text-bel-navy">{req.assetName}</span>
                <span className="text-stone-500 text-[11px] block">
                  {req.requesterName} · {req.permission} ({req.durationHours}h) · Reviewer: {req.reviewerName}
                </span>
              </div>
              <Badge variant={req.status === 'APPROVED' ? 'green' : 'red'}>
                {req.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Confirm Review Decision */}
      <Modal
        isOpen={!!activeModalRequest}
        onClose={() => setActiveModalRequest(null)}
        title={reviewDecision === 'APPROVED' ? 'APPROVE ACCESS GRANT' : 'REJECT ACCESS REQUEST'}
        subtitle={`Smart contract transaction for ${activeModalRequest?.assetName}`}
      >
        <form onSubmit={handleConfirmDecision} className="space-y-4">
          <div className="p-3 bg-stone-100 border border-stone-300 font-mono text-xs space-y-1">
            <p><strong>Requester:</strong> {activeModalRequest?.requesterName}</p>
            <p><strong>Permission:</strong> {activeModalRequest?.permission} ({activeModalRequest?.durationHours} Hours)</p>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-xs uppercase font-bold text-inherit tracking-wider">
              {reviewDecision === 'APPROVED' ? 'Approval Audit Note' : 'Rejection Rationale *'}
            </label>
            <textarea
              rows={3}
              required
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-warm-white text-secure-black border-[1.5px] border-secure-black shadow-ink-sm focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>

          <div className="p-2 bg-black/5 font-mono text-[10px] text-stone-500">
            Transaction will be signed by DID: <code className="text-bel-navy font-bold">{currentUser?.did}</code>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setActiveModalRequest(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewDecision === 'APPROVED' ? 'primary' : 'danger'}
              isLoading={isProcessing}
            >
              Confirm {reviewDecision}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
