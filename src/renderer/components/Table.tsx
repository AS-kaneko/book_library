import React from 'react';
import { useMode } from '../contexts/ModeContext';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  caption?: string;
  striped?: boolean;
  hoverable?: boolean;
}

function Table<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'データがありません',
  caption,
  striped = false,
  hoverable = true,
}: TableProps<T>) {
  const { isKidsMode } = useMode();

  // キッズモード時のスタイルクラス
  const headerFontSize = isKidsMode ? 'text-lg' : 'text-xs';
  const cellFontSize = isKidsMode ? 'text-base' : 'text-sm';
  const cellPadding = isKidsMode ? 'px-6 py-5' : 'px-6 py-4';
  const headerPadding = isKidsMode ? 'px-6 py-4' : 'px-6 py-3';

  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as React.ReactNode;
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={`${headerPadding} text-left ${headerFontSize} font-semibold text-gray-700 ${isKidsMode ? '' : 'uppercase'} tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                <div className="flex flex-col items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-base">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                className={`
                  transition-colors duration-150
                  ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''}
                  ${hoverable ? 'hover:bg-gray-100' : ''}
                  ${onRowClick ? 'cursor-pointer focus:outline-none focus:bg-primary-50 focus:ring-2 focus:ring-inset focus:ring-primary-500' : ''}
                `}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`${cellPadding} ${cellFontSize} text-gray-900 ${column.className || ''}`}
                  >
                    {getCellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
