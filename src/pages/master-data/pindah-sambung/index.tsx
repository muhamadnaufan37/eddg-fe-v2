import { useEffect, useRef, useState } from "react";
import {
  getPindahSambungList,
  getPindahSambungHistory,
  approvePindahSambung,
  rejectPindahSambung,
  revertPindahSambung,
  requestPindahSambung,
  type PindahSambungItem,
  type PindahSambungHistory,
} from "@/services/pindahSambungService";
import { PindahSambungCard } from "./components/PindahSambungCard";
import { HistoryModal, ActionModal, RequestModal } from "./components/Modals";
import { BASE_TITLE } from "@/store/actions";
import { handleApiError } from "@/utils/errorUtils";
import { useFetchOptions } from "@/hooks/useFetchOptions";
import { getLocalStorage } from "@/services/localStorageService";

interface Option {
  value: string | number;
  label: string;
}

const PindahSambungIndex = () => {
  const hasFetched = useRef(false);
  const [data, setData] = useState<PindahSambungItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { fetchOptions } = useFetchOptions();

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    "" | "pending" | "approved" | "rejected" | "reverted"
  >("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [historyModal, setHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<PindahSambungHistory | null>(
    null,
  );
  const [historyLoading, setHistoryLoading] = useState(false);

  const [rejectModal, setRejectModal] = useState(false);
  const [revertModal, setRevertModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchDataPeserta, setFetchDataPeserta] = useState<Option[]>([]);

  const dataLogin = getLocalStorage("userData");

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getPindahSambungList({
        status: statusFilter || undefined,
        kode_cari_data: searchQuery || undefined,
        page: currentPage,
      });
      setData(response.data);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (error) {
      handleApiError(error, {});
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    const [dataPeserta] = await Promise.all([
      fetchOptions(
        `/api/v1/data_peserta/all?tmpt_daerah=${dataLogin?.user?.akses_daerah}&tmpt_desa=${dataLogin?.user?.akses_desa}&tmpt_kelompok=${dataLogin?.user?.akses_kelompok}`,
        "data",
        "nama_lengkap",
        "kode_cari_data",
      ),
    ]);

    setFetchDataPeserta(dataPeserta);
  };

  useEffect(() => {
    const isAnyFilterEmpty =
      statusFilter === "" && searchQuery === "" && currentPage === 1;

    if (isAnyFilterEmpty) {
      loadData();
    }
  }, [statusFilter, searchQuery, currentPage]);

  useEffect(() => {
    if (!hasFetched.current) {
      loadAllData();
      hasFetched.current = true;
    }
  }, []);

  // View history
  const handleViewHistory = async (kodeCariData: string) => {
    setHistoryModal(true);
    setHistoryLoading(true);
    try {
      const response = await getPindahSambungHistory(kodeCariData);
      setHistoryData(response.data);
    } catch (error) {
      handleApiError(error, {});
    } finally {
      setHistoryLoading(false);
    }
  };

  // Approve
  const handleApprove = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin approve request ini?")) return;

    setActionLoading(true);
    try {
      await approvePindahSambung(id);
      await loadData();
    } catch (error) {
      handleApiError(error, {});
    } finally {
      setActionLoading(false);
    }
  };

  // Reject
  const handleRejectOpen = (id: number) => {
    setSelectedId(id);
    setRejectModal(true);
  };

  const handleRejectSubmit = async (keterangan: string) => {
    if (!selectedId) return;

    setActionLoading(true);
    try {
      await rejectPindahSambung(selectedId, keterangan);
      setRejectModal(false);
      setSelectedId(null);
      await loadData();
    } catch (error) {
      handleApiError(error, {});
    } finally {
      setActionLoading(false);
    }
  };

  // Revert
  const handleRevertOpen = (id: number) => {
    setSelectedId(id);
    setRevertModal(true);
  };

  const handleRevertSubmit = async (alasan: string) => {
    if (!selectedId) return;

    setActionLoading(true);
    try {
      await revertPindahSambung(selectedId, alasan);
      setRevertModal(false);
      setSelectedId(null);
      await loadData();
    } catch (error) {
      handleApiError(error, {});
    } finally {
      setActionLoading(false);
    }
  };

  // Request new pindah sambung
  const handleRequestSubmit = async (data: {
    kode_cari_data: string;
    ke_daerah_id: number;
    ke_desa_id: number;
    ke_kelompok_id: number;
    alasan_pindah: string;
  }) => {
    setActionLoading(true);
    try {
      await requestPindahSambung(data);
      setRequestModal(false);
      await loadData();
      alert("Request pindah sambung berhasil diajukan!");
    } catch (error: any) {
      handleApiError(error, {});
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit request";
      alert(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  document.title = BASE_TITLE + "Pindah Sambung";

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/70 rounded-2xl">
          <div className="mx-auto flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3">
            <div className="flex-1">
              <div className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Pindah Sambung
              </div>
              <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Kelola perpindahan peserta antar lokasi
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 sm:px-4 sm:py-2 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Total
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {total}
                </div>
              </div>

              <button
                onClick={() => setRequestModal(true)}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shrink-0"
              >
                <span className="hidden sm:inline">+ Request Pindah</span>
                <span className="sm:hidden">+ Request</span>
              </button>

              <button
                onClick={() => loadData()}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 shrink-0"
              >
                <span className="hidden sm:inline">↻ Refresh</span>
                <span className="sm:hidden">↻</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Cari Kode Cari Data
              </label>
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Contoh: SEN250502191126409"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Filter Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="reverted">Reverted</option>
              </select>
            </div>

            <div className="md:col-span-4 flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="text-center py-10">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100 mx-auto" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Loading data...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Tidak ada data
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Data pindah sambung akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item) => (
                <PindahSambungCard
                  key={item.id}
                  item={item}
                  onViewHistory={() =>
                    handleViewHistory(item.peserta.kode_cari_data)
                  }
                  onApprove={
                    item.status === "pending"
                      ? () => handleApprove(item.id)
                      : undefined
                  }
                  onReject={
                    item.status === "pending"
                      ? () => handleRejectOpen(item.id)
                      : undefined
                  }
                  onRevert={
                    item.status === "approved"
                      ? () => handleRevertOpen(item.id)
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && data.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Page {currentPage} of {totalPages} • Total {total} items
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  ← Prev
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <HistoryModal
        open={historyModal}
        onClose={() => setHistoryModal(false)}
        data={historyData}
        loading={historyLoading}
      />

      <ActionModal
        open={rejectModal}
        onClose={() => {
          setRejectModal(false);
          setSelectedId(null);
        }}
        onSubmit={handleRejectSubmit}
        title="Reject Request"
        label="Keterangan Reject"
        placeholder="Masukkan alasan rejection..."
        submitLabel="Reject"
        loading={actionLoading}
        variant="danger"
      />

      <ActionModal
        open={revertModal}
        onClose={() => {
          setRevertModal(false);
          setSelectedId(null);
        }}
        onSubmit={handleRevertSubmit}
        title="Revert Request"
        label="Alasan Revert"
        placeholder="Masukkan alasan revert..."
        submitLabel="Revert"
        loading={actionLoading}
        variant="warning"
      />

      <RequestModal
        open={requestModal}
        onClose={() => setRequestModal(false)}
        onSubmit={handleRequestSubmit}
        loading={actionLoading}
        fetchDataPeserta={fetchDataPeserta}
      />
    </>
  );
};

export default PindahSambungIndex;
