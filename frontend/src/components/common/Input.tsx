import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  mono = false,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block font-mono text-xs uppercase font-bold text-inherit tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 text-sm bg-warm-white text-secure-black border-[1.5px] border-secure-black shadow-ink-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-signal-red transition-all',
          mono && 'font-mono tracking-wide',
          error && 'border-signal-red ring-1 ring-signal-red',
          className
        )}
        {...props}
      />
      {error && (
        <p className="font-mono text-xs text-signal-red font-semibold tracking-wide">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="font-mono text-[11px] text-stone-500 tracking-wide">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  helperText,
  error,
  children,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={selectId} className="block font-mono text-xs uppercase font-bold text-inherit tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'w-full px-3 py-2 text-sm bg-warm-white text-secure-black border-[1.5px] border-secure-black shadow-ink-sm focus:outline-none focus:ring-2 focus:ring-signal-red transition-all font-mono',
          error && 'border-signal-red',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="font-mono text-xs text-signal-red font-semibold tracking-wide">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="font-mono text-[11px] text-stone-500 tracking-wide">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
