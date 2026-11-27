import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  MessageSquareWarning,
  Package,
  Scale,
  Wallet,
} from "lucide-react";
import { getAdminDashboard, parseBarokahiinError } from "@/services/barokahiin";
import {
  ConsolePanel,
  ErrorBanner,
  InfoBanner,
  LoadingSkeleton,
  StatusBadge,
} from "../components/ui/ConsoleUi";

export type AdminTab =
  | "dashboard"
  | "review"
  | "coordinators"
  | "vouchers"
  | "finance"
  | "charity"
  | "config";

export default function AdminDashboard({
  onNavigate,
}: {
  onNavigate: (tab: AdminTab) => void;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["barokahiin", "admin", "dashboard"],
    queryFn: getAdminDashboard,
  });

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) {
    return (
      <ErrorBanner
        message={parseBarokahiinError(error, "Gagal memuat dasbor Admin.").message}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) return null;

  const ledgerBalanced = data.ledger?.balanced ?? true;
  const statusEntries = Object.entries(data.items_by_status ?? {});

  const taskCards = [
    {
      title: "Antrean review barang",
      count: data.review_queue_count ?? 0,
      desc: "SLA review 2 hari kerja",
      icon: ClipboardCheck,
      actionLabel: "Buka antrean review",
      tab: "review" as AdminTab,
    },
    {
      title: "Verifikasi alamat toko",
      count: data.pending_address_verifications ?? 0,
      desc: "Pemeriksaan V1 sampai V8",
      icon: MapPin,
      actionLabel: "Periksa alamat",
      tab: "coordinators" as AdminTab,
    },
    {
      title: "Komplain terbuka",
      count: data.open_disputes ?? 0,
      desc: "Menunggu putusan Admin",
      icon: MessageSquareWarning,
      actionLabel: "Tinjau komplain",
      tab: "finance" as AdminTab,
    },
    {
      title: "Penarikan menunggu",
      count: data.pending_payouts ?? 0,
      desc: "Proses batch Admin Keuangan",
      icon: Wallet,
      actionLabel: "Proses penarikan",
      tab: "finance" as AdminTab,
    },
  ];

  return (
    <div className="space-y-5">
      {!ledgerBalanced ? (
        <InfoBanner
          tone="danger"
          title="Selisih rekonsiliasi ledger terdeteksi"
          message={`Total entri ledger tidak nol (${data.ledger?.total_entries_sum ?? "?"}). Segera periksa halaman Keuangan dan Rekonsiliasi.`}
          action={
            <button
              type="button"
              className="brk-btn brk-btn-danger"
              onClick={() => onNavigate("finance")}
            >
              Periksa rekonsiliasi
            </button>
          }
        />
      ) : (
        <InfoBanner
          tone="success"
          title="Rekonsiliasi ledger seimbang"
          message="Seluruh saldo dompet dan entri ledger tercatat seimbang (selisih = Rp 0)."
          action={
            <button
              type="button"
              className="brk-btn brk-btn-secondary"
              onClick={() => onNavigate("finance")}
            >
              <Scale className="size-4" aria-hidden="true" />
              <span>Lihat rincian ledger</span>
            </button>
          }
        />
      )}

      {/* Task cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {taskCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="brk-card flex flex-col justify-between p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--muted-brk)" }}
                  >
                    {card.title}
                  </span>
                  <Icon
                    className="size-5"
                    style={{ color: "var(--indigo)" }}
                    aria-hidden="true"
                  />
                </div>
                <p className="brk-display brk-num mt-2 text-3xl font-bold">
                  {card.count}
                </p>
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--muted-brk)" }}
                >
                  {card.desc}
                </p>
              </div>
              <button
                type="button"
                className="brk-btn brk-btn-secondary mt-4 w-full"
                onClick={() => onNavigate(card.tab)}
              >
                {card.actionLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* Items by status */}
      <ConsolePanel
        icon={Package}
        title="Distribusi barang seluruh wilayah"
        description="Status pasokan dari draf, antrean review, terbit, ditahan, hingga terjual."
      >
        {statusEntries.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted-brk)" }}>
            Belum ada data barang.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statusEntries.map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5"
                style={{
                  backgroundColor: "var(--kertas)",
                  borderColor: "var(--garis)",
                }}
              >
                <div className="min-w-0">
                  <StatusBadge value={status} />
                </div>
                <span className="brk-display brk-num shrink-0 text-2xl font-bold">
                  {Number(count) || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </ConsolePanel>

      <div
        className="flex items-center gap-2 rounded-xl border px-4 py-3 text-xs"
        style={{
          backgroundColor: "var(--putih)",
          borderColor: "var(--garis)",
          color: "var(--muted-brk)",
        }}
      >
        <CheckCircle2
          className="size-4 shrink-0"
          style={{ color: "var(--daun)" }}
          aria-hidden="true"
        />
        <span>
          Seluruh tindakan persetujuan, sanksi, koreksi ledger, dan perubahan konfigurasi tercatat otomatis di Audit Log.
        </span>
      </div>
    </div>
  );
}
