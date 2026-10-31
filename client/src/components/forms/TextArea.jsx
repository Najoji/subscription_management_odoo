import React from 'react';

export default function TextArea({
  placeholder,
  value,
  onChange,
  rows = 3,
  disabled = false,
  error = false,
  className = '',
  ...props
}) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all duration-150 disabled:bg-slate-50 disabled:dark:bg-slate-800/50 disabled:cursor-not-allowed ${
        error
          ? 'border-rose-400 focus:border-rose-500'
          : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
      } ${className}`}
      {...props}
    />
  );
}
