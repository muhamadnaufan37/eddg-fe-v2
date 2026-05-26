import { useEffect, useMemo, useState } from "react";
import { Clock3, Filter, Search, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BASE_TITLE } from "@/store/actions";
import { getLocalStorage } from "@/services/localStorageService";
import { useFetchOptions } from "@/hooks/useFetchOptions";
import {
  checkUsers,
  type CheckUsersFilters,
} from "@/services/laporanBulananService";
import {
  fetchDesaByDaerah,
  fetchKelompokByDesa,
} from "@/services/sensusService";
import { handleApiError } from "@/utils/errorUtils";

interface MonitoringUsersResponse {
  success: boolean;
  message: string;
  data: {
    tahun: number;
    checked_at: string;
    total_users: number;
    users_data: UsersData[];
    summary: {
      total_tepat_waktu: number;
      total_terlambat: number;
      total_belum_submit: number;
      rata_rata_kepatuhan: number;
    };
    filters: {
      search: string | null;
      tahun: number;
      bulan: number | null;
      status_bulan: string | null;
      laporan_status: string | null;
      is_late: 0 | 1 | null;
      performa: string | null;
      min_kepatuhan: number | null;
      max_kepatuhan: number | null;
      daerah_id: number | string | null;
      desa_id: number | string | null;
      kelompok_id: number | string | null;
      sort_by: string;
      sort_dir: string;
      per_page: number;
    };
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

interface UsersData {
  user: {
    id: number;
    nama_lengkap: string;
    username: string;
    lokasi: {
      daerah: string;
      desa?: string;
      kelompok?: string;
    };
  };
  statistik: {
    total_submit: number;
    tepat_waktu: number;
    terlambat: number;
    belum_submit: number;
    persentase_tepat_waktu: number;
    persentase_terlambat: number;
    persentase_kepatuhan: number;
    performa: string;
  };
  laporan_per_bulan: {
    bulan: number;
    nama_bulan: string;
    status: string;
    is_late: boolean | null;
    submitted_at: string | null;
    laporan_status: string | null;
  }[];
}

interface Option {
  value: string | number;
  label: string;
}

const currentYear = new Date().getFullYear();
const allowedRoleId = "219bc0dd-ec72-4618-b22d-5d5ff612dcaf";

const PERFORMANCE_OPTIONS = [
  "Excellent",
  "Good",
  "Average",
  "Needs Improvement",
  "Poor",
];

const SORT_BY_OPTIONS = [
  { label: "Kepatuhan", value: "kepatuhan" },
  { label: "Performa", value: "performa" },
  { label: "Nama", value: "nama" },
  { label: "Tepat Waktu", value: "tepat_waktu" },
  { label: "Terlambat", value: "terlambat" },
  { label: "Belum Submit", value: "belum_submit" },
];

const STATUS_BADGE: Record<string, string> = {
  submitted: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  belum_submit: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const PERFORMANCE_BADGE: Record<string, string> = {
  excellent:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  good: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  average:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "needs improvement":
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  poor: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function MonthChip({ item }: { item: UsersData["laporan_per_bulan"][number] }) {
  const isLateLabel =
    item.is_late === null ? "-" : item.is_late ? "Terlambat" : "Tepat waktu";
  const statusClass =
    STATUS_BADGE[(item.status || "belum_submit").toLowerCase()] ??
    STATUS_BADGE.belum_submit;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {item.nama_bulan}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Submit: {formatDate(item.submitted_at)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            statusClass,
          )}
        >
          {item.laporan_status || item.status || "-"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700">
          Status: {item.status}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700">
          {isLateLabel}
        </span>
      </div>
    </div>
  );
}

function UserCard({ item }: { item: UsersData }) {
  const perfClass =
    PERFORMANCE_BADGE[item.statistik.performa.toLowerCase()] ??
    PERFORMANCE_BADGE.average;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {item.user.nama_lengkap
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {item.user.nama_lengkap}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                @{item.user.username}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {item.user.lokasi.daerah}
                {item.user.lokasi.desa ? ` / ${item.user.lokasi.desa}` : ""}
                {item.user.lokasi.kelompok
                  ? ` / ${item.user.lokasi.kelompok}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              perfClass,
            )}
          >
            {item.statistik.performa}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Kepatuhan {item.statistik.persentase_kepatuhan}%
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBox label="Total Submit" value={item.statistik.total_submit} />
        <StatBox label="Tepat Waktu" value={item.statistik.tepat_waktu} />
        <StatBox label="Terlambat" value={item.statistik.terlambat} />
        <StatBox label="Belum Submit" value={item.statistik.belum_submit} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <StatBox
          label="% Tepat Waktu"
          value={`${item.statistik.persentase_tepat_waktu}%`}
        />
        <StatBox
          label="% Terlambat"
          value={`${item.statistik.persentase_terlambat}%`}
        />
        <StatBox
          label="% Kepatuhan"
          value={`${item.statistik.persentase_kepatuhan}%`}
        />
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Laporan Per Bulan
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {item.laporan_per_bulan.length} bulan
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {item.laporan_per_bulan.map((laporan) => (
            <MonthChip
              key={`${item.user.id}-${laporan.bulan}`}
              item={laporan}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MonitoringUsersPage() {
  const currentYear = new Date().getFullYear();
  const dataLogin = getLocalStorage("userData");
  const { fetchOptions } = useFetchOptions();

  const [daerahOptions, setDaerahOptions] = useState<Option[]>([]);
  const [desaOptions, setDesaOptions] = useState<Option[]>([]);
  const [kelompokOptions, setKelompokOptions] = useState<Option[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [loadingDesa, setLoadingDesa] = useState(false);
  const [loadingKelompok, setLoadingKelompok] = useState(false);
  const [filters, setFilters] = useState<CheckUsersFilters>({
    tahun: currentYear,
    per_page: 10,
    page: 1,
    sort_by: "kepatuhan",
    sort_dir: "desc",
    daerah_id: dataLogin?.user?.akses_daerah || undefined,
    desa_id: dataLogin?.user?.akses_desa || undefined,
    kelompok_id: dataLogin?.user?.akses_kelompok || undefined,
  });

  const isAdmin = String(dataLogin?.user?.role_id || "") === allowedRoleId;

  const queryParams = useMemo(() => filters, [filters]);

  const loadDesaOptions = async (daerahId: string) => {
    if (!daerahId) {
      setDesaOptions([]);
      return;
    }

    setLoadingDesa(true);
    try {
      const response = await fetchDesaByDaerah(daerahId);
      const options = Array.isArray(response?.data_tempat_sambung)
        ? response.data_tempat_sambung.map((item: any) => ({
            value: item.id,
            label: item.nama_desa,
          }))
        : [];
      setDesaOptions(options);
    } catch (error) {
      setDesaOptions([]);
      handleApiError(error, { showToast: true });
    } finally {
      setLoadingDesa(false);
    }
  };

  const loadKelompokOptions = async (desaId: string) => {
    if (!desaId) {
      setKelompokOptions([]);
      return;
    }

    setLoadingKelompok(true);
    try {
      const response = await fetchKelompokByDesa(desaId);
      const options = Array.isArray(response?.data_tempat_sambung)
        ? response.data_tempat_sambung.map((item: any) => ({
            value: item.id,
            label: item.nama_kelompok,
          }))
        : [];
      setKelompokOptions(options);
    } catch (error) {
      setKelompokOptions([]);
      handleApiError(error, { showToast: true });
    } finally {
      setLoadingKelompok(false);
    }
  };

  const monitoringQuery = useQuery<MonitoringUsersResponse, Error>({
    queryKey: ["monitoring-users", queryParams],
    queryFn: async (): Promise<MonitoringUsersResponse> => {
      try {
        const response = await checkUsers(queryParams);
        return response as MonitoringUsersResponse;
      } catch (err) {
        handleApiError(err, { showToast: true });
        throw err;
      }
    },
    enabled: isAdmin,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    async function loadDaerah() {
      const options = await fetchOptions(
        "/api/v1/daerah/all",
        "data_tempat_sambung",
        "nama_daerah",
      );
      setDaerahOptions(options);
    }

    loadDaerah();
  }, [fetchOptions]);

  useEffect(() => {
    document.title = BASE_TITLE + "Monitoring User";
  }, []);

  const api = monitoringQuery.data;
  const isLoading = monitoringQuery.isLoading;
  const isFetching = monitoringQuery.isFetching;
  const isError = monitoringQuery.isError;
  const error = monitoringQuery.error;
  const apiData = api?.data;
  const users: UsersData[] = apiData?.users_data || [];
  const pagination = apiData?.pagination;
  const currentPage = pagination?.current_page ?? 1;
  const lastPage = pagination?.last_page ?? 1;
  const totalItems = pagination?.total ?? 0;
  const updateFilter = <K extends keyof CheckUsersFilters>(
    key: K,
    value: CheckUsersFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setSearchInput("");
    setFilters({
      tahun: currentYear,
      per_page: 10,
      page: 1,
      sort_by: "kepatuhan",
      sort_dir: "desc",
      daerah_id: dataLogin?.user?.akses_daerah || undefined,
      desa_id: dataLogin?.user?.akses_desa || undefined,
      kelompok_id: dataLogin?.user?.akses_kelompok || undefined,
    });
  };

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
      page: 1,
    }));
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Akses ditolak
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Halaman monitoring user hanya untuk admin.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && !api) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
          <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Memuat monitoring user...
          </p>
        </div>
      </div>
    );
  }

  if (isError && !api) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Gagal memuat data
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Silakan coba lagi nanti.
        </p>
        {error instanceof Error && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {error.message}
          </p>
        )}
      </div>
    );
  }

  if (!apiData) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Monitoring User
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Kepatuhan Laporan Bulanan Tahun {apiData.tahun}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Update terakhir: {formatDate(apiData.checked_at)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatBox label="Total User" value={apiData.total_users} />
            <StatBox
              label="Tepat Waktu"
              value={apiData.summary.total_tepat_waktu}
            />
            <StatBox
              label="Terlambat"
              value={apiData.summary.total_terlambat}
            />
            <StatBox
              label="Belum Submit"
              value={apiData.summary.total_belum_submit}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Rata-rata Kepatuhan
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {apiData.summary.rata_rata_kepatuhan}%
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 md:col-span-2 xl:col-span-3">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Filters aktif
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                Tahun: {apiData.filters.tahun}
              </span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                Bulan: {apiData.filters.bulan ?? "Semua"}
              </span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                Status Bulan: {apiData.filters.status_bulan ?? "Semua"}
              </span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                Laporan Status: {apiData.filters.laporan_status ?? "Semua"}
              </span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                Performa: {apiData.filters.performa ?? "Semua"}
              </span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                Sort: {apiData.filters.sort_by} / {apiData.filters.sort_dir}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Filter Data
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Cari nama / username
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Cari user..."
                className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Tahun
            </span>
            <select
              value={filters.tahun}
              onChange={(e) => updateFilter("tahun", Number(e.target.value))}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {Array.from({ length: 5 }, (_, index) => currentYear - index).map(
                (year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Bulan
            </span>
            <select
              value={filters.bulan ?? ""}
              onChange={(e) =>
                updateFilter(
                  "bulan",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Semua</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map(
                (bulan) => (
                  <option key={bulan} value={bulan}>
                    {bulan}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Daerah
            </span>
            <select
              value={filters.daerah_id ?? ""}
              onChange={(e) =>
                setFilters((prev) => {
                  const nextDaerah = e.target.value || undefined;
                  if (nextDaerah !== prev.daerah_id) {
                    void loadDesaOptions(String(nextDaerah || ""));
                  }
                  return {
                    ...prev,
                    daerah_id: nextDaerah,
                    desa_id: undefined,
                    kelompok_id: undefined,
                    page: 1,
                  };
                })
              }
              onFocus={() => {
                if (filters.daerah_id && desaOptions.length === 0) {
                  void loadDesaOptions(String(filters.daerah_id));
                }
              }}
              disabled={!!dataLogin?.user?.akses_daerah}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Semua Daerah</option>
              {daerahOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Desa
            </span>
            <select
              value={filters.desa_id ?? ""}
              onChange={(e) =>
                setFilters((prev) => {
                  const nextDesa = e.target.value || undefined;
                  if (nextDesa !== prev.desa_id) {
                    void loadKelompokOptions(String(nextDesa || ""));
                  }
                  return {
                    ...prev,
                    desa_id: nextDesa,
                    kelompok_id: undefined,
                    page: 1,
                  };
                })
              }
              onFocus={() => {
                if (filters.desa_id && kelompokOptions.length === 0) {
                  void loadKelompokOptions(String(filters.desa_id));
                }
              }}
              disabled={!filters.daerah_id || !!dataLogin?.user?.akses_desa}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Semua Desa</option>
              {desaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Kelompok
            </span>
            <select
              value={filters.kelompok_id ?? ""}
              onChange={(e) =>
                updateFilter("kelompok_id", e.target.value || undefined)
              }
              disabled={!filters.desa_id || !!dataLogin?.user?.akses_kelompok}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Semua Kelompok</option>
              {kelompokOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {(loadingDesa || loadingKelompok) && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Memuat opsi lokasi...
              </p>
            )}
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Status Laporan
            </span>
            <select
              value={filters.laporan_status ?? ""}
              onChange={(e) =>
                updateFilter("laporan_status", e.target.value || undefined)
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Semua</option>
              <option value="rejected">Rejected</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Performa
            </span>
            <select
              value={filters.performa ?? ""}
              onChange={(e) =>
                updateFilter("performa", e.target.value || undefined)
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Semua</option>
              {PERFORMANCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Is Late
            </span>
            <select
              value={filters.is_late ?? ""}
              onChange={(e) =>
                updateFilter(
                  "is_late",
                  e.target.value === ""
                    ? undefined
                    : (Number(e.target.value) as 0 | 1),
                )
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Semua</option>
              <option value="1">Terlambat</option>
              <option value="0">Tepat Waktu</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Min Kepatuhan
            </span>
            <input
              type="number"
              value={filters.min_kepatuhan ?? ""}
              onChange={(e) =>
                updateFilter(
                  "min_kepatuhan",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Max Kepatuhan
            </span>
            <input
              type="number"
              value={filters.max_kepatuhan ?? ""}
              onChange={(e) =>
                updateFilter(
                  "max_kepatuhan",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Sort By
            </span>
            <select
              value={filters.sort_by}
              onChange={(e) => updateFilter("sort_by", e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {SORT_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Sort Dir
            </span>
            <select
              value={filters.sort_dir}
              onChange={(e) =>
                updateFilter("sort_dir", e.target.value as "asc" | "desc")
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Cari Data
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Reset
          </button>
          <div className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
            <Clock3 className="mr-1 inline h-4 w-4" />
            {isFetching
              ? "Memperbarui data..."
              : `Menampilkan ${totalItems} data`}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Tidak ada data
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Coba ubah filter pencarian.
            </p>
          </div>
        ) : (
          users.map((item) => <UserCard key={item.user.id} item={item} />)
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Halaman{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {currentPage}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {lastPage}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Per halaman
            </label>
            <select
              value={filters.per_page}
              onChange={(e) => updateFilter("per_page", Number(e.target.value))}
              className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.max(1, (prev.page || 1) - 1),
                }))
              }
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Prev
            </button>

            <button
              type="button"
              disabled={currentPage >= lastPage}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
              }
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
