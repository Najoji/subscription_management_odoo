import React from 'react';

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error = false,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className="relative rounded-lg">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all duration-150 disabled:bg-slate-50 disabled:dark:bg-slate-800/50 disabled:cursor-not-allowed ${
          Icon ? 'pl-9.5' : 'pl-3'
        } pr-3 py-2 ${
          error
            ? 'border-rose-400 focus:border-rose-500'
            : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
