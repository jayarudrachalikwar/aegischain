import { mockStore } from './mockAdapter';
import { User, Asset, AccessRequest, AccessGrant, AuditLog, SecurityAlert, PasskeyRecord, UserRole } from './types';

// Same-origin by default: the dev server proxies /api to the backend (see vite.config.ts), so the
// session cookie is first-party and no CORS is needed. Matches docs/API_CONTRACT.md (base /api/v1).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
// Demo mode (default) uses the in-browser mock store and NEVER contacts the backend.
export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

/** Error shape from docs/API_CONTRACT.md: { error: { code, message, details?, requestId } } */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function csrfToken(): string {
  const m = document.cookie.match(/(?:^|;\s*)aegis_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

/**
 * Real-mode transport: cookie session (credentials: include), CSRF header on mutations,
 * and contract-format error parsing. Not used in demo mode.
 * TODO(M12): endpoint paths and response shapes below still follow the prototype and must be mapped
 * to docs/API_CONTRACT.md (see docs/FRONTEND_INTEGRATION.md for the mapping table).
 */
async function http(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (method !== 'GET' && method !== 'HEAD') {
    const token = csrfToken();
    if (token) headers.set('X-CSRF-Token', token);
  }
  const res = await http(`${path}`, { ...init, headers, credentials: 'include' });
  if (!res.ok) {
    let body: { error?: { code?: string; message?: string; requestId?: string; details?: unknown } } = {};
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    const e = body.error;
    throw new ApiError(res.status, e?.code ?? 'UNKNOWN', e?.message ?? 'Request failed', e?.requestId, e?.details);
  }
  return res;
}

// Helper for simulated latency in demo mode
const simulateLatency = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

export const apiClient = {
  // Authentication & Passkey API
  auth: {
    async loginWithPasskey(username: string): Promise<{ user: User; token: string; requiresMfa: boolean }> {
      if (IS_DEMO_MODE) {
        await simulateLatency();
        const user = mockStore.getUsers().find(u => u.username === username);
        if (!user) throw new Error('Authentication failed');
        return {
          user,
          token: `aegis_jwt_demo_${user.role.toLowerCase()}_${Date.now()}`,
          requiresMfa: user.totpEnabled,
        };
      }

      const res = await http(`/auth/passkey/login-verify`, {
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
        const user = mockStore.getUsers().find(u => u.username === username);
        if (!user) throw new Error('Authentication failed');
        return { verified: true, user };
      }

      const res = await http(`/auth/totp/verify`, {
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
      const res = await http(`/auth/passkeys`);
      return res.json();
    },

    async registerPasskey(name: string, deviceType: string): Promise<PasskeyRecord> {
      if (IS_DEMO_MODE) {
        await simulateLatency();
        return mockStore.addPasskey(name, deviceType);
      }
      const res = await http(`/auth/passkeys/register`, {
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
      await http(`/auth/passkeys/${id}`, { method: 'DELETE' });
    }
  },

  // Assets & Custody API
  assets: {
    async listAssets(): Promise<Asset[]> {
      if (IS_DEMO_MODE) {
        await simulateLatency(120);
        return mockStore.getAssets();
      }
      const res = await http(`/assets`);
      return res.json();
    },

    async getAssetById(id: string): Promise<Asset | undefined> {
      if (IS_DEMO_MODE) {
        await simulateLatency(80);
        return mockStore.getAssetById(id);
      }
      try {
        const res = await http(`/assets/${id}`);
        return res.json();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return undefined;
        throw err;
      }
    },

    async registerAsset(assetData: Omit<Asset, 'id' | 'onChainTokenId' | 'onChainTxHash' | 'blockNumber' | 'createdAt' | 'integrityStatus'>): Promise<Asset> {
      if (IS_DEMO_MODE) {
        await simulateLatency(350);
        return mockStore.addAsset(assetData);
      }
      const res = await http(`/assets/register`, {
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
      const res = await http(`/access/requests`);
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
      const res = await http(`/access/requests`, {
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
      const res = await http(`/access/approvals/${requestId}/decision`, {
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
      const res = await http(`/access/grants`);
      return res.json();
    },

    async revokeGrant(grantId: string, revokerDid: string, revokerName: string, reason: string): Promise<AccessGrant> {
      if (IS_DEMO_MODE) {
        await simulateLatency(200);
        return mockStore.revokeGrant(grantId, revokerDid, revokerName, reason);
      }
      const res = await http(`/access/grants/${grantId}/revoke`, {
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
      const res = await http(`/audit/logs`);
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
      const res = await http(`/security/alerts`);
      return res.json();
    },

    async recordAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<SecurityAlert> {
      if (IS_DEMO_MODE) {
        return mockStore.recordSecurityIncident(alert);
      }
      const res = await http(`/security/alerts`, {
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
      const res = await http(`/security/alerts/${alertId}/resolve`, {
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
      const res = await http(`/security/lockdown/toggle`, {
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
      const res = await http(`/users`);
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
      const res = await http(`/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      return res.json();
    }
  }
};
