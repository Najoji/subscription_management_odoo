import React from 'react';

export default function FormField({
  label,
  required = false,
  error,
  helperText,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-rose-500 font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
