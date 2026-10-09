import React, { createContext, useContext, useState, useEffect } from 'react';
import { SecurityAlert } from '../api/types';
import { mockStore } from '../api/mockAdapter';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

interface AlertContextType {
  alerts: SecurityAlert[];
  unresolvedCount: number;
  isGlobalLockdown: boolean;
  toggleLockdown: (reason: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  triggerSimulatedTamperAlert: (assetId: string, assetName: string, computed: string, expected: string) => void;
  triggerBulkDownloadAlert: (actorDid: string, count: number) => void;
  refreshAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(mockStore.getAlerts());
  const [isGlobalLockdown, setIsGlobalLockdown] = useState<boolean>(mockStore.isGlobalLockdown);
  const { currentUser } = useAuth();

  const refreshAlerts = () => {
    setAlerts([...mockStore.getAlerts()]);
    setIsGlobalLockdown(mockStore.isGlobalLockdown);
  };

  const toggleLockdown = async (reason: string) => {
    const enactedBy = currentUser?.displayName || 'Security Operator';
    const actorDid = currentUser?.did || 'did:aegis:sec:operator';
    const newState = await apiClient.alerts.toggleLockdown(enactedBy, actorDid, reason);
    setIsGlobalLockdown(newState);
    refreshAlerts();
  };

  const resolveAlert = async (id: string) => {
    const resolver = currentUser?.displayName || 'Security Officer';
    await apiClient.alerts.resolveAlert(id, resolver);
    refreshAlerts();
  };

  const triggerSimulatedTamperAlert = (assetId: string, assetName: string, computed: string, expected: string) => {
    mockStore.recordSecurityIncident({
      severity: 'CRITICAL',
      alertType: 'INTEGRITY_MISMATCH',
      actorDid: currentUser?.did || 'did:aegis:client:local',
      actorName: currentUser?.displayName || 'Active Session',
      assetId,
      assetName,
      details: `Cryptographic integrity verification failed! Computed SHA-256: ${computed.slice(0, 16)}... != On-Chain anchor: ${expected.slice(0, 16)}...`,
      actionTaken: 'Zero-trust download gate blocked payload decryption and alerted SOC.',
    });
    refreshAlerts();
  };

  const triggerBulkDownloadAlert = (actorDid: string, count: number) => {
    mockStore.recordSecurityIncident({
      severity: 'HIGH',
      alertType: 'BULK_DOWNLOAD_ATTEMPT',
      actorDid,
      actorName: currentUser?.displayName || 'Actor',
      details: `Automated threshold exceeded: ${count} rapid download attempts recorded in under 60 seconds.`,
      actionTaken: 'Automatic temporary lockdown enacted. Credentials suspended.',
    });
    mockStore.isGlobalLockdown = true;
    refreshAlerts();
  };

  const unresolvedCount = alerts.filter(a => !a.resolved).length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        unresolvedCount,
        isGlobalLockdown,
        toggleLockdown,
        resolveAlert,
        triggerSimulatedTamperAlert,
        triggerBulkDownloadAlert,
        refreshAlerts,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlerts must be used within an AlertProvider');
  return context;
};
