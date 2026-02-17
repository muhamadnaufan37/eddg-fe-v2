import { useEffect, useState } from "react";
import { getWarnings, type WarningData } from "@/services/warningService";
import { WarningCard } from "./components/WarningCard";
import { StatisticsGrid } from "./components/StatisticsCard";
import { handleApiError } from "@/utils/errorUtils";
import { BASE_TITLE } from "@/store/actions";

const WarningListPage = () => {
  const [data, setData] = useState<WarningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<"all" | 0 | 1 | 2>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadWarnings();
    document.title = BASE_TITLE + "Warning Laporan Bulanan";
  }, []);

  const loadWarnings = async () => {
    setLoading(true);
    try {
      const response = await getWarnings();
      setData(response.data);
    } catch (error) {
      handleApiError(error, {});
    } finally {
      setLoading(false);
    }
  };

  const filteredWarnings =
    data?.warnings.filter((warning) => {
      const matchLevel =
        filterLevel === "all" || warning.warning_level === filterLevel;
      const matchSearch =
        searchQuery === "" ||
        warning.user.nama_lengkap
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        warning.user.username
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        warning.user.lokasi.daerah
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        warning.user.lokasi.desa
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        warning.user.lokasi.kelompok
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchLevel && matchSearch;
    }) || [];

  const warningCounts = {
    all: data?.warnings.length || 0,
    normal: data?.warnings.filter((w) => w.warning_level === 0).length || 0,
    medium: data?.warnings.filter((w) => w.warning_level === 1).length || 0,
    high: data?.warnings.filter((w) => w.warning_level === 2).length || 0,
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/70 rounded-2xl">
          <div className="mx-auto flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3">
            <div className="flex-1">
              <div className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Warning Laporan Bulanan
              </div>
              <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Monitor peringatan keterlambatan submit laporan bulanan
              </div>
            </div>

            <button
              onClick={loadWarnings}
              disabled={loading}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 shrink-0"
            >
              {loading ? "⟳ Loading..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100 mx-auto" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Memuat data warnings...
            </p>
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Data tidak tersedia
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Gagal memuat data warnings
            </p>
          </div>
        ) : (
          <>
            {/* Statistics */}
            <StatisticsGrid
              totalOperators={data.total_operators}
              totalWarnings={data.total_warnings}
              tahun={data.tahun}
              checkedAt={data.checked_at}
            />

            {/* Filters */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search */}
                <div className="md:col-span-6">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Cari Operator / Lokasi
                  </label>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, username, atau lokasi..."
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
                  />
                </div>

                {/* Warning Level Filter */}
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Filter Level
                  </label>
                  <select
                    value={filterLevel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilterLevel(
                        val === "all" ? "all" : (parseInt(val) as 0 | 1 | 2),
                      );
                    }}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
                  >
                    <option value="all">Semua ({warningCounts.all})</option>
                    <option value="0">Normal ({warningCounts.normal})</option>
                    <option value="1">Medium ({warningCounts.medium})</option>
                    <option value="2">High ({warningCounts.high})</option>
                  </select>
                </div>

                {/* Reset */}
                <div className="md:col-span-3 flex items-end">
                  <button
                    onClick={() => {
                      setFilterLevel("all");
                      setSearchQuery("");
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Warning List */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Daftar Warning ({filteredWarnings.length})
                </div>
              </div>

              {filteredWarnings.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Tidak ada data
                  </p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {searchQuery || filterLevel !== "all"
                      ? "Tidak ada warning yang sesuai dengan filter"
                      : "Tidak ada warning ditemukan"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredWarnings.map((warning) => (
                    <WarningCard key={warning.user.id} warning={warning} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default WarningListPage;
