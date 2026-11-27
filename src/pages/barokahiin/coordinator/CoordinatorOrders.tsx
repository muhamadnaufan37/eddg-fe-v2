import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  KeyRound,
  MessageSquareWarning,
  PackageCheck,
  Send,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getConsoleOrders,
  parseBarokahiinError,
  prepareConsoleOrder,
  readyForPickupConsoleOrder,
  replyConsoleDispute,
  shipConsoleOrder,
  verifyPickupConsoleOrder,
  type BarokahiinMedia,
  type ConsoleOrder,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ConsoleSelect,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  LoadingSkeleton,
  Pager,
  SlaBadge,
  StatusBadge,
} from "../components/ui/ConsoleUi";
import { MediaUploadQueue } from "../components/ui/MediaUploadQueue";
import {
  computeHoursRemaining,
  formatDateId,
  formatRupiah,
  unwrapList,
} from "../components/ui/utils";

export default function CoordinatorOrders() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"orders" | "disputes">("orders");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Pickup verification modal
  const [pickupOrder, setPickupOrder] = useState<ConsoleOrder | null>(null);
  const [pickupCodeInput, setPickupCodeInput] = useState("");

  // Ship order modal
  const [shipOrder, setShipOrder] = useState<ConsoleOrder | null>(null);
  const [kurir, setKurir] = useState("");
  const [resi, setResi] = useState("");
  const [buktiMedia, setBuktiMedia] = useState<BarokahiinMedia | null>(null);

  // Dispute reply state (POST /console/disputes/{uuid}/messages)
  const [disputeUuid, setDisputeUuid] = useState("");
  const [disputeReply, setDisputeReply] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["barokahiin", "console", "orders", statusFilter, page],
    queryFn: () =>
      getConsoleOrders({ status: statusFilter, page, per_page: 12 }),
  });

  const prepareMut = useMutation({
    mutationFn: (uuid: string) => prepareConsoleOrder(uuid),
    onSuccess: () => {
      toast.success("Status pesanan diubah menjadi Disiapkan");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const readyPickupMut = useMutation({
    mutationFn: (uuid: string) => readyForPickupConsoleOrder(uuid),
    onSuccess: (updated) => {
      const code = updated?.pickup_code ?? updated?.fulfillment?.pickup_code;
      toast.success(
        code
          ? `Pesanan siap diambil. Kode ambil: ${code}`
          : "Pesanan siap diambil pembeli di titik toko",
      );
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const verifyPickupMut = useMutation({
    mutationFn: () => {
      if (!pickupOrder) throw new Error("Pesanan belum dipilih");
      return verifyPickupConsoleOrder(pickupOrder.uuid, pickupCodeInput.trim());
    },
    onSuccess: () => {
      setPickupOrder(null);
      setPickupCodeInput("");
      toast.success("Kode ambil terverifikasi, pesanan ditandai Diterima");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const shipMut = useMutation({
    mutationFn: () => {
      if (!shipOrder) throw new Error("Pesanan belum dipilih");
      if (!buktiMedia) {
        throw new Error("Foto kemasan dan resi wajib diunggah.");
      }
      return shipConsoleOrder(shipOrder.uuid, {
        kurir: kurir.trim(),
        resi: resi.trim(),
        bukti_kemas_media_id: buktiMedia.id ?? buktiMedia.uuid,
      });
    },
    onSuccess: () => {
      setShipOrder(null);
      setKurir("");
      setResi("");
      setBuktiMedia(null);
      toast.success(
        "Pesanan dikirim. Penggantian ongkir dan biaya kemas dikreditkan ke saldo Tersedia.",
      );
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const replyDisputeMut = useMutation({
    mutationFn: ({ uuid, pesan }: { uuid: string; pesan: string }) =>
      replyConsoleDispute(uuid, pesan),
    onSuccess: () => {
      setDisputeReply("");
      toast.success("Tanggapan komplain terkirim");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "orders"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const { items: orders, pagination } = unwrapList(ordersQuery.data);
  const complaintOrders = orders.filter((o) => o.status === "komplain");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`brk-btn ${subTab === "orders" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("orders")}
        >
          <ClipboardList className="size-4" aria-hidden="true" />
          <span>Pemenuhan pesanan</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "disputes" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("disputes")}
        >
          <MessageSquareWarning className="size-4" aria-hidden="true" />
          <span>Komplain pembeli</span>
        </button>
      </div>

      {subTab === "orders" && (
        <ConsolePanel
          icon={ClipboardList}
          title="Daftar pesanan toko"
          description="Siapkan pesanan dalam SLA 48 jam. Untuk kirim kurir, unggah foto kemasan dan resi agar penggantian ongkir dan biaya kemas otomatis masuk ke saldo Tersedia."
        >
          <div className="mb-4 w-full sm:max-w-60">
            <ConsoleSelect
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              placeholder="Semua status"
              options={[
                { value: "", label: "Semua status" },
                { value: "dibayar", label: "Dibayar (perlu disiapkan)" },
                { value: "disiapkan", label: "Disiapkan" },
                { value: "siap_diambil", label: "Siap diambil" },
                { value: "dikirim", label: "Dikirim" },
                { value: "diterima", label: "Diterima" },
                { value: "selesai", label: "Selesai" },
                { value: "komplain", label: "Komplain" },
              ]}
            />
          </div>

          {ordersQuery.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : ordersQuery.error ? (
            <ErrorBanner
              message={parseBarokahiinError(ordersQuery.error).message}
              onRetry={() => void ordersQuery.refetch()}
            />
          ) : orders.length === 0 ? (
            <EmptyState
              title="Belum ada pesanan"
              description="Pesanan yang sudah dibayar oleh pembeli akan muncul di sini."
            />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const serahMode = order.serah ?? order.metode_serah ?? "kirim";
                const kurirName = order.fulfillment?.kurir ?? order.kurir;
                const resiNumber = order.fulfillment?.resi ?? order.resi;
                const pickupCode =
                  order.fulfillment?.pickup_code ?? order.pickup_code;
                const hours =
                  order.sla_remaining_hours ??
                  computeHoursRemaining(order.sla_deadline);
                return (
                  <article
                    key={order.uuid}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="brk-display brk-num text-base font-bold">
                            {order.kode_pesanan}
                          </span>
                          <StatusBadge value={order.status} />
                          {(order.status === "dibayar" ||
                            order.status === "disiapkan") && (
                            <SlaBadge hoursRemaining={hours} />
                          )}
                        </div>
                        <p
                          className="mt-1 text-sm"
                          style={{ color: "var(--muted-brk)" }}
                        >
                          Serah:{" "}
                          <strong>
                            {serahMode === "ambil"
                              ? "Ambil di titik toko"
                              : "Kirim kurir"}
                          </strong>
                          {order.buyer_name_masked
                            ? `, Penerima: ${order.buyer_name_masked}`
                            : ""}
                        </p>
                        {order.shipping_address_summary && (
                          <p
                            className="mt-1 text-xs"
                            style={{ color: "var(--muted-brk)" }}
                          >
                            Tujuan: {order.shipping_address_summary}
                          </p>
                        )}
                        {kurirName && resiNumber && (
                          <p className="brk-num mt-1 text-xs font-semibold">
                            Kurir: {kurirName}, Resi: {resiNumber}
                          </p>
                        )}
                        {pickupCode && order.status === "siap_diambil" && (
                          <p
                            className="brk-num mt-1 text-xs font-bold"
                            style={{ color: "var(--indigo)" }}
                          >
                            Kode ambil: {pickupCode}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="brk-display brk-num text-lg font-bold">
                          {formatRupiah(order.total_idr)}
                        </p>
                        <p
                          className="brk-num text-xs"
                          style={{ color: "var(--muted-brk)" }}
                        >
                          Ongkir {formatRupiah(order.shipping_idr)}, Kemas{" "}
                          {formatRupiah(order.packaging_idr)}
                        </p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <ul
                        className="mt-3 space-y-1 border-t pt-3 text-sm"
                        style={{ borderColor: "var(--garis)" }}
                      >
                        {order.items.map((it) => (
                          <li
                            key={it.uuid}
                            className="flex justify-between gap-2"
                          >
                            <span className="truncate">
                              <span className="brk-num font-semibold">
                                {it.kode_barang}
                              </span>{" "}
                              {it.judul}
                            </span>
                            <span className="brk-num shrink-0 font-semibold">
                              {formatRupiah(it.price_idr)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div
                      className="mt-3 flex flex-wrap gap-2 border-t pt-3"
                      style={{ borderColor: "var(--garis)" }}
                    >
                      {order.status === "dibayar" && (
                        <button
                          type="button"
                          className="brk-btn brk-btn-primary"
                          disabled={prepareMut.isPending}
                          onClick={() => prepareMut.mutate(order.uuid)}
                        >
                          <PackageCheck className="size-4" aria-hidden="true" />
                          <span>Mulai menyiapkan</span>
                        </button>
                      )}

                      {order.status === "disiapkan" &&
                        serahMode === "ambil" && (
                          <button
                            type="button"
                            className="brk-btn brk-btn-daun"
                            disabled={readyPickupMut.isPending}
                            onClick={() => readyPickupMut.mutate(order.uuid)}
                          >
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            <span>Tandai siap diambil</span>
                          </button>
                        )}

                      {order.status === "siap_diambil" && (
                        <button
                          type="button"
                          className="brk-btn brk-btn-primary"
                          onClick={() => {
                            setPickupOrder(order);
                            setPickupCodeInput("");
                          }}
                        >
                          <KeyRound className="size-4" aria-hidden="true" />
                          <span>Verifikasi kode ambil</span>
                        </button>
                      )}

                      {order.status === "disiapkan" &&
                        serahMode === "kirim" && (
                          <button
                            type="button"
                            className="brk-btn brk-btn-primary"
                            onClick={() => {
                              setShipOrder(order);
                              setKurir("");
                              setResi("");
                              setBuktiMedia(null);
                            }}
                          >
                            <Truck className="size-4" aria-hidden="true" />
                            <span>Input resi dan kirim</span>
                          </button>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <Pager pagination={pagination} onChange={setPage} />
        </ConsolePanel>
      )}

      {subTab === "disputes" && (
        <div className="space-y-5">
          <ConsolePanel
            icon={MessageSquareWarning}
            title="Tanggapi komplain pembeli"
            description="Tanggapi komplain dalam SLA 24 jam menggunakan UUID komplain dari notifikasi atau pesanan berstatus Komplain."
          >
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!disputeUuid.trim() || !disputeReply.trim()) {
                  toast.error("UUID komplain dan pesan tanggapan wajib diisi.");
                  return;
                }
                replyDisputeMut.mutate({
                  uuid: disputeUuid.trim(),
                  pesan: disputeReply.trim(),
                });
              }}
            >
              <FieldWrapper
                id="coord-dispute-uuid"
                label="UUID komplain"
                required
                helper="Masukkan UUID komplain dari detail pesanan atau notifikasi komplain."
              >
                <input
                  id="coord-dispute-uuid"
                  className="brk-input"
                  value={disputeUuid}
                  onChange={(e) => setDisputeUuid(e.target.value)}
                  placeholder="Contoh: 9c8b7a6d-..."
                  required
                />
              </FieldWrapper>

              <FieldWrapper
                id="coord-dispute-pesan"
                label="Pesan tanggapan koordinator"
                required
              >
                <textarea
                  id="coord-dispute-pesan"
                  className="brk-textarea"
                  value={disputeReply}
                  onChange={(e) => setDisputeReply(e.target.value)}
                  placeholder="Tulis tanggapan jujur, jelas, dan sopan untuk pembeli dan Admin..."
                  required
                />
              </FieldWrapper>

              <button
                type="submit"
                className="brk-btn brk-btn-primary"
                disabled={replyDisputeMut.isPending}
              >
                <Send className="size-4" aria-hidden="true" />
                <span>
                  {replyDisputeMut.isPending
                    ? "Mengirim..."
                    : "Kirim tanggapan komplain"}
                </span>
              </button>
            </form>
          </ConsolePanel>

          <ConsolePanel
            icon={ClipboardList}
            title="Pesanan berstatus Komplain"
            description="Daftar pesanan toko yang saat ini berstatus Komplain berdasarkan data pesanan."
          >
            {complaintOrders.length === 0 ? (
              <EmptyState
                title="Tidak ada pesanan berstatus komplain"
                description="Pesanan yang sedang dikomplain pembeli akan tampil di sini."
              />
            ) : (
              <div className="space-y-3">
                {complaintOrders.map((order) => (
                  <article
                    key={order.uuid}
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="brk-num text-sm font-bold">
                          {order.kode_pesanan}
                        </span>
                        <StatusBadge value={order.status} />
                      </div>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--muted-brk)" }}
                      >
                        Total {formatRupiah(order.total_idr)}, dibuat{" "}
                        {formatDateId(order.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="brk-btn brk-btn-secondary shrink-0"
                      onClick={() => setDisputeUuid(order.uuid)}
                    >
                      Gunakan UUID untuk tanggapan
                    </button>
                  </article>
                ))}
              </div>
            )}
          </ConsolePanel>
        </div>
      )}

      {/* Verify Pickup Code Modal */}
      <ConfirmDialog
        open={Boolean(pickupOrder)}
        title="Verifikasi kode ambil"
        description={`Masukkan kode ambil 6 karakter yang ditunjukkan pembeli untuk pesanan ${pickupOrder?.kode_pesanan || ""}.`}
        confirmLabel="Verifikasi dan serahkan"
        tone="daun"
        loading={verifyPickupMut.isPending}
        onCancel={() => setPickupOrder(null)}
        onConfirm={() => {
          if (!pickupCodeInput.trim()) {
            toast.error("Kode ambil wajib diisi.");
            return;
          }
          verifyPickupMut.mutate();
        }}
      >
        <FieldWrapper id="pickup-code" label="Kode ambil (6 karakter)" required>
          <input
            id="pickup-code"
            className="brk-input brk-num text-center text-xl font-bold uppercase tracking-widest"
            inputMode="text"
            maxLength={10}
            value={pickupCodeInput}
            onChange={(e) => setPickupCodeInput(e.target.value.toUpperCase())}
            placeholder="AB12CD"
          />
        </FieldWrapper>
      </ConfirmDialog>

      {/* Ship Order Modal */}
      <ConfirmDialog
        open={Boolean(shipOrder)}
        title="Kirim pesanan via kurir"
        description={`Catat kurir, nomor resi, dan foto kemasan untuk pesanan ${shipOrder?.kode_pesanan || ""}.`}
        consequences="Setelah dikirim dengan bukti foto kemasan dan resi, penggantian ongkir dan biaya kemas Rp 2.000 akan langsung masuk ke saldo Tersedia."
        confirmLabel="Konfirmasi pengiriman"
        tone="primary"
        loading={shipMut.isPending}
        onCancel={() => setShipOrder(null)}
        onConfirm={() => {
          if (!kurir.trim() || !resi.trim()) {
            toast.error("Nama kurir dan nomor resi wajib diisi.");
            return;
          }
          if (!buktiMedia) {
            toast.error("Unggah foto kemasan dan resi terlebih dahulu.");
            return;
          }
          shipMut.mutate();
        }}
      >
        <div className="space-y-3">
          <FieldWrapper id="ship-kurir" label="Nama kurir" required>
            <input
              id="ship-kurir"
              className="brk-input"
              value={kurir}
              onChange={(e) => setKurir(e.target.value)}
              placeholder="Contoh: JNE Reguler / J&T / SiCepat"
            />
          </FieldWrapper>
          <FieldWrapper id="ship-resi" label="Nomor resi" required>
            <input
              id="ship-resi"
              className="brk-input brk-num"
              value={resi}
              onChange={(e) => setResi(e.target.value)}
              placeholder="Masukkan nomor resi pengiriman"
            />
          </FieldWrapper>
          <div>
            <p className="mb-1.5 text-sm font-semibold">
              Foto kemasan dan resi (wajib)
            </p>
            <MediaUploadQueue
              ownerType="fulfillment"
              ownerUuid={shipOrder?.uuid || ""}
              guideLabel="Pastikan paket terkemas aman dan nomor resi terbaca jelas."
              buttonLabel="Ambil foto kemasan dan resi"
              onUploaded={(media) => {
                setBuktiMedia(media);
                toast.success("Foto kemasan dan resi siap dikirim");
              }}
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
