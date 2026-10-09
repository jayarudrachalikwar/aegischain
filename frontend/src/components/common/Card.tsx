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
  theme = 'parchment',
  className,
  contentClassName,
  hasCrosshairs = true,
}) => {
  const themeStyles = {
    parchment: 'bg-warm-white/80 text-secure-black border-secure-black',
    navy: 'bg-bel-navy text-parchment-light border-secure-black',
    dark: 'bg-defence-900 text-stone-200 border-defence-border',
    white: 'bg-white text-secure-black border-secure-black',
  };

  return (
    <div
      className={clsx(
        'relative border-[1.5px] shadow-ink transition-all',
        hasCrosshairs && 'technical-corner',
        themeStyles[theme],
        className
      )}
    >
      {(title || badge || headerAction) && (
        <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-inherit bg-black/5">
          <div>
            {title && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase font-bold tracking-wider">{title}</span>
                {badge}
              </div>
            )}
            {subtitle && (
              <p className="text-[11px] font-mono opacity-70 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={clsx('p-4 md:p-5', contentClassName)}>
        {children}
      </div>
    </div>
  );
};
