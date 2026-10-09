import React from 'react';
import { IS_DEMO_MODE } from '../../api/client';

/** Always-visible notice so nobody mistakes the prototype's simulated features for real security. */
export const DemoBanner: React.FC = () => {
  if (!IS_DEMO_MODE) return null;
  return (
    <div
      role="status"
      className="w-full bg-amber-100 text-amber-950 border-b border-amber-400 px-3 py-1 text-center font-mono text-[11px] font-bold uppercase tracking-wide"
    >
      Prototype · simulated data · login, MFA, encryption and ledger shown here are not real
    </div>
  );
};
