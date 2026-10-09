import React, { useState } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { formatTruncatedHash } from '../../utils/crypto';

interface HashDisplayProps {
  hash: string;
  lead?: number;
  trail?: number;
  full?: boolean;
  label?: string;
  verified?: boolean;
  className?: string;
}

export const HashDisplay: React.FC<HashDisplayProps> = ({
  hash,
  lead = 8,
  trail = 8,
  full = false,
  label,
  verified = true,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const displayString = full ? hash : formatTruncatedHash(hash, lead, trail);

  return (
    <div className={clsx('inline-flex items-center gap-1.5 font-mono text-xs bg-black/5 dark:bg-black/40 px-2 py-1 border border-black/20 dark:border-white/20 select-all group', className)}>
      {label && <span className="text-[10px] text-muted-blue font-bold uppercase tracking-wider">{label}:</span>}
      <span className="tracking-tight text-inherit font-medium break-all">{displayString}</span>
      {verified && (
        <span title="SHA-256 anchored on-chain" className="text-verification-green">
          <ShieldCheck className="w-3.5 h-3.5 inline" />
        </span>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="text-stone-500 hover:text-signal-red p-0.5 ml-0.5 rounded transition-colors focus:outline-none"
        title="Copy full SHA-256 hash"
        aria-label="Copy hash"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-verification-green" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
