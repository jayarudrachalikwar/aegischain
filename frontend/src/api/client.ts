import { mockStore } from './mockAdapter';
import { User, Asset, AccessRequest, AccessGrant, AuditLog, SecurityAlert, PasskeyRecord, UserRole } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

// Helper for simulated latency in demo mode
const simulateLatency = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

export const apiClient = {
  // Authentication & Passkey API
  auth: {
    async loginWithPasskey(username: string): Promise<{ user: User; token: string; requiresMfa: boolean }> {
      if (IS_DEMO_MODE) {
        await simulateLatency();
        const user = mockStore.getUsers().find(u => u.username === username) || mockStore.getUsers()[0];
        return {
          user,
          token: `aegis_jwt_demo_${user.role.toLowerCase()}_${Date.now()}`,
          requiresMfa: user.totpEnabled,
        };
      }

      const res = await fetch(`${API_BASE_URL}/auth/passkey/login-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error('Passkey verification failed');
      return res.json();
    },

    async verifyTotp(code: string, username: string): Promise<{ verified: boolean; user: User }> {
      if (IS_DEMO_MODE) {
        await simulateLatency();
        // Demo mode accepts any 6-digit code or specific demo codes
        if (!/^\d{6}$/.test(code)) {
          throw new Error('TOTP code must be 6 numeric digits');
        }
        const user = mockStore.getUsers().find(u => u.username === username) || mockStore.getUsers()[0];
        return { verified: true, user };
      }

      const res = await fetch(`${API_BASE_URL}/auth/totp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, username }),
      });
      if (!res.ok) throw new Error('Invalid TOTP token');
      return res.json();
    },

    async getPasskeys(): Promise<PasskeyRecord[]> {
      if (IS_DEMO_MODE) {
        await simulateLatency(100);
        return mockStore.getPasskeys();
      }
      const res = await fetch(`${API_BASE_URL}/auth/passkeys`);
      return res.json();
    },

    async registerPasskey(name: string, deviceType: string): Promise<PasskeyRecord> {
      if (IS_DEMO_MODE) {
        await simulateLatency();
        return mockStore.addPasskey(name, deviceType);
      }
      const res = await fetch(`${API_BASE_URL}/auth/passkeys/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, deviceType }),
      });
      return res.json();
    },

    async removePasskey(id: string): Promise<void> {
      if (IS_DEMO_MODE) {
        await simulateLatency();
        mockStore.removePasskey(id);
        return;
      }
      await fetch(`${API_BASE_URL}/auth/passkeys/${id}`, { method: 'DELETE' });
    }
  },

  // Assets & Custody API
  assets: {
    async listAssets(): Promise<Asset[]> {
      if (IS_DEMO_MODE) {
        await simulateLatency(120);
        return mockStore.getAssets();
      }
      const res = await fetch(`${API_BASE_URL}/assets`);
      return res.json();
    },

    async getAssetById(id: string): Promise<Asset | undefined> {
      if (IS_DEMO_MODE) {
        await simulateLatency(80);
        return mockStore.getAssetById(id);
      }
      const res = await fetch(`${API_BASE_URL}/assets/${id}`);
      if (!res.ok) return undefined;
      return res.json();
    },

    async registerAsset(assetData: Omit<Asset, 'id' | 'onChainTokenId' | 'onChainTxHash' | 'blockNumber' | 'createdAt' | 'integrityStatus'>): Promise<Asset> {
      if (IS_DEMO_MODE) {
        await simulateLatency(350);
        return mockStore.addAsset(assetData);
      }
      const res = await fetch(`${API_BASE_URL}/assets/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData),
      });
      return res.json();
    }
  },

  // Access Requests & Governance API
  requests: {
    async listRequests(): Promise<AccessRequest[]> {
      if (IS_DEMO_MODE) {
        await simulateLatency(100);
        return mockStore.getRequests();
      }
      const res = await fetch(`${API_BASE_URL}/access/requests`);
      return res.json();
    },

    async submitRequest(req: {
      assetId: string;
      requesterId: string;
      requesterName: string;
      requesterDid: string;
      permission: 'READ' | 'DOWNLOAD' | 'CUSTODY';
      durationHours: number;
      justification: string;
      isEmergency: boolean;
    }): Promise<AccessRequest> {
      if (IS_DEMO_MODE) {
        await simulateLatency(250);
        return mockStore.createAccessRequest(req);
      }
      const res = await fetch(`${API_BASE_URL}/access/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      return res.json();
    },

    async reviewRequest(requestId: string, decision: 'APPROVED' | 'REJECTED', reviewerName: string, reviewerDid: string, reviewNote?: string): Promise<AccessRequest> {
      if (IS_DEMO_MODE) {
        await simulateLatency(250);
        return mockStore.reviewAccessRequest(requestId, decision, reviewerName, reviewerDid, reviewNote);
      }
      const res = await fetch(`${API_BASE_URL}/access/approvals/${requestId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reviewNote }),
      });
      return res.json();
    }
  },

  // Active Grants API
  grants: {
    async listGrants(): Promise<AccessGrant[]> {
      if (IS_DEMO_MODE) {
        await simulateLatency(100);
        return mockStore.getGrants();
      }
      const res = await fetch(`${API_BASE_URL}/access/grants`);
      return res.json();
    },

    async revokeGrant(grantId: string, revokerDid: string, revokerName: string, reason: string): Promise<AccessGrant> {
      if (IS_DEMO_MODE) {
        await simulateLatency(200);
        return mockStore.revokeGrant(grantId, revokerDid, revokerName, reason);
      }
      const res = await fetch(`${API_BASE_URL}/access/grants/${grantId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return res.json();
    }
  },

  // Audit Logs API
  audit: {
    async getLogs(): Promise<AuditLog[]> {
      if (IS_DEMO_MODE) {
        await simulateLatency(120);
        return mockStore.getAuditLogs();
      }
      const res = await fetch(`${API_BASE_URL}/audit/logs`);
      return res.json();
    }
  },

  // Security Incident & Alerts API
  alerts: {
    async getAlerts(): Promise<SecurityAlert[]> {
      if (IS_DEMO_MODE) {
        await simulateLatency(100);
        return mockStore.getAlerts();
      }
      const res = await fetch(`${API_BASE_URL}/security/alerts`);
      return res.json();
    },

    async recordAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<SecurityAlert> {
      if (IS_DEMO_MODE) {
        return mockStore.recordSecurityIncident(alert);
      }
      const res = await fetch(`${API_BASE_URL}/security/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
      return res.json();
    },

    async resolveAlert(alertId: string, resolvedBy: string): Promise<SecurityAlert | undefined> {
      if (IS_DEMO_MODE) {
        await simulateLatency(150);
        return mockStore.resolveAlert(alertId, resolvedBy);
      }
      const res = await fetch(`${API_BASE_URL}/security/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedBy }),
      });
      return res.json();
    },

    async toggleLockdown(enactedBy: string, actorDid: string, reason: string): Promise<boolean> {
      if (IS_DEMO_MODE) {
        await simulateLatency(200);
        return mockStore.toggleGlobalLockdown(enactedBy, actorDid, reason);
      }
      const res = await fetch(`${API_BASE_URL}/security/lockdown/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justification: reason }),
      });
      const data = await res.json();
      return data.status === 'ENFORCED';
    },

    isGlobalLockdownEngaged(): boolean {
      return mockStore.isGlobalLockdown;
    }
  },

  // Users Directory API
  users: {
    async getUsers(): Promise<User[]> {
      if (IS_DEMO_MODE) {
        await simulateLatency(80);
        return mockStore.getUsers();
      }
      const res = await fetch(`${API_BASE_URL}/users`);
      return res.json();
    },

    async updateUserRole(userId: string, newRole: UserRole): Promise<User | undefined> {
      if (IS_DEMO_MODE) {
        await simulateLatency(150);
        const user = mockStore.getUsers().find(u => u.id === userId);
        if (user) {
          user.role = newRole;
        }
        return user;
      }
      const res = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      return res.json();
    }
  }
};
