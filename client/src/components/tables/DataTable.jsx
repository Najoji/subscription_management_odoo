import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import EmptyState from '../common/EmptyState.jsx';
import Pagination from '../common/Pagination.jsx';

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  searchPlaceholder = 'Search records...',
  searchField = 'name',
  filterOptions = null, // e.g. { label: 'Status', key: 'status', options: ['Active', 'Draft'] }
  headerActions = null,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your criteria.',
  onRowClick = null,
  pageSize = 10,
  rowKey = 'id',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Search computation
  const filteredData = useMemo(() => {
    let result = Array.isArray(data) ? [...data] : [];

    // Filter by selected category (e.g. status)
    if (filterOptions && selectedFilter) {
      result = result.filter((row) => {
        const val = row[filterOptions.key];
        return String(val || '').toLowerCase() === selectedFilter.toLowerCase();
      });
    }

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((row) => {
        // If searchField is a function
        if (typeof searchField === 'function') {
          return searchField(row, q);
        }
        // If searchField is an array of keys
        if (Array.isArray(searchField)) {
          return searchField.some((k) => String(row[k] || '').toLowerCase().includes(q));
        }
        // Default single field search or search across all primitive values
        return Object.values(row).some((val) =>
          typeof val === 'string' || typeof val === 'number'
            ? String(val).toLowerCase().includes(q)
            : false
        );
      });
    }

    return result;
  }, [data, filterOptions, selectedFilter, searchTerm, searchField]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search & Filter Controls */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {filterOptions && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedFilter}
                onChange={(e) => {
                  setSelectedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All {filterOptions.label || 'Status'}</option>
                {filterOptions.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {headerActions && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {headerActions}
          </div>
        )}
      </div>

      {/* Main Table Body */}
      {isLoading ? (
        <LoadingSpinner message="Loading records..." />
      ) : paginatedData.length === 0 ? (
        <div className="p-8">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={col.key || idx}
                    className={`px-4 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {paginatedData.map((row, rowIdx) => {
                const key = row[rowKey] || rowIdx;
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors duration-150 ${
                      onRowClick
                        ? 'cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-slate-800/60'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={col.key || colIdx}
                        className={`px-4 py-3.5 text-xs ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                      >
                        {col.render
                          ? col.render(row[col.key], row, rowIdx)
                          : row[col.key] !== undefined && row[col.key] !== null
                          ? String(row[col.key])
                          : '—'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
}
