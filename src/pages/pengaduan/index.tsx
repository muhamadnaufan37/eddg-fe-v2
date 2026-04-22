import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { DataTableAdvanced, Input, type Column } from "@/components/global";
import Pagination from "@/components/features/Pagination";
import { BASE_TITLE } from "@/store/actions";
import { handleApiError } from "@/utils/errorUtils";
import {
  deletePengaduan,
  fetchDetailPengaduan,
  fetchPengaduanData,
  type PengaduanItem,
} from "@/services/pengaduanService";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import {
  MailWarning,
  PlusCircle,
  RefreshCcw,
  Search,
  MessageSquareText,
} from "lucide-react";
import { THEME_COLORS } from "@/config/theme";

const JENIS_PENGADUAN_LABEL: Record<string, string> = {
  kritik_saran: "Kritik & Saran",
  keluhan_data: "Keluhan Data",
};

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  diproses:
    "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  selesai:
    "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  dibatalkan:
    "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
};

const PengaduanPage = () => {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [filterInput, setFilterInput] = useState("");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      return await fetchPengaduanData({
        page,
        rows,
        filterInput,
      });
    } catch (error: any) {
      handleApiError(error, {});
      return undefined;
    }
  };

  const {
    data: dataListPengaduan,
    isFetching: isRefetchingPengaduan,
    refetch: refetchListPengaduan,
  } = useQuery({
    queryKey: ["dataListPengaduan", page, rows],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
  });

  const onResetFilter = () => {
    setPage(1);
    setRows(10);
    setFilterInput("");
  };

  useEffect(() => {
    if (filterInput === "") {
      refetchListPengaduan();
    }
  }, [filterInput, refetchListPengaduan]);

  const formatDateString = (date: string) => {
    if (!date) return "-";
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: id,
    });
  };

  const goToDetailData = async (uuid: string, action: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetchDetailPengaduan(uuid);

      if (!response?.success) {
        toast.error("Error", {
          description: response?.message || "Gagal memuat detail pengaduan",
          duration: 3000,
        });
        return;
      }

      const navigationState = { detailData: response.data };

      if (action === "detail") {
        navigate("/pengaduan/detail", {
          state: navigationState,
          replace: true,
        });
        return;
      }

      if (action === "edit") {
        navigate("/pengaduan/update", {
          state: navigationState,
          replace: true,
        });
        return;
      }

      if (action === "reply") {
        navigate("/pengaduan/reply", {
          state: navigationState,
          replace: true,
        });
      }
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus data pengaduan ini?",
    );
    if (!confirmed) return;

    try {
      const response = await deletePengaduan(uuid);

      toast.success("Berhasil", {
        description: response?.message || "Pengaduan berhasil dihapus",
        duration: 2500,
      });

      refetchListPengaduan();
    } catch (error: any) {
      handleApiError(error, { showToast: true });
    }
  };

  const columns: Column<PengaduanItem>[] = [
    {
      key: "nama_lengkap",
      header: "Nama",
      sortable: true,
      bold: true,
    },
    {
      key: "kontak",
      header: "Kontak",
      sortable: true,
    },
    {
      key: "jenis_pengaduan",
      header: "Jenis",
      sortable: true,
      render: (item) => (
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {JENIS_PENGADUAN_LABEL[item.jenis_pengaduan] || item.jenis_pengaduan}
        </span>
      ),
    },
    {
      key: "subjek",
      header: "Subjek",
      sortable: true,
    },
    {
      key: "nama_kelompok",
      header: "Kelompok",
      sortable: true,
    },
    {
      key: "status_pengaduan",
      header: "Status",
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            STATUS_COLORS[item.status_pengaduan] ||
            "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
          }`}
        >
          {item.status_pengaduan}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Dibuat",
      sortable: true,
      render: (item) => <span>{formatDateString(item.created_at)}</span>,
    },
  ];

  const rowActions = [
    { label: "Detail", value: "detail" },
    { label: "Ubah", value: "edit" },
    { label: "Balas", value: "reply" },
    { label: "Hapus", value: "delete" },
  ];

  const handleRowAction = (item: PengaduanItem, action: string) => {
    if (action === "delete") {
      handleDelete(item.uuid);
      return;
    }

    goToDetailData(item.uuid, action);
  };

  document.title = BASE_TITLE + "Pengaduan";

  return (
    <div className="relative md:h-full">
      {(isRefetchingPengaduan || isLoadingDetail) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 backdrop-blur-xs">
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
          <p className={`mt-3 text-sm ${THEME_COLORS.text.secondary}`}>
            {isLoadingDetail ? "Memuat detail..." : "Memperbarui data..."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5 h-full">
        <div
          className={`${THEME_COLORS.background.card} rounded-2xl shadow-lg border ${THEME_COLORS.border.default} overflow-hidden`}
        >
          <div className={`${THEME_COLORS.active.background} px-6 py-5`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <MailWarning className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-2xl text-white tracking-tight">
                  Pengaduan
                </h1>
                <p className="text-white/80 text-sm mt-0.5">
                  Kelola data pengaduan pengguna
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="relative">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${THEME_COLORS.text.muted}`}
              >
                <Search className="w-5 h-5" />
              </div>
              <Input
                value={filterInput}
                className={`w-full pl-11 pr-4 py-3 text-sm border ${THEME_COLORS.border.default} rounded-xl shadow-sm focus:ring-2 ${THEME_COLORS.focus.ring} focus:border-transparent transition-all ${THEME_COLORS.background.input} ${THEME_COLORS.text.primary}`}
                placeholder="Cari berdasarkan nama pelapor..."
                onChange={(e: any) => setFilterInput(e.target.value)}
                onKeyDown={(e: any) =>
                  e.key === "Enter" && refetchListPengaduan()
                }
              />
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  disabled={isRefetchingPengaduan}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onResetFilter}
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isRefetchingPengaduan}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText} rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={() =>
                    navigate("/pengaduan/create", {
                      replace: true,
                    })
                  }
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Pengaduan</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-900/10 px-4 py-3 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <MessageSquareText className="w-4 h-4" />
          <span>Pengaduan dapat ditindaklanjuti melalui aksi Balas.</span>
        </div>

        <div className="flex flex-col gap-2">
          <DataTableAdvanced
            data={dataListPengaduan?.data || []}
            columns={columns}
            rowActions={rowActions}
            onRowAction={handleRowAction}
            selectable={false}
            getRowId={(item: PengaduanItem) => item.uuid}
            disabled={isLoadingDetail}
          />

          {isRefetchingPengaduan && (
            <div
              className={`text-xs ${THEME_COLORS.text.muted} text-center animate-pulse`}
            >
              Memperbarui data...
            </div>
          )}

          <div className="mt-3 shrink-0">
            <Pagination
              currentPage={dataListPengaduan?.meta?.current_page || 1}
              lastPage={dataListPengaduan?.meta?.last_page || 1}
              totalItems={dataListPengaduan?.meta?.total || 0}
              rowsPerPage={rows}
              onPageChange={(params) => {
                setPage(params.page + 1);
                setRows(params.rows);
              }}
              disabled={isRefetchingPengaduan}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PengaduanPage;
