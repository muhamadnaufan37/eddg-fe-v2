import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number; // Halaman saat ini (1-based)
  lastPage: number; // Total halaman
  totalItems: number; // Total data keseluruhan
  rowsPerPage: number; // Jumlah data per halaman
  // Callback ketika ada perubahan (pindah halaman atau ganti jumlah baris)
  onPageChange: (params: { page: number; first: number; rows: number }) => void;
  rowsOptions?: number[]; // Pilihan jumlah baris (opsional)
  disabled: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  lastPage,
  totalItems,
  rowsPerPage,
  onPageChange,
  rowsOptions = [5, 10, 25, 50, 100],
}) => {
  // Fungsi pembantu untuk navigasi
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= lastPage) {
      onPageChange({
        page: pageNumber - 1, // Mengirim 0-based index ke API biasanya
        first: (pageNumber - 1) * rowsPerPage,
        rows: rowsPerPage,
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center text-xs p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm gap-3">
      {/* Bagian Kiri: Rows Selector & Total */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-gray-600 dark:text-gray-300">Tampilkan</span>
        <select
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          value={rowsPerPage}
          onChange={(e) =>
            onPageChange({
              page: 0,
              first: 0,
              rows: parseInt(e.target.value),
            })
          }
        >
          {rowsOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <span className="text-gray-600 dark:text-gray-300">
          Item dari total{" "}
          <b className="text-gray-900 dark:text-white">{totalItems}</b>
        </span>
      </div>

      {/* Bagian Kanan: Navigation Controls */}
      <div className="flex justify-between items-center gap-4">
        {/* Input Halaman */}
        <div className="flex items-center gap-1">
          <span className="text-gray-600 dark:text-gray-300">Halaman</span>
          <input
            type="number"
            min={1}
            max={lastPage}
            className="border border-gray-300 dark:border-gray-600 w-12 px-1 py-1 text-center rounded outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) goToPage(val);
            }}
          />
          <span className="text-gray-600 dark:text-gray-300 text-nowrap">
            dari {lastPage}
          </span>
        </div>

        {/* Tombol Navigasi Ikon */}
        <div className="flex gap-1">
          <NavButton
            onClick={() => goToPage(1)}
            disabled={currentPage <= 1}
            icon={<ChevronsLeft className="w-4 h-4" />}
          />
          <NavButton
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            icon={<ChevronLeft className="w-4 h-4" />}
          />
          <NavButton
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= lastPage}
            icon={<ChevronRight className="w-4 h-4" />}
          />
          <NavButton
            onClick={() => goToPage(lastPage)}
            disabled={currentPage >= lastPage}
            icon={<ChevronsRight className="w-4 h-4" />}
          />
        </div>
      </div>
    </div>
  );
};

// Komponen Kecil untuk Button agar kode lebih bersih
const NavButton = ({ onClick, disabled, icon }: any) => (
  <button
    type="button"
    className="border border-gray-300 dark:border-gray-600 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-all text-gray-700 dark:text-gray-300"
    disabled={disabled}
    onClick={onClick}
  >
    {icon}
  </button>
);

export default Pagination;
