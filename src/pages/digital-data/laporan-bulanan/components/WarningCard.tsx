import type { WarningItem } from "@/services/warningService";

interface WarningCardProps {
  warning: WarningItem;
}

function getWarningBadgeClass(level: number): string {
  switch (level) {
    case 0:
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
    case 1:
      return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
    case 2:
      return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
    default:
      return "bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  }
}

function getWarningIcon(level: number): string {
  switch (level) {
    case 0:
      return "✓";
    case 1:
      return "⚠";
    case 2:
      return "⚠";
    default:
      return "•";
  }
}

export function WarningCard({ warning }: WarningCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {warning.user.nama_lengkap}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              @{warning.user.username}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${getWarningBadgeClass(warning.warning_level)}`}
          >
            <span>{getWarningIcon(warning.warning_level)}</span>
            <span>{warning.warning_label}</span>
          </span>
        </div>

        {/* Location */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            Lokasi
          </div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {warning.user.lokasi.daerah} &gt; {warning.user.lokasi.desa} &gt;{" "}
            {warning.user.lokasi.kelompok}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Missing
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {warning.total_missing}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Consecutive
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {warning.consecutive_missing}
            </div>
          </div>
        </div>

        {/* Missing Months */}
        {warning.missing_months.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Bulan Belum Submit ({warning.missing_months.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {warning.missing_months.map((month, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
