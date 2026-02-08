import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, MoreVertical } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  bold?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableAdvancedProps<T> {
  // Data props
  data: T[];
  columns: Column<T>[];

  // Row actions
  onRowAction?: (item: T, action: string) => void;
  rowActions?: Array<{ label: string; value: string }>;

  // Selection
  selectable?: boolean;
  getRowId?: (item: T) => string;

  selectedRows?: Set<string>;
  setSelectedRows?: (selected: Set<string>) => void;
}

export function DataTableAdvanced<T extends Record<string, any>>({
  data,
  columns,
  onRowAction,
  rowActions,
  selectable = true,
  getRowId = (item) => item.id,
  selectedRows: controlledSelectedRows,
  setSelectedRows: controlledSetSelectedRows,
}: DataTableAdvancedProps<T>) {
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(
    new Set(),
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({
    key: "",
    direction: null,
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Use controlled or internal state
  const selectedRows = controlledSelectedRows ?? internalSelectedRows;
  const setSelectedRows = controlledSetSelectedRows ?? setInternalSelectedRows;

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(getRowId));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  // Handle individual row selection
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  return (
    <>
      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {/* Checkbox Column */}
              {selectable && (
                <th className="w-12 px-6 py-3">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                    />
                  </div>
                </th>
              )}

              {/* Data Columns */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <span>{column.header}</span>
                      {sortConfig.key === column.key ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp size={16} />
                        ) : sortConfig.direction === "desc" ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronDown size={16} className="opacity-30" />
                        )
                      ) : (
                        <ChevronDown size={16} className="opacity-30" />
                      )}
                    </button>
                  ) : (
                    <span>{column.header}</span>
                  )}
                </th>
              ))}

              {/* Actions Column */}
              {rowActions && rowActions.length > 0 && (
                <th className="w-12 px-6 py-3"></th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((item, index) => {
              const rowId = getRowId(item);
              const isSelected = selectedRows.has(rowId);

              return (
                <tr
                  key={rowId}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  {/* Checkbox */}
                  {selectable && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            handleSelectRow(rowId, e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                        />
                      </div>
                    </td>
                  )}

                  {/* Data Cells */}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        column.bold
                          ? "font-semibold text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {column.render
                        ? column.render(item, index)
                        : item[column.key]}
                    </td>
                  ))}

                  {/* Action Menu */}
                  {rowActions && rowActions.length > 0 && (
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === rowId ? null : rowId)
                        }
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {openMenuId === rowId && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-12 top-8 z-20 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                            {rowActions.map((action) => (
                              <button
                                key={action.value}
                                onClick={() => {
                                  onRowAction?.(item, action.value);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No data available
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// Status Badge Component (untuk kolom status seperti di gambar)
export const StatusBadge: React.FC<{
  status: "active" | "inactive";
  label?: string;
}> = ({ status, label }) => {
  const isActive = status === "active";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isActive
              ? "bg-green-600 dark:bg-green-500"
              : "bg-gray-400 dark:bg-gray-500"
          }`}
        />
        {label || (isActive ? "Active" : "Inactive")}
      </span>
    </div>
  );
};
