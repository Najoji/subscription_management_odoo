import React from 'react';

export default function Select({
  options = [],
  value,
  onChange,
  disabled = false,
  error = false,
  placeholder = 'Select an option',
  className = '',
  ...props
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all duration-150 disabled:bg-slate-50 disabled:dark:bg-slate-800/50 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 focus:border-rose-500'
            : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
}
