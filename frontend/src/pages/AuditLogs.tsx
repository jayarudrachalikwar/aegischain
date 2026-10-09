import React, { useState, useEffect } from 'react';
import { History, Search, Download, ShieldCheck, Filter, ArrowUpRight, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBlockchain } from '../context/BlockchainContext';
import { apiClient } from '../api/client';
import { AuditLog, AuditEventType } from '../api/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { HashDisplay } from '../components/common/HashDisplay';
import { formatTimestamp } from '../utils/formatters';

export const AuditLogs: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { blockNumber } = useBlockchain();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.audit.getLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedEventType !== 'ALL' && log.eventType !== selectedEventType) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchActor = log.actorName.toLowerCase().includes(q) || log.actorDid.toLowerCase().includes(q);
      const matchTx = log.txHash.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchAsset = log.targetAssetName?.toLowerCase().includes(q);
      return matchActor || matchTx || matchDetails || matchAsset;
    }
    return true;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aegischain_besu_audit_ledger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['BlockNumber', 'Timestamp', 'EventType', 'ActorName', 'ActorDID', 'TargetAsset', 'Details', 'TxHash'];
    const rows = filteredLogs.map(l => [
      l.blockNumber,
      l.timestamp,
      l.eventType,
      `"${l.actorName.replace(/"/g, '""')}"`,
      l.actorDid,
      `"${(l.targetAssetName || '').replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.txHash
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aegischain_audit_compliance_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b-2 border-secure-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
              INDEPENDENT DEFENCE AUDIT //
            </span>
            <Badge variant="navy">BESU L2 CONSORTIUM</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Immutable Audit Trail
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Tamper-proof on-chain record of every asset mint, access grant, revocation, and download event
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportJSON}
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-warm-white p-3 border-[1.5px] border-secure-black shadow-ink-sm">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by actor DID, asset name, or transaction hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-white border border-secure-black focus:outline-none focus:ring-1 focus:ring-signal-red"
          />
        </div>

        <select
          value={selectedEventType}
          onChange={(e) => setSelectedEventType(e.target.value)}
          className="px-3 py-1.5 text-xs font-mono bg-white border border-secure-black focus:outline-none focus:ring-1 focus:ring-signal-red"
        >
          <option value="ALL">ALL EVENT TYPES</option>
          <option value="ASSET_MINTED">ASSET_MINTED</option>
          <option value="ACCESS_REQUESTED">ACCESS_REQUESTED</option>
          <option value="ACCESS_GRANTED">ACCESS_GRANTED</option>
          <option value="ACCESS_REVOKED">ACCESS_REVOKED</option>
          <option value="DOWNLOAD_VERIFIED">DOWNLOAD_VERIFIED</option>
          <option value="INTEGRITY_MISMATCH">INTEGRITY_MISMATCH</option>
          <option value="BULK_LOCKDOWN">BULK_LOCKDOWN</option>
          <option value="EMERGENCY_FREEZE">EMERGENCY_FREEZE</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <Card theme="white">
        {isLoading ? (
          <div className="p-12 text-center font-mono text-xs text-stone-500">
            CONNECTING TO HYPERLEDGER BESU AUDIT LEDGER...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-stone-500">
            NO AUDIT LOGS MATCHING QUERY
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-secure-black bg-stone-100 text-stone-700 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Block / Timestamp</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Actor Identity</th>
                  <th className="py-2.5 px-3">Event Details & Target</th>
                  <th className="py-2.5 px-3 text-right">Proof Anchor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-parchment/40 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-bel-navy block">BLOCK #{log.blockNumber}</span>
                      <span className="text-[10px] text-stone-500">{formatTimestamp(log.timestamp)}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider ${
                          log.eventType === 'INTEGRITY_MISMATCH' || log.eventType === 'BULK_LOCKDOWN'
                            ? 'bg-signal-red text-warm-white'
                            : log.eventType === 'DOWNLOAD_VERIFIED'
                            ? 'bg-verification-green text-stone-900'
                            : 'bg-bel-navy text-parchment-light'
                        }`}
                      >
                        {log.eventType}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-stone-800 block">{log.actorName}</span>
                      <span className="text-[10px] text-stone-500 block truncate max-w-[150px]">{log.actorDid}</span>
                    </td>

                    <td className="py-3 px-3">
                      {log.targetAssetName && (
                        <span className="font-bold text-bel-navy block text-[11px] mb-0.5">
                          Target: {log.targetAssetName}
                        </span>
                      )}
                      <p className="text-stone-700 leading-relaxed text-[11px]">{log.details}</p>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="stamp-verified text-[10px] py-0">ON-CHAIN</span>
                        <HashDisplay hash={log.txHash} lead={4} trail={4} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
