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
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block font-mono text-xs uppercase font-bold text-stone-700 tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full px-3.5 py-2.5 text-xs bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-stone-900 border border-black/[0.1] rounded-xl focus:outline-none focus:ring-1 focus:ring-black transition-all shadow-xs placeholder:text-stone-400',
          mono && 'font-mono tracking-wide',
          error && 'border-rose-500 ring-1 ring-rose-500 text-rose-900',
          className
        )}
        {...props}
      />
      {error && (
        <p className="font-mono text-xs text-rose-600 font-semibold tracking-wide">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-stone-500 font-sans tracking-normal">
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
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block font-mono text-xs uppercase font-bold text-stone-700 tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'w-full px-3.5 py-2.5 text-xs bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-stone-900 border border-black/[0.1] rounded-xl focus:outline-none focus:ring-1 focus:ring-black transition-all shadow-xs cursor-pointer font-sans',
          error && 'border-rose-500 ring-1 ring-rose-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="font-mono text-xs text-rose-600 font-semibold tracking-wide">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-stone-500 font-sans tracking-normal">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
