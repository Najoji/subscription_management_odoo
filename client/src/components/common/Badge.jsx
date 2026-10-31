import React from 'react';
import { getStatusBadgeColor } from '../../utils/formatters.js';

export default function Badge({ status, label, className = '' }) {
  const displayLabel = label || status || 'Unknown';
  const colorClasses = getStatusBadgeColor(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {displayLabel}
    </span>
  );
}
