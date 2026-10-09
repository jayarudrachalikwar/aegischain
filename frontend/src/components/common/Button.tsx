import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-mono font-bold tracking-wider uppercase transition-all duration-150 active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 border-[1.5px]',
    md: 'text-xs md:text-sm px-4 py-2 gap-2 border-[1.5px]',
    lg: 'text-sm md:text-base px-6 py-3 gap-2.5 border-2',
  };

  // STRICT COMBO 2: #0C2C55, #629FAD, #EDEDCE
  const variantStyles = {
    primary: 'bg-bel-navy hover:bg-bel-navy-light text-parchment border-bel-navy shadow-ink hover:shadow-ink-sm',
    secondary: 'bg-muted-blue hover:bg-muted-blue-light text-bel-navy border-bel-navy shadow-ink hover:shadow-ink-sm',
    outline: 'bg-warm-white hover:bg-parchment-dark text-bel-navy border-bel-navy shadow-ink-sm hover:shadow-none',
    danger: 'bg-bel-navy-dark text-muted-blue hover:bg-bel-navy border-muted-blue shadow-ink-sm',
    ghost: 'bg-transparent hover:bg-bel-navy/10 text-bel-navy border-transparent hover:border-bel-navy/30',
    success: 'bg-muted-blue hover:bg-muted-blue-light text-bel-navy border-bel-navy shadow-ink-sm',
  };

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
          <span>EXECUTING...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
