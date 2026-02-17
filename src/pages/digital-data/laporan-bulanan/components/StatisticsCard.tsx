interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatCard({
  label,
  value,
  icon,
  variant = "default",
}: StatCardProps) {
  const variantClasses = {
    default: "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
    success:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
    warning:
      "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
    danger:
      "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30",
  };

  const valueClasses = {
    default: "text-zinc-900 dark:text-zinc-100",
    success: "text-emerald-900 dark:text-emerald-300",
    warning: "text-amber-900 dark:text-amber-300",
    danger: "text-rose-900 dark:text-rose-300",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm ${variantClasses[variant]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {label}
          </div>
          <div className={`text-2xl font-bold mt-1 ${valueClasses[variant]}`}>
            {value}
          </div>
        </div>
        {icon && <div className="text-2xl opacity-50">{icon}</div>}
      </div>
    </div>
  );
}

interface StatisticsGridProps {
  totalOperators: number;
  totalWarnings: number;
  tahun: number;
  checkedAt: string;
}

export function StatisticsGrid({
  totalOperators,
  totalWarnings,
  tahun,
  checkedAt,
}: StatisticsGridProps) {
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const warningRate =
    totalOperators > 0
      ? ((totalWarnings / totalOperators) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-4">
      {/* Info Header */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">
              Informasi Pengecekan
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              Data terakhir dicek pada:{" "}
              <span className="font-semibold">{formatDateTime(checkedAt)}</span>
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              Tahun: <span className="font-semibold">{tahun}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Total Operator"
          value={totalOperators}
          icon="👥"
          variant="default"
        />
        <StatCard
          label="Total Peringatan"
          value={totalWarnings}
          icon="⚠️"
          variant={totalWarnings > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Warning Rate"
          value={`${warningRate}%`}
          icon="📊"
          variant={parseFloat(warningRate) > 50 ? "danger" : "default"}
        />
      </div>
    </div>
  );
}
