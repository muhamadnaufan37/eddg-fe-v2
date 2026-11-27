import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardList,
  Package,
  Plus,
  Store,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  acceptPriceSuggestion,
  getConsoleDashboard,
  parseBarokahiinError,
} from "@/services/barokahiin";
import {
  ConsolePanel,
  EmptyState,
  ErrorBanner,
  InfoBanner,
  LevelBadge,
  LoadingSkeleton,
  SlaBadge,
  StatusBadge,
} from "../components/ui/ConsoleUi";
import {
  computeHoursRemaining,
  formatDateId,
  formatRupiah,
} from "../components/ui/utils";

export type CoordinatorTab =
  | "dashboard"
  | "store"
  | "donors"
  | "items"
  | "orders"
  | "wallet"
  | "charity"
  | "guide";

export default function CoordinatorDashboard({
  onNavigate,
}: {
  onNavigate: (tab: CoordinatorTab) => void;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["barokahiin", "console", "dashboard"],
    queryFn: getConsoleDashboard,
  });

  const acceptSuggestionMut = useMutation({
    mutationFn: ({
      itemUuid,
      suggestionUuid,
    }: {
      itemUuid: string;
      suggestionUuid: string;
    }) => acceptPriceSuggestion(itemUuid, suggestionUuid),
    onSuccess: () => {
      toast.success("Saran turun harga diterapkan");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => {
      toast.error(parseBarokahiinError(err).message);
    },
  });

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) {
    return (
      <ErrorBanner
        message={parseBarokahiinError(error, "Gagal memuat dasbor koordinator.").message}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) return null;

  const addressVerified =
    data.store?.address_verified ||
    data.store?.address_status === "terverifikasi" ||
    data.store?.status === "aktif";

  const statusEntries = Object.entries(data.items_by_status ?? {});
  const rawOrders = data.orders_to_fulfill;
  const ordersToFulfill = Array.isArray(rawOrders)
    ? rawOrders
    : rawOrders && typeof rawOrders === "object" && Array.isArray(rawOrders.items)
      ? rawOrders.items
      : [];
  const ordersToFulfillCount =
    typeof rawOrders === "number"
      ? rawOrders
      : rawOrders &&
          typeof rawOrders === "object" &&
          !Array.isArray(rawOrders) &&
          typeof rawOrders.count === "number"
        ? rawOrders.count
        : ordersToFulfill.length;
  const priceSuggestions = Array.isArray(data.price_suggestions)
    ? data.price_suggestions
    : [];
  const activeSanctions = Array.isArray(data.active_sanctions)
    ? data.active_sanctions
    : [];
  const revisionItems = Array.isArray(data.revision_items)
    ? data.revision_items
    : [];

  return (
    <div className="space-y-5">
      {!addressVerified && (
        <InfoBanner
          tone="warning"
          title="Alamat toko belum terverifikasi"
          message="Alamat tokomu belum terverifikasi, jadi barang belum bisa diajukan atau diterbitkan. Lengkapi data alamat, pin peta, foto lokasi, dan bukti alamat lalu ajukan verifikasi."
          action={
            <button
              type="button"
              className="brk-btn brk-btn-primary"
              onClick={() => onNavigate("store")}
            >
              <Store className="size-4" aria-hidden="true" />
              <span>Buka Toko saya</span>
            </button>
          }
        />
      )}

      {data.store?.status === "dijeda" && (
        <InfoBanner
          tone="info"
          title="Toko sedang dijeda (cuti)"
          message={`Toko sedang libur${data.store.paused_until ? ` sampai ${formatDateId(data.store.paused_until, false)}` : ""}. Pesanan yang sudah dibayar tetap wajib diselesaikan sesuai SLA.`}
          action={
            <button
              type="button"
              className="brk-btn brk-btn-secondary"
              onClick={() => onNavigate("store")}
            >
              Kelola jeda toko
            </button>
          }
        />
      )}

      {activeSanctions.length > 0 && (
        <InfoBanner
          tone="danger"
          title="Ada catatan sanksi aktif pada akun koordinator"
          message={activeSanctions
            .map((s) => `${s.jenis}: ${s.alasan}`)
            .join(" | ")}
        />
      )}

      {/* Top KPI summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="brk-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--muted-brk)" }}>
              Status toko dan level
            </span>
            <Store className="size-5" style={{ color: "var(--indigo)" }} aria-hidden="true" />
          </div>
          <p className="brk-display mt-2 truncate text-xl font-bold">
            {data.store?.nama || "Toko Koordinator"}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <StatusBadge value={data.store?.status} />
            <LevelBadge level={data.coordinator?.level} />
          </div>
        </div>

        <div className="brk-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--muted-brk)" }}>
              Skor Toko
            </span>
            <Award className="size-5" style={{ color: "var(--daun)" }} aria-hidden="true" />
          </div>
          <p className="brk-display brk-num mt-2 text-2xl font-bold">
            {typeof data.store?.store_score === "number" &&
            Number.isFinite(data.store.store_score)
              ? `${data.store.store_score} / 100`
              : "Toko baru"}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted-brk)" }}>
            Dihitung dari SLA, komplain valid, rating, audit, dan kelengkapan.
          </p>
        </div>

        <div className="brk-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--muted-brk)" }}>
              Saldo Tersedia
            </span>
            <Wallet className="size-5" style={{ color: "var(--daun)" }} aria-hidden="true" />
          </div>
          <p className="brk-display brk-num mt-2 text-2xl font-bold" style={{ color: "var(--daun)" }}>
            {formatRupiah(data.wallet?.available_idr)}
          </p>
          <p className="brk-num mt-1 text-xs" style={{ color: "var(--muted-brk)" }}>
            Tertunda: {formatRupiah(data.wallet?.pending_idr)}
          </p>
        </div>

        <div className="brk-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--muted-brk)" }}>
              Pesanan perlu tindakan
            </span>
            <ClipboardList className="size-5" style={{ color: "var(--indigo)" }} aria-hidden="true" />
          </div>
          <p className="brk-display brk-num mt-2 text-2xl font-bold">
            {ordersToFulfillCount}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted-brk)" }}>
            SLA menyiapkan pesanan maksimal 48 jam sejak dibayar.
          </p>
        </div>
      </div>

      {/* Main action cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ConsolePanel
          className="lg:col-span-7"
          icon={ClipboardList}
          title="Pesanan yang harus segera disiapkan"
          description="Selesaikan penyiapan dalam 48 jam agar pesanan tidak dibatalkan otomatis."
          action={
            <button
              type="button"
              className="brk-btn brk-btn-secondary"
              onClick={() => onNavigate("orders")}
            >
              Lihat semua pesanan
            </button>
          }
        >
          {ordersToFulfill.length === 0 ? (
            ordersToFulfillCount > 0 ? (
              <EmptyState
                title={`Ada ${ordersToFulfillCount} pesanan menunggu tindakan`}
                description="Buka halaman Pesanan untuk menyiapkan dan memproses pesanan sesuai SLA 48 jam."
                action={
                  <button
                    type="button"
                    className="brk-btn brk-btn-primary"
                    onClick={() => onNavigate("orders")}
                  >
                    <span>Buka daftar pesanan</span>
                  </button>
                }
              />
            ) : (
              <EmptyState
                title="Belum ada pesanan yang menunggu tindakan"
                description="Semua pesanan aktif sudah diproses. Tambah barang kurasi baru untuk meningkatkan penjualan."
                action={
                  <button
                    type="button"
                    className="brk-btn brk-btn-primary"
                    onClick={() => onNavigate("items")}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    <span>Tambah barang</span>
                  </button>
                }
              />
            )
          ) : (
            <ul className="space-y-3">
              {ordersToFulfill.map((order) => {
                const hours =
                  order.sla_remaining_hours ??
                  computeHoursRemaining(order.sla_deadline);
                return (
                  <li
                    key={order.uuid}
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="brk-num text-sm font-bold">
                          {order.kode_pesanan}
                        </span>
                        <StatusBadge value={order.status} />
                        <SlaBadge hoursRemaining={hours} />
                      </div>
                      <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--muted-brk)" }}
                      >
                        Metode serah:{" "}
                        <strong>
                          {(order.serah ?? order.metode_serah) === "ambil"
                            ? "Ambil di toko"
                            : "Kirim kurir"}
                        </strong>
                        , total{" "}
                        <span className="brk-num font-semibold">
                          {formatRupiah(order.total_idr)}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="brk-btn brk-btn-primary shrink-0"
                      onClick={() => onNavigate("orders")}
                    >
                      Proses pesanan
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ConsolePanel>

        <ConsolePanel
          className="lg:col-span-5"
          icon={Package}
          title="Ringkasan barang per status"
          description="Pantau stok draf, antrean review, barang perlu revisi, dan barang terbit."
          action={
            <button
              type="button"
              className="brk-btn brk-btn-primary"
              onClick={() => onNavigate("items")}
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>Tambah barang</span>
            </button>
          }
        >
          {statusEntries.length === 0 ? (
            <EmptyState
              title="Belum ada barang tercatat"
              description="Catat donatur dan mulai mengurasi barang sesuai SOP kategori."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      </div>

      {/* Aging stock price drop suggestions */}
      {priceSuggestions.length > 0 && (
        <ConsolePanel
          icon={TrendingDown}
          title="Saran turun harga untuk barang menua"
          description="Menurunkan harga sesuai rekomendasi Mesin Toko membantu stok lebih cepat terjual tanpa perlu review ulang."
        >
          <div className="space-y-3">
            {priceSuggestions.map((s) => (
              <div
                key={s.uuid}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "var(--garis)" }}
              >
                <div>
                  <p className="font-semibold">
                    {s.item_judul || s.item_kode || "Barang"}
                  </p>
                  <p
                    className="brk-num mt-1 text-sm"
                    style={{ color: "var(--muted-brk)" }}
                  >
                    Harga saat ini {formatRupiah(s.current_price_idr)}, disarankan{" "}
                    <strong style={{ color: "var(--daun)" }}>
                      {formatRupiah(s.suggested_price_idr)}
                    </strong>
                    {s.age_days ? ` (umur stok ${s.age_days} hari)` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="brk-btn brk-btn-daun shrink-0"
                  disabled={acceptSuggestionMut.isPending || !s.item_uuid}
                  onClick={() => {
                    if (!s.item_uuid) return;
                    acceptSuggestionMut.mutate({
                      itemUuid: s.item_uuid,
                      suggestionUuid: s.uuid,
                    });
                  }}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  <span>Terapkan saran harga</span>
                </button>
              </div>
            ))}
          </div>
        </ConsolePanel>
      )}

      {/* Revision tasks */}
      {revisionItems.length > 0 && (
        <ConsolePanel
          icon={AlertTriangle}
          title="Tugas revisi dari Reviewer"
          description="Perbaiki butir SOP yang diminta dalam maksimal 3 hari kerja."
        >
          <ul className="space-y-2.5">
            {revisionItems.map((item) => (
              <li
                key={item.uuid}
                className="flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  backgroundColor: "var(--kunyit-muda)",
                  borderColor: "var(--kunyit)",
                }}
              >
                <div>
                  <p className="font-bold">
                    {item.kode_barang} — {item.judul}
                  </p>
                  <p className="text-xs" style={{ color: "var(--peringatan-teks)" }}>
                    {item.alasan_tolak || "Buka halaman Barang untuk melihat catatan per butir SOP."}
                  </p>
                </div>
                <button
                  type="button"
                  className="brk-btn brk-btn-primary shrink-0"
                  onClick={() => onNavigate("items")}
                >
                  Perbaiki sekarang
                </button>
              </li>
            ))}
          </ul>
        </ConsolePanel>
      )}
    </div>
  );
}
