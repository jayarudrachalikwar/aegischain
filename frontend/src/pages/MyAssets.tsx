import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, Filter, ShieldCheck, Download, ExternalLink, Plus, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Asset, SecurityClassification } from '../api/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge, ClassificationBadge } from '../components/common/Badge';
import { HashDisplay } from '../components/common/HashDisplay';
import { formatBytes, formatTimestamp } from '../utils/formatters';

export const MyAssets: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'OWNED' | 'AUTHORIZED'>('ALL');

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.assets.listAssets();
      setAssets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssets = assets.filter((ast) => {
    // Tab filter
    if (activeTab === 'OWNED' && ast.ownerDid !== currentUser?.did) {
      return false;
    }
    // Classification filter
    if (selectedClassification !== 'ALL' && ast.classification !== selectedClassification) {
      return false;
    }
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ast.title.toLowerCase().includes(q);
      const matchFile = ast.fileName.toLowerCase().includes(q);
      const matchHash = ast.sha256Hash.toLowerCase().includes(q);
      const matchOwner = ast.ownerName.toLowerCase().includes(q);
      return matchTitle || matchFile || matchHash || matchOwner;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-secure-black">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-signal-red font-bold uppercase tracking-wider">
              ASSET VAULT & REGISTRY //
            </span>
            <Badge variant="navy">NFT-ANCHORED</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Protected Digital Assets
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Encrypted off-chain assets with immutable SHA-256 anchors on Hyperledger Besu
          </p>
        </div>

        {['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(role) && (
          <Link to="/upload">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Seal & Register Asset
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-warm-white p-3 border-[1.5px] border-secure-black shadow-ink-sm">
        {/* Tabs */}
        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 border uppercase font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-bel-navy text-parchment-light border-secure-black'
                : 'bg-warm-white text-stone-700 border-transparent hover:border-black/20'
            }`}
          >
            All Vault Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('OWNED')}
            className={`px-3 py-1.5 border uppercase font-bold transition-all ${
              activeTab === 'OWNED'
                ? 'bg-bel-navy text-parchment-light border-secure-black'
                : 'bg-warm-white text-stone-700 border-transparent hover:border-black/20'
            }`}
          >
            My Uploads
          </button>
          <button
            onClick={() => setActiveTab('AUTHORIZED')}
            className={`px-3 py-1.5 border uppercase font-bold transition-all ${
              activeTab === 'AUTHORIZED'
                ? 'bg-bel-navy text-parchment-light border-secure-black'
                : 'bg-warm-white text-stone-700 border-transparent hover:border-black/20'
            }`}
          >
            Authorized
          </button>
        </div>

        {/* Search & Classification Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by title, file, hash, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-white border border-secure-black focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>

          <select
            value={selectedClassification}
            onChange={(e) => setSelectedClassification(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-white border border-secure-black focus:outline-none focus:ring-1 focus:ring-signal-red"
          >
            <option value="ALL">ALL CLEARANCES</option>
            <option value="TOP_SECRET">TOP SECRET</option>
            <option value="SECRET">SECRET</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="RESTRICTED">RESTRICTED</option>
          </select>
        </div>
      </div>

      {/* Asset Table / List */}
      <Card theme="white">
        {isLoading ? (
          <div className="p-12 text-center font-mono text-xs text-stone-500">
            QUERYING HYPERLEDGER BESU ASSET REGISTRY...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-12 text-center">
            <Lock className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <p className="font-mono text-sm font-bold text-stone-700 uppercase">No matching assets found</p>
            <p className="font-mono text-xs text-stone-500 mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-secure-black bg-stone-100 text-stone-700 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Asset Title & Payload</th>
                  <th className="py-2.5 px-3">Clearance</th>
                  <th className="py-2.5 px-3">On-Chain Token</th>
                  <th className="py-2.5 px-3">Cryptographic SHA-256</th>
                  <th className="py-2.5 px-3">Owner DID</th>
                  <th className="py-2.5 px-3 text-right">Integrity & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredAssets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-parchment/40 transition-colors">
                    <td className="py-3 px-3">
                      <Link
                        to={`/assets/${ast.id}`}
                        className="font-bold text-bel-navy hover:text-signal-red block text-sm leading-tight"
                      >
                        {ast.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-1">
                        <span>{ast.fileName}</span>
                        <span>•</span>
                        <span>{formatBytes(ast.sizeBytes)}</span>
                        <span>•</span>
                        <span>{ast.department}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <ClassificationBadge classification={ast.classification} />
                    </td>

                    <td className="py-3 px-3 font-bold text-stone-800">
                      {ast.onChainTokenId}
                      <span className="block text-[10px] text-stone-400 font-normal">Block #{ast.blockNumber}</span>
                    </td>

                    <td className="py-3 px-3">
                      <HashDisplay hash={ast.sha256Hash} lead={6} trail={6} />
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-stone-800 font-medium block truncate max-w-[140px]" title={ast.ownerDid}>
                        {ast.ownerName}
                      </span>
                      <span className="text-[10px] text-stone-400 truncate block max-w-[140px]">
                        {ast.ownerDid}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/assets/${ast.id}`}>
                          <Button variant="outline" size="sm">
                            Inspect
                          </Button>
                        </Link>
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
