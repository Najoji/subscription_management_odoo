import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{startIdx}</span> to{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{endIdx}</span> of{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 px-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
