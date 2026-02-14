import React, { useEffect, useMemo, useState } from "react";
import { checkUsers } from "@/services/laporanBulananService";
import { handleApiError } from "@/utils/errorUtils";

/**
 * Monitoring Laporan Bulanan - UI (React TSX + TailwindCSS)
 *
 * Catatan:
 * - Komponen ini fokus ke desain & presentasi data API /check-users
 * - Tidak pakai shadcn supaya kamu bisa langsung copas.
 * - Kalau kamu mau versi shadcn (Card, Badge, Tabs, Table, Dialog) bilang ya.
 */

// ============================
// Types
// ============================

type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    tahun: number;
    checked_at: string;
    total_users: number;
    users_data: UserMonitoring[];
    summary: {
      total_tepat_waktu: number;
      total_terlambat: number;
      total_belum_submit: number;
      rata_rata_kepatuhan: number;
    };
  };
};

type UserMonitoring = {
  user: {
    id: number;
    nama_lengkap: string;
    username: string;
    lokasi: {
      daerah: string | null;
      desa: string | null;
      kelompok: string | null;
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
    performa: "Excellent" | "Good" | "Needs Improvement" | "Poor" | string;
  };
  laporan_per_bulan: {
    bulan: number;
    nama_bulan: string;
    status: "submitted" | "belum_submit" | string;
    is_late: boolean | null;
    submitted_at: string | null;
    laporan_status: "approved" | "rejected" | null | string;
  }[];
};

// ============================
// Helpers
// ============================

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPerfTone(perf: string) {
  const p = perf.toLowerCase();
  if (p.includes("excellent"))
    return {
      ring: "ring-emerald-200 dark:ring-emerald-900/50",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500 dark:bg-emerald-400",
      label: "Excellent",
    };
  if (p.includes("good"))
    return {
      ring: "ring-sky-200 dark:ring-sky-900/50",
      bg: "bg-sky-50 dark:bg-sky-950/30",
      text: "text-sky-700 dark:text-sky-400",
      dot: "bg-sky-500 dark:bg-sky-400",
      label: "Good",
    };
  if (p.includes("average") || p.includes("needs"))
    return {
      ring: "ring-amber-200 dark:ring-amber-900/50",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500 dark:bg-amber-400",
      label: "Average",
    };

  return {
    ring: "ring-zinc-200 dark:ring-zinc-800",
    bg: "bg-zinc-50 dark:bg-zinc-900",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-zinc-500 dark:bg-zinc-400",
    label: perf,
  };
}

function getMonthTone(item: {
  status: string;
  laporan_status: string | null;
  is_late: boolean | null;
}) {
  // Priority: rejected > approved > submitted > belum_submit
  if ((item.laporan_status || "").toLowerCase() === "rejected")
    return {
      bg: "bg-rose-50 dark:bg-rose-950/30",
      ring: "ring-rose-200 dark:ring-rose-900/50",
      text: "text-rose-700 dark:text-rose-400",
      badge: "Rejected",
    };
  if ((item.laporan_status || "").toLowerCase() === "approved")
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      ring: "ring-emerald-200 dark:ring-emerald-900/50",
      text: "text-emerald-700 dark:text-emerald-400",
      badge: item.is_late ? "Approved (Late)" : "Approved",
    };
  if ((item.status || "").toLowerCase() === "submitted")
    return {
      bg: "bg-sky-50 dark:bg-sky-950/30",
      ring: "ring-sky-200 dark:ring-sky-900/50",
      text: "text-sky-700 dark:text-sky-400",
      badge: item.is_late ? "Submitted (Late)" : "Submitted",
    };

  return {
    bg: "bg-zinc-50 dark:bg-zinc-900",
    ring: "ring-zinc-200 dark:ring-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    badge: "Belum Submit",
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ============================
// UI Pieces
// ============================

function Chip({
  children,
  tone = "zinc",
}: {
  children: React.ReactNode;
  tone?: "zinc" | "emerald" | "sky" | "amber" | "rose";
}) {
  const map = {
    zinc: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
    emerald:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/50",
    sky: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:ring-sky-900/50",
    amber:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/50",
    rose: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-900/50",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = clamp(value, 0, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </p>
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {v}%
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
        <div
          className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {value}
        </p>
        {hint ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function UserCard({
  item,
  selectedMonth,
}: {
  item: UserMonitoring;
  selectedMonth: number | "all";
}) {
  const perf = getPerfTone(item.statistik.performa);

  const filteredMonths =
    selectedMonth === "all"
      ? item.laporan_per_bulan
      : item.laporan_per_bulan.filter((m) => m.bulan === selectedMonth);

  return (
    <div className="group rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-1 h-10 w-10 shrink-0 rounded-2xl bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400",
                "grid place-items-center text-sm font-semibold text-white dark:text-zinc-900",
              )}
              title={`User ID: ${item.user.id}`}
            >
              {item.user.nama_lengkap
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {item.user.nama_lengkap}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  @{item.user.username}
                </span>
                <span className="text-xs text-zinc-300 dark:text-zinc-700">
                  •
                </span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {item.user.lokasi.daerah || "-"}
                  {item.user.lokasi.desa ? ` / ${item.user.lokasi.desa}` : ""}
                  {item.user.lokasi.kelompok
                    ? ` / ${item.user.lokasi.kelompok}`
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
              perf.bg,
              perf.text,
              perf.ring,
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", perf.dot)} />
            {perf.label}
          </span>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Kepatuhan
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {item.statistik.persentase_kepatuhan}%
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Submit
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {item.statistik.total_submit}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tepat Waktu
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {item.statistik.tepat_waktu}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Terlambat</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {item.statistik.terlambat}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Belum Submit
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {item.statistik.belum_submit}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <ProgressBar
            value={item.statistik.persentase_tepat_waktu}
            label="Tepat waktu"
          />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <ProgressBar
            value={item.statistik.persentase_terlambat}
            label="Terlambat"
          />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <ProgressBar
            value={item.statistik.persentase_kepatuhan}
            label="Kepatuhan"
          />
        </div>
      </div>

      {/* Months */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Laporan per Bulan
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {filteredMonths.length} bulan ditampilkan
          </p>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredMonths.map((m) => {
            const tone = getMonthTone(m);
            return (
              <div
                key={`${item.user.id}-${m.bulan}`}
                className={cn("rounded-2xl p-4 ring-1", tone.bg, tone.ring)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={cn("text-sm font-semibold", tone.text)}>
                      {m.nama_bulan}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      Submit: {formatDate(m.submitted_at)}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      tone.bg,
                      tone.ring,
                      tone.text,
                    )}
                  >
                    {tone.badge}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {m.status === "belum_submit" ? (
                    <Chip tone="zinc">Belum ada laporan</Chip>
                  ) : (
                    <>
                      <Chip tone={m.is_late ? "amber" : "emerald"}>
                        {m.is_late ? "Terlambat" : "Tepat waktu"}
                      </Chip>
                      <Chip
                        tone={
                          (m.laporan_status || "")
                            .toLowerCase()
                            .includes("reject")
                            ? "rose"
                            : "sky"
                        }
                      >
                        Status: {m.laporan_status || "-"}
                      </Chip>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          User ID: <span className="font-medium">{item.user.id}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
            Detail
          </button>
          <button className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            Kirim Reminder
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================
// Main Page
// ============================

export default function MonitoringLaporanBulananPage() {
  const currentYear = new Date().getFullYear();

  const [api, setApi] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tahunFilter, setTahunFilter] = useState<number>(currentYear);

  // Filter states
  const [query, setQuery] = useState<string>("");
  const [perfFilter, setPerfFilter] = useState<
    "all" | "Excellent" | "Good" | "Average"
  >("all");
  const [month, setMonth] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<
    "kepatuhan_desc" | "kepatuhan_asc" | "belum_submit_desc"
  >("kepatuhan_desc");

  // Fetch data from API
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await checkUsers(tahunFilter);
        setApi(response);
      } catch (error) {
        handleApiError(error, { showToast: true });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tahunFilter]);

  const users = api?.data.users_data || [];

  const filtered = useMemo(() => {
    let list = [...users];

    // search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((x) => {
        const loc = `${x.user.lokasi.daerah || ""} ${x.user.lokasi.desa || ""} ${x.user.lokasi.kelompok || ""}`;
        return (
          x.user.nama_lengkap.toLowerCase().includes(q) ||
          x.user.username.toLowerCase().includes(q) ||
          loc.toLowerCase().includes(q)
        );
      });
    }

    // performance
    if (perfFilter !== "all") {
      list = list.filter((x) => x.statistik.performa === perfFilter);
    }

    // month
    if (month !== "all") {
      list = list.filter((x) =>
        x.laporan_per_bulan.some((m) => m.bulan === month),
      );
    }

    // sorting
    if (sortBy === "kepatuhan_desc") {
      list.sort(
        (a, b) =>
          b.statistik.persentase_kepatuhan - a.statistik.persentase_kepatuhan,
      );
    }
    if (sortBy === "kepatuhan_asc") {
      list.sort(
        (a, b) =>
          a.statistik.persentase_kepatuhan - b.statistik.persentase_kepatuhan,
      );
    }
    if (sortBy === "belum_submit_desc") {
      list.sort((a, b) => b.statistik.belum_submit - a.statistik.belum_submit);
    }

    return list;
  }, [users, query, perfFilter, month, sortBy]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100 mx-auto" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Loading data...
          </p>
        </div>
      </div>
    );
  }

  if (!api) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Failed to load data
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Monitoring Laporan Bulanan
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Kepatuhan User • Tahun {api.data.tahun}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Update terakhir:{" "}
              <span className="font-medium">
                {formatDate(api.data.checked_at)}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="sky">Total User: {api.data.total_users}</Chip>
            <Chip tone="emerald">
              Tepat Waktu: {api.data.summary.total_tepat_waktu}
            </Chip>
            <Chip tone="rose">
              Belum Submit: {api.data.summary.total_belum_submit}
            </Chip>
            <Chip tone="amber">
              Rata-rata: {api.data.summary.rata_rata_kepatuhan}%
            </Chip>
          </div>
        </div>

        {/* Big Summary Cards */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tepat Waktu"
            value={api.data.summary.total_tepat_waktu}
            hint="akumulasi semua bulan"
          />
          <StatCard
            title="Total Terlambat"
            value={api.data.summary.total_terlambat}
            hint="akumulasi semua bulan"
          />
          <StatCard
            title="Total Belum Submit"
            value={api.data.summary.total_belum_submit}
            hint="akumulasi semua bulan"
          />
          <StatCard
            title="Rata-rata Kepatuhan"
            value={`${api.data.summary.rata_rata_kepatuhan}%`}
            hint="semua user"
          />
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
            <div className="md:col-span-4">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Cari user / username / lokasi
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: cikampek, jatiluhur, sensus_..."
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tahun
              </label>
              <select
                value={tahunFilter}
                onChange={(e) => setTahunFilter(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(
                  (year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Filter performa
              </label>
              <select
                value={perfFilter}
                onChange={(e) => setPerfFilter(e.target.value as any)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
              >
                <option value="all">Semua</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Bulan
              </label>
              <select
                value={month}
                onChange={(e) =>
                  setMonth(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  )
                }
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
              >
                <option value="all">Semua</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Bulan {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Urutkan
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
              >
                <option value="kepatuhan_desc">Kepatuhan tertinggi</option>
                <option value="kepatuhan_asc">Kepatuhan terendah</option>
                <option value="belum_submit_desc">
                  Belum submit terbanyak
                </option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Menampilkan{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {filtered.length}
              </span>{" "}
              user
            </p>

            <button
              onClick={() => {
                setQuery("");
                setPerfFilter("all");
                setMonth("all");
                setSortBy("kepatuhan_desc");
                setTahunFilter(currentYear);
              }}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {users.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Belum ada data user
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Tidak ada data monitoring untuk tahun {tahunFilter}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Tidak ada hasil
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Coba ubah kata kunci pencarian atau filter performa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((item) => (
              <UserCard key={item.user.id} item={item} selectedMonth={month} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
