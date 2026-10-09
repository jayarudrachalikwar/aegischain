import React from 'react';
import { clsx } from 'clsx';
import { SecurityClassification } from '../../utils/formatters';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'red' | 'green' | 'navy' | 'stamp-blocked' | 'stamp-verified' | 'amber';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  if (variant === 'stamp-blocked') {
    return <span className={clsx('stamp-blocked', className)}>{children || 'BLOCKED'}</span>;
  }

  if (variant === 'stamp-verified') {
    return <span className={clsx('stamp-verified', className)}>{children || 'VERIFIED'}</span>;
  }

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 tracking-wider',
    sm: 'text-xs px-2 py-0.5 tracking-wider',
    md: 'text-xs px-3 py-1 tracking-widest',
  };

  const variantStyles = {
    default: 'bg-stone-200/80 text-stone-800 border-stone-400',
    outline: 'bg-transparent text-current border-current',
    red: 'bg-signal-red/10 text-signal-red border-signal-red/60',
    green: 'bg-verification-green/20 text-stone-900 border-verification-green',
    navy: 'bg-bel-navy text-parchment-light border-bel-navy',
    amber: 'bg-amber-500/15 text-amber-900 border-amber-600',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-mono uppercase font-semibold border-[1.5px]',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export const ClassificationBadge: React.FC<{ classification: SecurityClassification; className?: string }> = ({
  classification,
  className,
}) => {
  switch (classification) {
    case 'RESTRICTED':
      return (
        <span className={clsx('inline-flex items-center font-mono text-[11px] font-bold px-2 py-0.5 bg-red-950 text-red-300 border border-signal-red tracking-wider uppercase', className)}>
          ● RESTRICTED
        </span>
      );
    case 'CONFIDENTIAL':
      return (
        <span className={clsx('inline-flex items-center font-mono text-[11px] font-bold px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/80 tracking-wider uppercase', className)}>
          ▲ CONFIDENTIAL
        </span>
      );
    case 'INTERNAL':
    default:
      return (
        <span className={clsx('inline-flex items-center font-mono text-[11px] font-medium px-2 py-0.5 bg-stone-200 text-stone-700 border border-stone-400 tracking-wider uppercase', className)}>
          ○ INTERNAL
        </span>
      );
  }
};
