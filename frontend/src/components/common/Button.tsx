import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  neonColor?: string;
  disableNeon?: boolean;
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
  neonColor,
  disableNeon = false,
  style,
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-mono font-bold tracking-wider uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-full',
    md: 'text-xs md:text-sm px-4 py-2 gap-2 rounded-full',
    lg: 'text-sm md:text-base px-6 py-3 gap-2.5 rounded-full',
  };

  const variantStyles = {
    primary: 'bg-[#0d0d0d] hover:bg-stone-800 text-white',
    secondary: 'bg-stone-100 hover:bg-stone-200 text-stone-900',
    outline: 'bg-white hover:bg-stone-50 text-stone-900',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white',
    ghost: 'bg-transparent hover:bg-stone-100 text-stone-900',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };

  const getNeonColor = () => {
    if (neonColor) return neonColor;
    if (variant === 'danger') return '#f43f5e';
    if (variant === 'success') return '#10b981';
    if (variant === 'secondary') return '#00E5FF';
    if (variant === 'outline') return '#00E5FF';
    return '#00E5FF'; // Electric cyan for primary
  };

  const activeColor = getNeonColor();

  const neonStyle: React.CSSProperties = !disableNeon && !disabled ? {
    borderColor: activeColor,
    borderWidth: '1.5px',
    borderStyle: 'solid',
    boxShadow: `0 0 6px ${activeColor}40, inset 0 0 2px ${activeColor}20`,
    ...style,
  } : {
    borderWidth: '1.5px',
    borderStyle: 'solid',
    ...style,
  };

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      style={neonStyle}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Button Content */}
      <span className="relative z-10 inline-flex items-center justify-center gap-[inherit]">
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
      </span>
    </button>
  );
};
