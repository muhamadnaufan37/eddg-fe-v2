import type { PindahSambungItem } from "@/services/pindahSambungService";

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

function statusBadgeClass(status: string) {
  if (status === "pending")
    return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
  if (status === "approved")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
  if (status === "rejected")
    return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
  if (status === "reverted")
    return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
  return "bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
}

interface PindahSambungCardProps {
  item: PindahSambungItem;
  onViewHistory: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onRevert?: () => void;
}

export function PindahSambungCard({
  item,
  onViewHistory,
  onApprove,
  onReject,
  onRevert,
}: PindahSambungCardProps) {
  return (
    <div className="group rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 grid place-items-center text-base font-bold text-white dark:text-zinc-900">
              {item.peserta.nama_lengkap
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {item.peserta.nama_lengkap}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {item.peserta.kode_cari_data}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shrink-0",
              statusBadgeClass(item.status),
            )}
          >
            {item.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Lokasi */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Lokasi Asal
          </div>
          <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.lokasi_asal.formatted}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Lokasi Tujuan
            {item.lokasi_tujuan.is_new_location && (
              <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                (New)
              </span>
            )}
          </div>
          <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.lokasi_tujuan.formatted}
          </div>
        </div>
      </div>

      {/* Alasan */}
      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Alasan Pindah
        </div>
        <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          {item.alasan_pindah}
        </div>
      </div>

      {/* Keterangan Reject/Revert */}
      {item.keterangan_reject && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="text-xs font-semibold text-rose-800 dark:text-rose-400">
            Keterangan {item.status === "reverted" ? "Revert" : "Reject"}
          </div>
          <div className="mt-1 text-sm text-rose-700 dark:text-rose-300">
            {item.keterangan_reject}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <div>
          <span className="font-semibold">Requested by:</span>{" "}
          {item.requested_by.nama_lengkap}
        </div>
        <div>
          <span className="font-semibold">Created:</span>{" "}
          {formatDate(item.created_at)}
        </div>
        {item.approved_at && (
          <>
            <div>
              <span className="font-semibold">Approved by:</span>{" "}
              {item.approved_by.nama_lengkap || "-"}
            </div>
            <div>
              <span className="font-semibold">Approved at:</span>{" "}
              {formatDate(item.approved_at)}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={onViewHistory}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          View History
        </button>

        {item.status === "pending" && onApprove && (
          <button
            onClick={onApprove}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            Approve
          </button>
        )}

        {item.status === "pending" && onReject && (
          <button
            onClick={onReject}
            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
          >
            Reject
          </button>
        )}

        {item.status === "approved" && onRevert && (
          <button
            onClick={onRevert}
            className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            Revert
          </button>
        )}
      </div>
    </div>
  );
}
