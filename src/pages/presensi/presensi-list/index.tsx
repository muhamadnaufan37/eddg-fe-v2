import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Pagination from "@/components/features/Pagination";
import ParticipantSkeleton from "@/pages/digital-data/sensus/components/ParticipantSkeleton";
import { DataTableAdvanced, Input, type Column } from "@/components/global";
import { BASE_TITLE } from "@/store/actions";
import { THEME_COLORS } from "@/config/theme";
import {
  fetchPresensiList,
  type PresensiListItem,
} from "@/services/presensiService";
import { handleApiError } from "@/utils/errorUtils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  RefreshCcw,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";

const PresensiListPage = () => {
  const { kode_kegiatan, id_kegiatan } = useParams<{
    kode_kegiatan: string;
    id_kegiatan: string;
  }>();
  const navigate = useNavigate();

  // State untuk list dan pagination
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const {
    data: listData,
    isFetching,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["presensi-list", id_kegiatan, page, rows, search],
    queryFn: () => {
      if (!id_kegiatan) throw new Error("Kode kegiatan tidak ditemukan");
      return fetchPresensiList(id_kegiatan, page, rows, search);
    },
    enabled: !!id_kegiatan,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (search === "") {
      refetch();
    }
  }, [search]);

  const columns: Column<PresensiListItem>[] = [
    { key: "kd_peserta", header: "ID Peserta", sortable: true },
    { key: "nm_peserta", header: "Nama Peserta", sortable: true },
    {
      key: "nm_kegiatan",
      header: "Kegiatan",
      sortable: true,
      mobileHidden: true,
    },
    {
      key: "tgl_kegiatan",
      header: "Tanggal",
      sortable: true,
      mobileHidden: true,
    },
    {
      key: "status_presensi",
      header: "Status",
      render: (item: PresensiListItem) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            item.status_presensi === "HADIR"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              : item.status_presensi === "TERLAMBAT"
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                : item.status_presensi === "IZIN"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                  : item.status_presensi === "SAKIT"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
          }`}
        >
          {item.status_presensi || "TIDAK HADIR"}
        </span>
      ),
    },
    {
      key: "waktu_presensi",
      header: "Waktu Presensi",
      render: (item: PresensiListItem) =>
        item.waktu_presensi ? (
          <span className="text-xs">
            {formatDistanceToNow(new Date(item.waktu_presensi), {
              addSuffix: true,
              locale: id,
            })}
          </span>
        ) : (
          <span className="text-xs text-gray-500">-</span>
        ),
    },
    {
      key: "nm_petugas_input",
      header: "Petugas Input",
      mobileHidden: true,
      render: (item: PresensiListItem) => (
        <span className="text-xs">{item.nm_petugas_input || "-"}</span>
      ),
    },
    {
      key: "keterangan",
      header: "Keterangan",
      mobileHidden: true,
      render: (item: PresensiListItem) => (
        <span className="text-xs">{item.keterangan || "-"}</span>
      ),
    },
  ];

  const handleReset = () => {
    setPage(1);
    setRows(10);
    setSearch("");
  };

  document.title = BASE_TITLE + "Detail Presensi";

  return (
    <div className="relative md:h-full">
      {(isFetching || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center z-50 backdrop-blur-xs">
          <svg
            className="animate-spin h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      <div className="flex flex-col gap-5 h-full">
        {/* Header */}
        <div
          className={`${THEME_COLORS.background.card} rounded-2xl shadow-lg border ${THEME_COLORS.border.default} overflow-hidden`}
        >
          <div className={`${THEME_COLORS.active.background} px-6 py-5`}>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => navigate("/presensi")}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-2xl text-white tracking-tight">
                  Detail Presensi
                </h1>
                <p className="text-white/80 text-sm mt-0.5">
                  Laporan presensi peserta untuk Kode Kegiatan: {kode_kegiatan}
                </p>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="p-6 space-y-5">
            <div className="relative">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${THEME_COLORS.text.muted}`}
              >
                <Search className="w-5 h-5" />
              </div>
              <Input
                value={search}
                className={`w-full pl-11 pr-4 py-3 text-sm border ${THEME_COLORS.border.default} rounded-xl shadow-sm focus:ring-2 ${THEME_COLORS.focus.ring} focus:border-transparent transition-all ${THEME_COLORS.background.input} ${THEME_COLORS.text.primary}`}
                placeholder="Cari nama/ID peserta..."
                onChange={(e: any) => setSearch(e.target.value)}
                onKeyDown={(e: any) => e.key === "Enter" && refetch()}
              />
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={isFetching}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleReset}
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex flex-col gap-2">
          {isLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ParticipantSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && (
            <DataTableAdvanced
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              data={listData?.data || []}
              columns={columns}
              selectable={true}
              getRowId={(item: PresensiListItem) => String(item.id)}
              disabled={isFetching}
            />
          )}

          {isFetching && !isLoading && (
            <div
              className={`text-xs ${THEME_COLORS.text.muted} text-center animate-pulse`}
            >
              Memperbarui data...
            </div>
          )}

          {!isLoading && listData?.data && listData.data.length === 0 && (
            <div
              className={`flex flex-col items-center justify-center py-12 rounded-lg border ${THEME_COLORS.border.default} bg-gray-50 dark:bg-gray-900/50`}
            >
              <FileText
                className={`w-12 h-12 ${THEME_COLORS.text.muted} mb-3`}
              />
              <p className={`text-sm font-medium ${THEME_COLORS.text.primary}`}>
                Tidak ada data presensi
              </p>
              <p className={`text-xs ${THEME_COLORS.text.muted} mt-1`}>
                Coba ubah filter pencarian Anda
              </p>
            </div>
          )}

          <div className="mt-3 shrink-0">
            <Pagination
              currentPage={listData?.meta?.current_page || 1}
              lastPage={listData?.meta?.last_page || 1}
              totalItems={listData?.meta?.total || 0}
              rowsPerPage={rows}
              onPageChange={(params) => {
                setPage(params.page + 1);
                setRows(params.rows);
              }}
              disabled={isFetching}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresensiListPage;
