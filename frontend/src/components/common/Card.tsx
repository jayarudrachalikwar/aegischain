import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  theme?: 'parchment' | 'navy' | 'dark' | 'white';
  className?: string;
  contentClassName?: string;
  hasCrosshairs?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  badge,
  headerAction,
  theme = 'white',
  className,
  contentClassName,
}) => {
  const themeStyles = {
    white: 'bg-white text-stone-900 border border-black/[0.08] shadow-xs',
    parchment: 'bg-stone-50/80 text-stone-900 border border-black/[0.08] shadow-xs',
    navy: 'bg-[#0d0d0d] text-white border border-black/[0.12] shadow-xs',
    dark: 'bg-stone-900 text-stone-100 border border-black/[0.12] shadow-xs',
  };

  return (
    <div
      className={clsx(
        'relative rounded-2xl overflow-hidden transition-all',
        themeStyles[theme],
        className
      )}
    >
      {(title || badge || headerAction) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] bg-stone-50/50">
          <div>
            {title && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase font-bold tracking-wider">{title}</span>
                {badge}
              </div>
            )}
            {subtitle && (
              <p className="text-[11px] font-mono text-stone-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={clsx('p-5 md:p-6', contentClassName)}>
        {children}
      </div>
    </div>
  );
};
