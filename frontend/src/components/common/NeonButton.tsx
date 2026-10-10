import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export interface NeonButtonProps {
  children: React.ReactNode;
  as?: 'button' | 'link' | 'a';
  to?: string;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  pill?: boolean;
  neonColor?: string;
  thickness?: number;
  glow?: number;
  speed?: number;
  className?: string;
  onClick?: React.MouseEventHandler;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  target?: string;
  rel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  as = 'button',
  to,
  href,
  variant = 'primary',
  pill = true,
  neonColor,
  className,
  onClick,
  disabled = false,
  type = 'button',
  target,
  rel,
  leftIcon,
  rightIcon,
  style,
  ...rest
}: NeonButtonProps & { style?: React.CSSProperties }) => {
  // Determine neon color based on variant
  const resolvedColor = neonColor || (
    variant === 'danger' ? '#f43f5e' :
    variant === 'secondary' ? '#00E5FF' :
    variant === 'outline' ? '#00E5FF' :
    '#00E5FF' // Electric cyan signature for primary
  );

  // Carefully rounded border radius (smooth pill or rounded-xl)
  const roundedClass = pill ? 'rounded-full' : 'rounded-xl';

  // Base variant styling with crisp neon border (cleanly rounded, no popping animation)
  const variantStyles = {
    primary: 'bg-[#0d0d0d] text-[#ffffff] hover:bg-[#1f1f1f]',
    secondary: 'bg-[#122828] text-[#ffffff] hover:bg-[#1a3838]',
    outline: 'bg-white text-[#0d0d0d] hover:bg-[#f6fbfb]',
    ghost: 'bg-transparent text-[#0d0d0d] hover:bg-black/[0.04]',
    danger: 'bg-[#4c0519] text-[#ffffff] hover:bg-[#881337]',
  };

  const sharedClasses = clsx(
    'relative inline-flex items-center justify-center font-[450] tracking-[0.16px] transition-all duration-200 ease-out select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
    roundedClass,
    variantStyles[variant],
    className
  );

  // Clean neon border that strictly outlines the rounded button without any popping blobs
  const neonStyle: React.CSSProperties = {
    borderColor: resolvedColor,
    borderWidth: '1.5px',
    borderStyle: 'solid',
    boxShadow: `0 0 6px ${resolvedColor}40, inset 0 0 2px ${resolvedColor}20`,
    ...style,
  };

  const content = (
    <span className="relative z-10 inline-flex items-center justify-center gap-2">
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </span>
  );

  if (as === 'link' && to) {
    return (
      <Link to={to} className={sharedClasses} style={neonStyle} onClick={onClick} {...rest}>
        {content}
      </Link>
    );
  }

  if (as === 'a' && href) {
    return (
      <a href={href} className={sharedClasses} style={neonStyle} onClick={onClick} target={target} rel={rel} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={sharedClasses}
      style={neonStyle}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {content}
    </button>
  );
};
