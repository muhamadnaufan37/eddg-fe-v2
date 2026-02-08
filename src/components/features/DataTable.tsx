import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface Column {
  header: string;
  render: (item: any, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

interface DataTableProps {
  data: any[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number; // Digunakan untuk penomoran "No" agar kontinu
  };
  columns: Column[];
  onPageChange: (params: { page: number; rows: number }) => void;
  emptyImage?: string;
  emptyMessage?: React.ReactNode;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  meta,
  columns,
  onPageChange,
  emptyImage = "/eddg/table-no-entry-data.svg",
  emptyMessage = "Belum ada data tersedia.",
}) => {
  // Destructuring meta untuk kemudahan
  const { current_page, last_page, per_page, total, from } = meta || {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 1,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-auto rounded-xl bg-white border border-gray-200">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-[#0D48A0] text-white text-xs">
            <tr>
              <th className="px-4 py-3 border border-gray-300 text-center sticky top-0 z-10 bg-[#0D48A0]">
                No
              </th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{ width: col.width }}
                  className={`px-4 py-3 border border-gray-300 text-center sticky top-0 z-10 bg-[#0D48A0] ${col.className}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src={emptyImage}
                      alt="no-data"
                      className="w-40 h-40 mb-4"
                    />
                    <span className="text-sm text-gray-500">
                      {emptyMessage}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2 border border-gray-200 text-center">
                    {/* Penomoran otomatis berdasarkan 'from' dari Laravel */}
                    {from + rowIndex}
                  </td>
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-2 border border-gray-200 ${col.className}`}
                    >
                      {col.render(item, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center text-sm p-4 bg-white rounded-xl border border-gray-200 gap-4">
        <div className="flex items-center gap-2">
          <span>Tampilkan</span>
          <select
            className="border rounded px-2 py-1"
            value={per_page}
            onChange={(e) =>
              onPageChange({ page: 1, rows: parseInt(e.target.value) })
            }
          >
            {[1, 10, 25, 50, 100].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <span className="text-gray-600">
            Item dari total <b>{total}</b>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span>Halaman</span>
            <input
              type="number"
              className="border w-12 px-1 py-1 text-center rounded"
              value={current_page}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= last_page)
                  onPageChange({ page: val, rows: per_page });
              }}
            />
            <span className="text-gray-600">dari {last_page}</span>
          </div>

          <div className="flex gap-1">
            <button
              className="border p-1.5 rounded disabled:opacity-30"
              disabled={current_page <= 1}
              onClick={() => onPageChange({ page: 1, rows: per_page })}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              className="border p-1.5 rounded disabled:opacity-30"
              disabled={current_page <= 1}
              onClick={() =>
                onPageChange({ page: current_page - 1, rows: per_page })
              }
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="border p-1.5 rounded disabled:opacity-30"
              disabled={current_page >= last_page}
              onClick={() =>
                onPageChange({ page: current_page + 1, rows: per_page })
              }
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              className="border p-1.5 rounded disabled:opacity-30"
              disabled={current_page >= last_page}
              onClick={() => onPageChange({ page: last_page, rows: per_page })}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
