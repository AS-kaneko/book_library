import React, { forwardRef } from 'react';
import { useMode } from '../contexts/ModeContext';
import { RubyText } from './RubyText';

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  autoFocus?: boolean;
  id?: string;
  ariaLabel?: string;
  autoComplete?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      type = 'text',
      value,
      onChange,
      onKeyDown,
      placeholder,
      disabled = false,
      required = false,
      error,
      helperText,
      className = '',
      autoFocus = false,
      id,
      ariaLabel,
      autoComplete,
    },
    ref
  ) => {
    const { isKidsMode } = useMode();
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // キッズモード時のスタイルクラス
    const labelFontSize = isKidsMode ? 'text-lg' : 'text-sm';
    const inputFontSize = isKidsMode ? 'text-lg' : 'text-base';

    return (
      <div className={`mb-4 ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block ${labelFontSize} font-medium text-gray-700 mb-1.5`}
          >
            <RubyText>{label}</RubyText>
            {required && <span className="text-error-500 ml-1" aria-label="必須">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          aria-label={ariaLabel || label}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={`
            w-full px-3 py-2 ${inputFontSize}
            border rounded-md shadow-sm
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
            ${
              error
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }
          `}
        />
        {error && (
          <p 
            id={errorId} 
            className="mt-1.5 text-sm text-error-600 flex items-center"
            role="alert"
          >
            <svg 
              className="w-4 h-4 mr-1 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
