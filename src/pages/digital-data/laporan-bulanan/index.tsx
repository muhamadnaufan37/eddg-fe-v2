import React, { useEffect, useMemo, useState } from "react";
import {
  getLaporanStatus,
  getLaporanHistory,
  submitLaporan,
  approveLaporan,
  rejectLaporan,
} from "@/services/laporanBulananService";
import { handleApiError } from "@/utils/errorUtils";
import { toast } from "sonner";
import { BASE_TITLE } from "@/store/actions";

/** =========================
 * TYPES
 * ========================= */
type StatusLaporan =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "belum_submit";

type StatusBulananItem = {
  bulan: number;
  nama_bulan: string;
  status: StatusLaporan;
  submitted_at: string | null;
  is_late: boolean;
  laporan_id: number | null;
  is_submit: boolean;
};

type UserInfo = {
  id: number;
  nama_lengkap: string;
  warning_level: number;
  last_warning_at: string | null;
};

type StatusResponse = {
  success: boolean;
  message: string;
  data: {
    tahun: number;
    user: UserInfo;
    status_bulanan: StatusBulananItem[];
    summary: {
      total_submitted: number;
      total_approved: number;
      total_rejected: number;
      total_draft: number;
      total_belum_submit: number;
    };
  };
};

type LaporanDetail = {
  id: number;
  user: { id: number };
  periode: {
    bulan: number;
    nama_bulan: string;
    tahun: number;
    periode_text: string;
  };
  status: StatusLaporan;
  is_late: boolean;
  data_laporan: {
    total_peserta: number;
    peserta_baru_bulan_ini: number;
    total_laki_laki: number;
    total_perempuan: number;
    total_caberawit: number;
    total_praremaja: number;
    total_remaja: number;
    total_mumi: number;
    lokasi: {
      daerah: string | null;
      desa: string | null;
      kelompok: string | null;
    };
  };
  catatan: string | null;
  keterangan_reject: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

type HistoryResponse = {
  data: LaporanDetail[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

/** =========================
 * HELPERS
 * ========================= */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: StatusLaporan) {
  if (status === "draft") return "Belum Submit";
  if (status === "submitted") return "Submitted";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status;
}

function statusBadgeClass(status: StatusLaporan) {
  if (status === "draft")
    return "bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  if (status === "submitted")
    return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
  if (status === "approved")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
  if (status === "rejected")
    return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
  return "bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
}

/** =========================
 * UI PRIMITIVES (No shadcn)
 * ========================= */
function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/70 bg-white shadow-sm",
        "dark:border-zinc-800/70 dark:bg-zinc-900/50",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "success";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary:
      "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm shadow-zinc-900/10 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
    ghost:
      "bg-transparent hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
  };
  return (
    <button className={cn(base, styles[variant], className)} {...props}>
      {children}
    </button>
  );
}

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400",
        "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500",
        className,
      )}
      {...props}
    />
  );
}

function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 cursor-pointer",
        "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500",
        className,
      )}
      {...props}
    />
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-[95%] max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 sm:px-5 sm:py-4 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </div>
          <button
            className="rounded-xl p-1.5 sm:p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 shrink-0 ml-2"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

/** =========================
 * MAIN PAGE
 * ========================= */
export default function LaporanBulananPage() {
  // demo state (replace with real API)
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Parse user data to determine initial tab
  const getUserData = () => {
    try {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  };

  // Initialize activeTab based on user role
  const initialTab = (() => {
    const userData = getUserData()?.user;
    const hasAccessToStatus =
      userData?.role_id !== "219bc0dd-ec72-4618-b22d-5d5ff612dcaf";
    return hasAccessToStatus ? "status" : "history";
  })();

  const [activeTab, setActiveTab] = useState<"status" | "history">(initialTab);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<LaporanDetail | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitCatatan, setSubmitCatatan] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<StatusBulananItem | null>(
    null,
  );

  const [actionLoading, setActionLoading] = useState(false);

  // Filter states for history
  const currentYear = new Date().getFullYear();
  const [filterTahun, setFilterTahun] = useState<number>(currentYear);
  const [filterStatus, setFilterStatus] = useState<
    "" | "submitted" | "approved" | "rejected"
  >("");
  const [filterPerPage, setFilterPerPage] = useState<number>(15);

  // Parse user data from localStorage
  const dataLogin: any = (() => {
    try {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      handleApiError(error, { showToast: true });
      return null;
    }
  })();

  /** =========================
   * API CALLS
   * ========================= */

  /** =========================
   * FETCH
   * ========================= */
  async function loadStatus() {
    setLoadingStatus(true);
    try {
      const res = await getLaporanStatus();
      setStatusData(res);
    } catch (error) {
      handleApiError(error, { showToast: true });
    } finally {
      setLoadingStatus(false);
    }
  }

  async function loadHistory(page = 1) {
    setLoadingHistory(true);
    try {
      const res = await getLaporanHistory({
        page,
        tahun: filterTahun,
        status: filterStatus || undefined,
        per_page: filterPerPage,
      });
      setHistoryData(res);
    } catch (error) {
      handleApiError(error, { showToast: true });
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    if (dataLogin?.user?.role_id !== "219bc0dd-ec72-4618-b22d-5d5ff612dcaf") {
      loadStatus();
    }
  }, []);

  useEffect(() => {
    loadHistory(1);
  }, [filterTahun, filterStatus, filterPerPage]);

  /** =========================
   * DERIVED
   * ========================= */
  const summary = statusData?.data.summary;

  const headerText = useMemo(() => {
    if (!statusData) return "Laporan Bulanan";
    return `Laporan Bulanan • ${statusData.data.tahun}`;
  }, [statusData]);

  /** =========================
   * ACTIONS
   * ========================= */
  function openSubmitModal(item: StatusBulananItem) {
    setSelectedMonth(item);
    setSubmitCatatan("");
    setSubmitModalOpen(true);
  }

  async function handleSubmitMonth() {
    if (!selectedMonth) return;

    setActionLoading(true);
    try {
      const res = await submitLaporan(
        selectedMonth.bulan,
        statusData?.data.tahun ?? new Date().getFullYear(),
        submitCatatan,
      );

      // Update local UI status grid
      setStatusData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            status_bulanan: prev.data.status_bulanan.map((x) =>
              x.bulan === selectedMonth.bulan
                ? {
                    ...x,
                    status: "submitted",
                    submitted_at: res.data.submitted_at,
                    is_late: res.data.is_late,
                    laporan_id: res.data.id,
                  }
                : x,
            ),
            summary: {
              ...prev.data.summary,
              total_submitted: prev.data.summary.total_submitted + 1,
              total_draft: Math.max(0, prev.data.summary.total_draft - 1),
            },
          },
        };
      });

      setDetailData(res.data);
      setDetailModalOpen(true);
      setSubmitModalOpen(false);
      setSubmitCatatan("");
      setSelectedMonth(null);
      toast.success("Sukses", {
        description: res?.message,
        duration: 3000,
      });
    } catch (error) {
      handleApiError(error, { showToast: true });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleOpenDetail(item: StatusBulananItem) {
    // real case: GET /laporan/:id
    // sementara: bikin pseudo detail
    setDetailData({
      id: item.laporan_id ?? 0,
      user: { id: statusData?.data.user.id ?? 0 },
      periode: {
        bulan: item.bulan,
        nama_bulan: item.nama_bulan,
        tahun: statusData?.data.tahun ?? 0,
        periode_text: `${item.nama_bulan} ${statusData?.data.tahun ?? ""}`,
      },
      status: item.status,
      is_late: item.is_late,
      data_laporan: {
        total_peserta: 0,
        peserta_baru_bulan_ini: 0,
        total_laki_laki: 0,
        total_perempuan: 0,
        total_caberawit: 0,
        total_praremaja: 0,
        total_remaja: 0,
        total_mumi: 0,
        lokasi: { daerah: null, desa: null, kelompok: null },
      },
      catatan: null,
      keterangan_reject: null,
      submitted_at: item.submitted_at,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setDetailModalOpen(true);
  }

  async function handleApprove() {
    if (!detailData?.id) return;
    setActionLoading(true);
    try {
      await approveLaporan(detailData.id);

      setDetailData((prev) =>
        prev
          ? {
              ...prev,
              status: "approved",
              approved_at: new Date().toISOString(),
            }
          : prev,
      );

      // Update grid
      setStatusData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            status_bulanan: prev.data.status_bulanan.map((x) =>
              x.laporan_id === detailData.id ? { ...x, status: "approved" } : x,
            ),
            summary: {
              ...prev.data.summary,
              total_approved: prev.data.summary.total_approved + 1,
            },
          },
        };
      });
      toast.success("Sukses", {
        description: "Berhasil approve laporan bulanan",
        duration: 3000,
      });
    } catch (error) {
      handleApiError(error, { showToast: true });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!detailData?.id) return;
    if (!rejectReason.trim()) return;

    setActionLoading(true);
    try {
      await rejectLaporan(detailData.id, rejectReason);

      setDetailData((prev) =>
        prev
          ? {
              ...prev,
              status: "rejected",
              keterangan_reject: rejectReason,
            }
          : prev,
      );

      setStatusData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            status_bulanan: prev.data.status_bulanan.map((x) =>
              x.laporan_id === detailData.id ? { ...x, status: "rejected" } : x,
            ),
            summary: {
              ...prev.data.summary,
              total_rejected: prev.data.summary.total_rejected + 1,
            },
          },
        };
      });

      setRejectModalOpen(false);
      setRejectReason("");
      toast.success("Sukses", {
        description: "Berhasil menolak laporan bulanan",
        duration: 3000,
      });
    } catch (error) {
      handleApiError(error, { showToast: true });
    } finally {
      setActionLoading(false);
    }
  }

  const isAdminApprover =
    dataLogin?.user?.role_id === "219bc0dd-ec72-4618-b22d-5d5ff612dcaf";

  const canTakeAction = detailData?.status === "submitted";

  document.title = BASE_TITLE + "Laporan Bulanan";

  /** =========================
   * RENDER
   * ========================= */

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/70 rounded-2xl">
          <div className="mx-auto flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3">
            <div className="flex-1">
              <div className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                {headerText}
              </div>
              <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Kelola submit, approve, reject laporan bulanan dengan cepat.
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 sm:px-4 sm:py-2 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Login sebagai
                </div>
                <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {statusData?.data.user.nama_lengkap ?? "-"}
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => loadStatus()}
                className="shrink-0"
              >
                <span className="hidden sm:inline">↻ Refresh</span>
                <span className="sm:hidden">↻</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
            <SummaryCard
              title="Submitted"
              value={summary?.total_submitted ?? 0}
              hint="Total laporan yang sudah disubmit"
            />
            <SummaryCard
              title="Approved"
              value={summary?.total_approved ?? 0}
              hint="Laporan yang sudah disetujui"
            />
            <SummaryCard
              title="Rejected"
              value={summary?.total_rejected ?? 0}
              hint="Laporan yang ditolak"
            />
            <SummaryCard
              title="Belum Submit"
              value={summary?.total_belum_submit ?? 0}
              hint="Yang belum diproses"
            />
          </div>

          {/* Tabs */}
          <div className="mt-4 sm:mt-6 flex items-center gap-2">
            {dataLogin?.user?.role_id !==
              "219bc0dd-ec72-4618-b22d-5d5ff612dcaf" && (
              <TabButton
                active={activeTab === "status"}
                onClick={() => setActiveTab("status")}
              >
                <span className="hidden sm:inline">Status Bulanan</span>
                <span className="sm:hidden">Status</span>
              </TabButton>
            )}
            <TabButton
              active={activeTab === "history"}
              onClick={() => setActiveTab("history")}
            >
              History
            </TabButton>
          </div>

          {/* Content */}
          <div className="mt-3 sm:mt-4">
            {activeTab === "status" ? (
              <Card className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Status Laporan per Bulan
                    </div>
                    <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      Klik salah satu bulan untuk submit atau lihat detail.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 sm:px-4 sm:py-2 dark:border-zinc-800 dark:bg-zinc-900 shrink-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Warning Level
                    </div>
                    <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      {statusData?.data.user.warning_level ?? 0}
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {loadingStatus
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <MonthSkeleton key={i} />
                      ))
                    : statusData?.data.status_bulanan.map((item) => (
                        <MonthCard
                          key={item.bulan}
                          item={item}
                          onSubmit={() => openSubmitModal(item)}
                          onOpen={() => handleOpenDetail(item)}
                          loading={actionLoading}
                        />
                      ))}
                </div>
              </Card>
            ) : (
              <Card className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1">
                    <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                      History Laporan
                    </div>
                    <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      Data laporan yang pernah disubmit.
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => loadHistory(1)}
                    className="shrink-0 self-end sm:self-auto"
                  >
                    <span className="hidden sm:inline">↻ Reload</span>
                    <span className="sm:hidden">↻</span>
                  </Button>
                </div>

                {/* Filters */}
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                      Tahun:
                    </label>
                    <Select
                      value={filterTahun}
                      onChange={(e) => setFilterTahun(Number(e.target.value))}
                      className="flex-1 sm:flex-none"
                    >
                      {Array.from({ length: 5 }, (_, i) => currentYear - i).map(
                        (year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ),
                      )}
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                      Status:
                    </label>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="flex-1 sm:flex-none"
                    >
                      <option value="">Semua</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                      Per Page:
                    </label>
                    <Select
                      value={filterPerPage}
                      onChange={(e) => setFilterPerPage(Number(e.target.value))}
                      className="flex-1 sm:flex-none"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-200 text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        <th className="py-3 pr-4 font-semibold">Periode</th>
                        <th className="py-3 pr-4 font-semibold">Status</th>
                        <th className="py-3 pr-4 font-semibold">Submitted</th>
                        <th className="py-3 pr-4 font-semibold">Approved</th>
                        <th className="py-3 pr-4 font-semibold">
                          Keterlambatan
                        </th>
                        <th className="py-3 pr-4 font-semibold text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingHistory ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr
                            key={i}
                            className="border-b border-zinc-100 dark:border-zinc-800"
                          >
                            <td className="py-4 pr-4">
                              <div className="h-4 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                            </td>
                            <td className="py-4 pr-4">
                              <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                            </td>
                            <td className="py-4 pr-4">
                              <div className="h-4 w-28 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                            </td>
                            <td className="py-4 pr-4">
                              <div className="h-4 w-28 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                            </td>
                            <td className="py-4 pr-4">
                              <div className="h-4 w-10 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                            </td>
                            <td className="py-4 pr-4 text-right">
                              <div className="ml-auto h-8 w-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                            </td>
                          </tr>
                        ))
                      ) : historyData?.data.length ? (
                        historyData.data.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                          >
                            <td className="py-4 pr-4">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {row.periode.periode_text}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                ID: {row.id}
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
                                  statusBadgeClass(row.status),
                                )}
                              >
                                {statusLabel(row.status)}
                              </span>
                            </td>
                            <td className="py-4 pr-4 text-zinc-700 dark:text-zinc-300">
                              {formatDate(row.submitted_at)}
                            </td>
                            <td className="py-4 pr-4 text-zinc-700 dark:text-zinc-300">
                              {formatDate(row.approved_at)}
                            </td>
                            <td className="py-4 pr-4">
                              {row.is_late ? (
                                <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                                  Ya
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                                  Tidak
                                </span>
                              )}
                            </td>
                            <td className="py-4 pr-4 text-right">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setDetailData(row);
                                  setDetailModalOpen(true);
                                }}
                                className="text-xs sm:text-sm"
                              >
                                <span className="hidden sm:inline">
                                  Lihat Detail →
                                </span>
                                <span className="sm:hidden">Detail →</span>
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center">
                            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                              Belum ada history
                            </div>
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                              Laporan yang disubmit akan muncul di sini.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 order-2 sm:order-1">
                    Page {historyData?.meta.current_page ?? 1} /{" "}
                    {historyData?.meta.last_page ?? 1} • Total{" "}
                    {historyData?.meta.total ?? 0}
                  </div>

                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      variant="ghost"
                      disabled={!historyData?.links.prev}
                      onClick={() =>
                        loadHistory((historyData?.meta.current_page ?? 1) - 1)
                      }
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">← Prev</span>
                      <span className="sm:hidden">←</span>
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={!historyData?.links.next}
                      onClick={() =>
                        loadHistory((historyData?.meta.current_page ?? 1) + 1)
                      }
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Next →</span>
                      <span className="sm:hidden">→</span>
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Modal
        open={detailModalOpen}
        title="Detail Laporan Bulanan"
        onClose={() => setDetailModalOpen(false)}
      >
        {!detailData ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Tidak ada data.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                  {detailData.periode.periode_text}
                </div>
                <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Laporan ID:{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {detailData.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
                    statusBadgeClass(detailData.status),
                  )}
                >
                  {statusLabel(detailData.status)}
                </span>

                {detailData.is_late && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                    ⚠ Telat
                  </span>
                )}
              </div>
            </div>

            {/* Data laporan */}
            <Card className="p-4">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Ringkasan Data
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                <StatMini
                  title="Total Peserta"
                  value={detailData.data_laporan.total_peserta}
                />
                <StatMini
                  title="Peserta Baru"
                  value={detailData.data_laporan.peserta_baru_bulan_ini}
                />
                <StatMini
                  title="Laki-laki"
                  value={detailData.data_laporan.total_laki_laki}
                />
                <StatMini
                  title="Perempuan"
                  value={detailData.data_laporan.total_perempuan}
                />
                <StatMini
                  title="Caberawit"
                  value={detailData.data_laporan.total_caberawit}
                />
                <StatMini
                  title="Praremaja"
                  value={detailData.data_laporan.total_praremaja}
                />
                <StatMini
                  title="Remaja"
                  value={detailData.data_laporan.total_remaja}
                />
                <StatMini
                  title="Mumi"
                  value={detailData.data_laporan.total_mumi}
                />
              </div>
            </Card>

            {/* Info waktu */}
            <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
              <Card className="p-3 sm:p-4">
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Submitted At
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 wrap-break-word">
                  {formatDate(detailData.submitted_at)}
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Approved At
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 wrap-break-word">
                  {formatDate(detailData.approved_at)}
                </div>
              </Card>
            </div>

            {/* Catatan / Reject */}
            {detailData.catatan && (
              <Card className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Catatan
                </div>
                <div className="mt-1 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 wrap-break-word">
                  {detailData.catatan}
                </div>
              </Card>
            )}

            {detailData.keterangan_reject && (
              <Card className="p-3 sm:p-4 border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30">
                <div className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-400">
                  Keterangan Reject
                </div>
                <div className="mt-1 text-xs sm:text-sm text-rose-700 dark:text-rose-300 wrap-break-word">
                  {detailData.keterangan_reject}
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setDetailModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Tutup
              </Button>

              {isAdminApprover && canTakeAction && (
                <>
                  <Button
                    variant="danger"
                    disabled={actionLoading}
                    onClick={() => setRejectModalOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    Reject
                  </Button>

                  <Button
                    variant="success"
                    disabled={actionLoading}
                    onClick={handleApprove}
                    className="w-full sm:w-auto"
                  >
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* SUBMIT MODAL */}
      <Modal
        open={submitModalOpen}
        title="Submit Laporan Bulanan"
        onClose={() => {
          setSubmitModalOpen(false);
          setSubmitCatatan("");
          setSelectedMonth(null);
        }}
      >
        <div className="space-y-3">
          <div>
            <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              Konfirmasi Submit
            </div>
            <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Anda akan submit laporan untuk periode{" "}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {selectedMonth?.nama_bulan} {statusData?.data.tahun}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Catatan (Opsional)
            </div>
            <Textarea
              value={submitCatatan}
              onChange={(e) => setSubmitCatatan(e.target.value)}
              placeholder="Tambahkan catatan untuk laporan ini (opsional)..."
              rows={4}
              className="text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setSubmitModalOpen(false);
                setSubmitCatatan("");
                setSelectedMonth(null);
              }}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              disabled={actionLoading}
              onClick={handleSubmitMonth}
              className="w-full sm:w-auto"
            >
              {actionLoading ? "Submitting..." : "Submit Laporan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        open={rejectModalOpen}
        title="Reject Laporan"
        onClose={() => setRejectModalOpen(false)}
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Keterangan Reject
            </div>
            <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Berikan alasan jelas agar user bisa memperbaiki datanya.
            </div>
          </div>

          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Contoh: Data tidak lengkap, mohon update data peserta terlebih dahulu..."
            rows={4}
            className="text-xs sm:text-sm"
          />

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setRejectModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={!rejectReason.trim() || actionLoading}
              onClick={handleReject}
              className="w-full sm:w-auto"
            >
              Kirim Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** =========================
 * COMPONENTS
 * ========================= */
function SummaryCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: number;
  hint: string;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {title}
      </div>
      <div className="mt-1 text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
        {hint}
      </div>
    </Card>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold transition",
        active
          ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:border-zinc-800",
      )}
    >
      {children}
    </button>
  );
}

function MonthCard({
  item,
  onSubmit,
  onOpen,
  loading,
}: {
  item: StatusBulananItem;
  onSubmit: () => void;
  onOpen: () => void;
  loading: boolean;
}) {
  const canSubmit = item.status === "draft" || item.status === "belum_submit";
  const canOpen = item.status !== "draft";

  return (
    <div className="group rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
            {item.nama_bulan}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Bulan ke-{item.bulan}
          </div>
        </div>

        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-bold shrink-0",
            statusBadgeClass(item.status),
          )}
        >
          <span className="hidden sm:inline">{statusLabel(item.status)}</span>
          <span className="sm:hidden">
            {item.status === "draft" && "Belum"}
            {item.status === "submitted" && "Submit"}
            {item.status === "approved" && "✓"}
            {item.status === "rejected" && "✗"}
          </span>
        </span>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 min-w-0">
          <div className="text-xs text-zinc-500 dark:text-zinc-500">
            Submitted
          </div>
          <div className="font-semibold text-zinc-800 dark:text-zinc-300 truncate">
            {formatDate(item.submitted_at)}
          </div>
        </div>

        {item.is_late && (
          <span className="rounded-full bg-rose-50 px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 shrink-0">
            ⚠ Telat
          </span>
        )}
      </div>

      <div className="mt-3 sm:mt-4 flex items-center justify-end gap-2">
        {canOpen && (
          <Button
            variant="ghost"
            onClick={onOpen}
            className="text-xs sm:text-sm px-3"
          >
            Detail
          </Button>
        )}

        {canSubmit && (
          <Button
            variant="primary"
            disabled={loading || item?.is_submit === false}
            onClick={onSubmit}
            className="group-hover:shadow-md text-xs sm:text-sm px-3 sm:px-4"
          >
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}

function MonthSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 sm:w-28 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="h-6 w-20 sm:w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="mt-3 sm:mt-4 h-8 sm:h-10 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

function StatMini({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 line-clamp-1">
        {title}
      </div>
      <div className="mt-1 text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}
