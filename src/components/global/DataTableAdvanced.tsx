import React, { useState, useMemo } from "react";
import {
  Ban,
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  Eye,
  MoreVertical,
  KeyRound,
  Pencil,
  QrCode,
  Reply,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  bold?: boolean;
  mobileHidden?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableAdvancedProps<T> {
  // Data props
  data: T[];
  columns: Column<T>[];

  // Table scroll behavior
  maxHeightClassName?: string;

  // Row actions
  onRowAction?: (item: T, action: string) => void;
  rowActions?:
    | Array<{ label: string; value: string }>
    | ((item: T) => Array<{ label: string; value: string }>);

  // Selection
  selectable?: boolean;
  getRowId?: (item: T) => string;

  selectedRows?: Set<string>;
  setSelectedRows?: (selected: Set<string>) => void;

  // Disabled state
  disabled?: boolean;
}

export function DataTableAdvanced<T extends Record<string, any>>({
  data,
  columns,
  maxHeightClassName = "max-h-[70vh]",
  onRowAction,
  rowActions,
  selectable = true,
  getRowId = (item) => item.id,
  selectedRows: controlledSelectedRows,
  setSelectedRows: controlledSetSelectedRows,
  disabled = false,
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
  const hasMobileHiddenColumns = columns.some((column) => column.mobileHidden);
  const hasRowActions = Boolean(rowActions);
  const tableMinWidthClass = hasMobileHiddenColumns
    ? "min-w-[960px] md:min-w-[1100px]"
    : "min-w-[1100px]";

  const getActionIcon = (actionValue: string) => {
    switch (actionValue) {
      case "detail":
        return Eye;
      case "edit":
      case "update":
        return Pencil;
      case "qrcode":
        return QrCode;
      case "presensi":
        return ClipboardCheck;
      case "list":
        return ClipboardList;
      case "reply":
        return Reply;
      case "reset":
        return KeyRound;
      case "reset_device":
        return RotateCcw;
      case "banned":
        return Ban;
      case "unbanned":
        return ShieldCheck;
      case "delete":
      case "hapus":
        return Trash2;
      default:
        return MoreVertical;
    }
  };

  const getActionButtonClass = (actionValue: string) => {
    const baseClass =
      "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900";
    switch (actionValue) {
      case "delete":
      case "hapus":
        return `${baseClass} border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 focus:ring-red-500 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/35`;
      case "banned":
        return `${baseClass} border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 focus:ring-red-500 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/35`;
      case "unbanned":
        return `${baseClass} border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-500 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35`;
      case "edit":
      case "update":
        return `${baseClass} border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-300 hover:bg-amber-100 focus:ring-amber-500 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/35`;
      case "qrcode":
        return `${baseClass} border-violet-200 bg-violet-50 text-violet-600 hover:border-violet-300 hover:bg-violet-100 focus:ring-violet-500 dark:border-violet-900/60 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/35`;
      case "presensi":
      case "list":
        return `${baseClass} border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-500 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35`;
      case "reset":
        return `${baseClass} border-indigo-200 bg-indigo-50 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-100 focus:ring-indigo-500 dark:border-indigo-900/60 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/35`;
      case "reset_device":
        return `${baseClass} border-sky-200 bg-sky-50 text-sky-600 hover:border-sky-300 hover:bg-sky-100 focus:ring-sky-500 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/35`;
      case "reply":
        return `${baseClass} border-cyan-200 bg-cyan-50 text-cyan-600 hover:border-cyan-300 hover:bg-cyan-100 focus:ring-cyan-500 dark:border-cyan-900/60 dark:bg-cyan-900/20 dark:text-cyan-300 dark:hover:bg-cyan-900/35`;
      default:
        return `${baseClass} border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700`;
    }
  };

  return (
    <>
      {/* Table */}
      <div
        className={`w-full max-w-full ${maxHeightClassName} overflow-auto rounded-2xl border border-gray-200 dark:border-gray-700`}
      >
        <div className="min-w-max">
          <table className={`${tableMinWidthClass} w-full table-auto`}>
            <thead className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                {/* Checkbox Column */}
                {selectable && (
                  <th className="w-10 bg-gray-50 px-3 py-2 sm:w-12 sm:px-6 sm:py-3 dark:bg-gray-800">
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
                    className={`${column.mobileHidden ? "hidden md:table-cell" : ""} bg-gray-50 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 sm:py-3 dark:bg-gray-800 dark:text-gray-400`}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 sm:gap-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
                {hasRowActions && (
                  <th className="w-10 bg-gray-50 px-3 py-2 sm:w-12 sm:px-6 sm:py-3 dark:bg-gray-800"></th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedData.map((item, index) => {
                const rowId = getRowId(item);
                const isSelected = selectedRows.has(rowId);

                // detect atlet status (accept true, 1, "1", "true")
                const isAtlet = (() => {
                  const v = item?.status_atlet_asad;
                  if (v === true || v === 1 || v === "1") return true;
                  if (typeof v === "string")
                    return v.trim().toLowerCase() === "true";
                  return false;
                })();

                const rowClass =
                  `hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  } ${!isSelected && isAtlet ? "bg-green-50 dark:bg-green-900/20 motion-safe:animate-pulse" : ""}`.trim();

                return (
                  <tr key={rowId} className={rowClass}>
                    {/* Checkbox */}
                    {selectable && (
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
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
                        className={`${column.mobileHidden ? "hidden md:table-cell" : ""} px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
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
                    {(() => {
                      const actions =
                        typeof rowActions === "function"
                          ? rowActions(item)
                          : rowActions;
                      return (
                        actions &&
                        actions.length > 0 && (
                          <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {actions.map((action) => {
                                const ActionIcon = getActionIcon(action.value);
                                return (
                                  <button
                                    key={action.value}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() =>
                                      onRowAction?.(item, action.value)
                                    }
                                    className={getActionButtonClass(
                                      action.value,
                                    )}
                                    title={action.label}
                                    aria-label={action.label}
                                  >
                                    <ActionIcon className="h-4 w-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        )
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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
