import React from 'react';
import { allowOnlyDigitsKeyDown, allowNumberKeyDown } from '@/lib/utils/input-validators';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  numericOnly?: boolean;
  allowDecimal?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      disabled,
      required,
      numericOnly,
      allowDecimal = false,
      type,
      inputMode,
      maxLength,
      onKeyDown,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isStrictNumeric = numericOnly || type === 'tel' || inputMode === 'numeric';
    const isNumberType = type === 'number';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isStrictNumeric) {
        allowOnlyDigitsKeyDown(e);
      } else if (isNumberType) {
        allowNumberKeyDown(e, allowDecimal);
      }
      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isStrictNumeric) {
        let val = e.target.value.replace(/\D/g, '');
        if (maxLength && maxLength > 0) {
          val = val.slice(0, maxLength);
        }
        e.target.value = val;
      }
      onChange?.(e);
    };

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-pitstop-charcoal flex items-center justify-between">
            <span>
              {label} {required && <span className="text-red-500">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span className="absolute left-3 text-pitstop-muted pointer-events-none inline-flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            type={type}
            inputMode={inputMode}
            maxLength={maxLength}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            className={`w-full min-h-[46px] rounded-lg border bg-white px-3.5 py-2.5 text-base sm:text-sm text-pitstop-charcoal placeholder:text-pitstop-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow focus:ring-offset-1 disabled:opacity-50 disabled:bg-pitstop-bg ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-pitstop-border hover:border-pitstop-muted'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-pitstop-muted inline-flex items-center">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-pitstop-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
