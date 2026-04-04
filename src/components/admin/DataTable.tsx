'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface DataTableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export function DataTable({
  headers,
  rows,
  searchPlaceholder = 'Rechercher...',
  onSearch,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="space-y-4">
      {onSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left font-semibold text-slate-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  Aucune donnée disponible
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-6 py-4 text-slate-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
