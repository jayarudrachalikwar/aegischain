import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockStore } from '../api/mockAdapter';

interface BlockchainContextType {
  blockNumber: number;
  tps: number;
  chainName: string;
  networkStatus: 'SYNCED' | 'MINING' | 'LOCKED';
  contractAddress: string;
  consensus: string;
  peersCount: number;
  incrementBlock: () => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const BlockchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blockNumber, setBlockNumber] = useState(mockStore.currentBlockNumber);
  const [tps, setTps] = useState(14.8);

  useEffect(() => {
    // Subtle realistic block heartbeat in permissioned Fabric network
    const interval = setInterval(() => {
      setBlockNumber(prev => {
        const next = prev + 1;
        mockStore.currentBlockNumber = next;
        return next;
      });
      setTps(+(12 + Math.random() * 5).toFixed(1));
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const incrementBlock = () => {
    setBlockNumber(prev => {
      const next = prev + 1;
      mockStore.currentBlockNumber = next;
      return next;
    });
  };

  return (
    <BlockchainContext.Provider
      value={{
        blockNumber,
        tps,
        chainName: 'Hyperledger Fabric (simulated)',
        networkStatus: mockStore.isGlobalLockdown ? 'LOCKED' : 'SYNCED',
        contractAddress: 'chaincode: aegis (planned)',
        consensus: 'Raft ordering (simulated)',
        peersCount: 2,
        incrementBlock,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) throw new Error('useBlockchain must be used within a BlockchainProvider');
  return context;
};
