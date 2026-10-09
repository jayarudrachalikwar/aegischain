import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Edit2, CheckCircle2, Lock, Key, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { User, UserRole } from '../api/types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { generateMockDid } from '../utils/crypto';
import { formatTimestamp } from '../utils/formatters';

export const UserManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Issue Identity Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('EMPLOYEE');
  const [newDept, setNewDept] = useState('Radar & Sensor Systems');

  // Edit Role Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<UserRole>('EMPLOYEE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.users.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newDisplayName) return;

    const did = generateMockDid(newRole, newUsername);
    const created: User = {
      id: `usr-00${users.length + 1}`,
      username: newUsername,
      displayName: newDisplayName,
      email: `${newUsername}@aegis.example.com`,
      role: newRole,
      did,
      department: newDept,
      passkeysCount: 1,
      totpEnabled: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, created]);
    setFeedback(`New DID issued for ${newDisplayName}: ${did}`);
    setIsIssueModalOpen(false);
    setNewUsername('');
    setNewDisplayName('');
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      await apiClient.users.updateUserRole(selectedUser.id, editRoleValue);
      setUsers(prev =>
        prev.map(u => (u.id === selectedUser.id ? { ...u, role: editRoleValue } : u))
      );
      setFeedback(`Role for ${selectedUser.displayName} updated to ${editRoleValue}.`);
      setSelectedUser(null);
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
              ADMIN IDENTITY AUTHORITY //
            </span>
            <Badge variant="navy">DID REGISTRY</Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-bel-navy uppercase font-black tracking-tight mt-1">
            Identity & Role Governance
          </h1>
          <p className="font-mono text-xs text-stone-600 mt-1">
            Issue and manage decentralized digital identities (DIDs). Separation of duties: Admins cannot read file payloads.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsIssueModalOpen(true)}
        >
          Issue New Identity DID
        </Button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border-l-4 border-verification-green text-stone-900 font-mono text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-800 text-xs">✕</button>
        </div>
      )}

      {/* Users Directory Table */}
      <Card theme="white">
        {isLoading ? (
          <div className="p-12 text-center font-mono text-xs text-stone-500">
            FETCHING DECENTRALIZED IDENTITY DIRECTORY...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-secure-black bg-stone-100 text-stone-700 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Operator Identity</th>
                  <th className="py-2.5 px-3">Role Code</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Decentralized DID</th>
                  <th className="py-2.5 px-3">Auth Hardware</th>
                  <th className="py-2.5 px-3 text-right">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-parchment/40 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-bel-navy block">{u.displayName}</span>
                      <span className="text-[10px] text-stone-500">{u.department}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-bel-navy text-parchment-light font-bold text-[10px] uppercase">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-stone-700">{u.department}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-stone-800 block truncate max-w-[200px]" title={u.did}>
                        {u.did}
                      </span>
                      <span className="text-[10px] text-verification-green">ON-CHAIN VERIFIED</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-[11px] text-stone-700">
                        <span>{u.passkeysCount} Passkeys</span>
                        <span> · </span>
                        <span className="text-verification-green font-bold">TOTP ON</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedUser(u);
                          setEditRoleValue(u.role);
                        }}
                      >
                        Edit Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Separation of Duties Note */}
      <Card theme="parchment">
        <div className="font-mono text-xs text-stone-800 space-y-1">
          <p className="font-bold text-bel-navy uppercase">SEPARATION OF DUTIES ARCHITECTURE:</p>
          <p>• The Admin role issues and manages cryptographic identities and revokes passkeys.</p>
          <p>• The Admin role has zero authority to approve access grants or decrypt off-chain payloads without an explicit grant from an authorized Manager.</p>
        </div>
      </Card>

      {/* Modal: Issue Identity */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="ISSUE DECENTRALIZED IDENTITY (DID)"
        subtitle="Anchor new cryptographic identity record"
      >
        <form onSubmit={handleIssueIdentity} className="space-y-4">
          <Input
            label="Operator Full Name"
            placeholder="e.g. Commander Rajesh Raman"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            required
            mono
          />

          <Input
            label="System Username / Handle"
            placeholder="e.g. rraman"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
            mono
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assigned Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            >
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="MANAGER">MANAGER</option>
              <option value="AUDITOR">AUDITOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SECURITY_OFFICER">SECURITY_OFFICER</option>
            </Select>

          </div>

          <Select
            label="Department"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
          >
            <option value="Radar & Sensor Systems">Radar & Sensor Systems</option>
            <option value="Electronic Warfare Directorate">Electronic Warfare Directorate</option>
            <option value="Security Operations Center">Security Operations Center</option>
            <option value="Avionics & Missile Guidance">Avionics & Missile Guidance</option>
          </Select>

          <div className="p-3 bg-stone-100 border border-stone-300 font-mono text-xs text-stone-600">
            A private key challenge will be generated for WebAuthn enrollment during the user's initial onboarding.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Issue Identity DID
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Role */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="MODIFY IDENTITY ROLE"
        subtitle={`Update role for ${selectedUser?.displayName}`}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div className="p-3 bg-stone-100 font-mono text-xs space-y-1">
            <p><strong>DID:</strong> {selectedUser?.did}</p>
            <p><strong>Department:</strong> {selectedUser?.department}</p>
          </div>

          <Select
            label="New Role Assignment"
            value={editRoleValue}
            onChange={(e) => setEditRoleValue(e.target.value as UserRole)}
          >
            <option value="EMPLOYEE">EMPLOYEE (Standard Access)</option>
            <option value="MANAGER">MANAGER (Approver)</option>
            <option value="ADMIN">ADMIN (Identity Authority)</option>
            <option value="AUDITOR">AUDITOR (Read-Only Compliance)</option>
            <option value="SECURITY_OFFICER">SECURITY_OFFICER (SOC Incident Lead)</option>
          </Select>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isProcessing}>
              Commit Role Change
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
