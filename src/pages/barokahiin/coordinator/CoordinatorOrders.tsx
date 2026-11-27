import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  KeyRound,
  Loader2,
  MessageSquareWarning,
  PackageCheck,
  Send,
  Star,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getConsoleDisputes,
  getConsoleOrder,
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

  // Order detail modal
  const [detailOrder, setDetailOrder] = useState<ConsoleOrder | null>(null);

  // Pickup verification modal
  const [pickupOrder, setPickupOrder] = useState<ConsoleOrder | null>(null);
  const [pickupCodeInput, setPickupCodeInput] = useState("");

  useEffect(() => {
    if (!detailOrder) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailOrder(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailOrder]);

  // Ship order modal
  const [shipOrder, setShipOrder] = useState<ConsoleOrder | null>(null);
  const [kurir, setKurir] = useState("");
  const [resi, setResi] = useState("");
  const [buktiMedia, setBuktiMedia] = useState<BarokahiinMedia | null>(null);

  // Dispute list & reply state (GET /console/disputes + POST /console/disputes/{uuid}/messages)
  const [disputeStatus, setDisputeStatus] = useState("");
  const [disputePage, setDisputePage] = useState(1);
  const [disputeUuid, setDisputeUuid] = useState("");
  const [disputeReply, setDisputeReply] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["barokahiin", "console", "orders", statusFilter, page],
    queryFn: () =>
      getConsoleOrders({ status: statusFilter, page, per_page: 12 }),
  });

  const orderDetailQuery = useQuery({
    queryKey: ["barokahiin", "console", "order-detail", detailOrder?.uuid],
    queryFn: () => getConsoleOrder(detailOrder!.uuid),
    enabled: Boolean(detailOrder?.uuid),
  });

  const disputesQuery = useQuery({
    queryKey: ["barokahiin", "console", "disputes", disputeStatus, disputePage],
    queryFn: () =>
      getConsoleDisputes({
        status: disputeStatus,
        page: disputePage,
        per_page: 12,
      }),
    enabled: subTab === "disputes",
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
        queryKey: ["barokahiin", "console", "disputes"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "orders"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const { items: orders, pagination } = unwrapList(ordersQuery.data);
  const { items: disputes, pagination: disputePagination } = unwrapList(
    disputesQuery.data,
  );

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
                        {(() => {
                          const rev = order.review;
                          const ratingScore =
                            rev?.rating ?? rev?.rating_barang ?? null;
                          if (!rev || !ratingScore) return null;
                          return (
                            <div
                              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: "var(--kunyit-muda)",
                                borderColor: "var(--kunyit)",
                                color: "var(--peringatan-teks)",
                              }}
                            >
                              <Star
                                className="size-3.5 fill-current"
                                aria-hidden="true"
                              />
                              <span className="brk-num">
                                Rating pembeli: {ratingScore}/5
                              </span>
                              {(rev.komentar || rev.teks) && (
                                <span className="max-w-52 truncate font-normal">
                                  — "{rev.komentar || rev.teks}"
                                </span>
                              )}
                            </div>
                          );
                        })()}
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
                      <button
                        type="button"
                        className="brk-btn brk-btn-secondary"
                        onClick={() => setDetailOrder(order)}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                        <span>Lihat detail</span>
                      </button>

                      {order.status === "dibayar" && (
                        <button
                          type="button"
                          className="brk-btn brk-btn-primary"
                          disabled={prepareMut.isPending}
                          onClick={() => prepareMut.mutate(order.uuid)}
                        >
                          {prepareMut.isPending &&
                          prepareMut.variables === order.uuid ? (
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <PackageCheck className="size-4" aria-hidden="true" />
                          )}
                          <span>
                            {prepareMut.isPending &&
                            prepareMut.variables === order.uuid
                              ? "Menyiapkan..."
                              : "Mulai menyiapkan"}
                          </span>
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
                            {readyPickupMut.isPending &&
                            readyPickupMut.variables === order.uuid ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <CheckCircle2
                                className="size-4"
                                aria-hidden="true"
                              />
                            )}
                            <span>
                              {readyPickupMut.isPending &&
                              readyPickupMut.variables === order.uuid
                                ? "Memproses..."
                                : "Tandai siap diambil"}
                            </span>
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
            title="Daftar komplain pembeli"
            description="Tanggapi komplain dalam SLA 24 jam. Pilih komplain dari daftar untuk mengirim tanggapan langsung."
          >
            <div className="mb-4 w-full sm:max-w-60">
              <ConsoleSelect
                value={disputeStatus}
                onChange={(v) => {
                  setDisputeStatus(v);
                  setDisputePage(1);
                }}
                placeholder="Semua status komplain"
                options={[
                  { value: "", label: "Semua status" },
                  { value: "terbuka", label: "Terbuka" },
                  { value: "ditanggapi", label: "Ditanggapi" },
                  { value: "diputus", label: "Diputus" },
                  { value: "selesai", label: "Selesai" },
                ]}
              />
            </div>

            {disputesQuery.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : disputesQuery.error ? (
              <ErrorBanner
                message={parseBarokahiinError(disputesQuery.error).message}
                onRetry={() => void disputesQuery.refetch()}
              />
            ) : disputes.length === 0 ? (
              <EmptyState
                title="Belum ada komplain pembeli"
                description="Komplain yang masuk untuk pesanan toko Anda akan tampil di sini."
              />
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => {
                  const selected = disputeUuid === d.uuid;
                  return (
                    <article
                      key={d.uuid}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: selected ? "var(--indigo)" : "var(--garis)",
                        backgroundColor: selected
                          ? "var(--indigo-muda)"
                          : "var(--putih)",
                      }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="brk-num text-sm font-bold">
                              {d.order_code || d.uuid}
                            </span>
                            <StatusBadge value={d.status} />
                          </div>
                          <p className="mt-1 text-sm font-semibold">
                            Alasan: {d.alasan}
                          </p>
                          {d.keterangan && (
                            <p
                              className="mt-0.5 text-xs"
                              style={{ color: "var(--muted-brk)" }}
                            >
                              {d.keterangan}
                            </p>
                          )}
                          <p
                            className="mt-1 text-xs"
                            style={{ color: "var(--muted-brk)" }}
                          >
                            Dibuat {formatDateId(d.created_at)}
                            {d.response_deadline
                              ? ` · Batas tanggapan: ${formatDateId(d.response_deadline)}`
                              : ""}
                          </p>
                          {d.putusan && (
                            <p
                              className="mt-1 text-xs font-semibold"
                              style={{ color: "var(--indigo)" }}
                            >
                              Putusan Admin: {d.putusan.replaceAll("_", " ")}
                              {d.nominal_refund_idr
                                ? ` (${formatRupiah(d.nominal_refund_idr)})`
                                : ""}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`brk-btn shrink-0 ${selected ? "brk-btn-primary" : "brk-btn-secondary"}`}
                          onClick={() => setDisputeUuid(d.uuid)}
                        >
                          <Send className="size-4" aria-hidden="true" />
                          <span>{selected ? "Sedang dipilih" : "Tanggapi"}</span>
                        </button>
                      </div>

                      {d.messages && d.messages.length > 0 && (
                        <div
                          className="mt-3 space-y-2 border-t pt-3"
                          style={{ borderColor: "var(--garis)" }}
                        >
                          {d.messages.map((msg, i) => (
                            <div
                              key={msg.id ?? i}
                              className="rounded-lg border p-2.5 text-xs"
                              style={{
                                backgroundColor: "var(--kertas)",
                                borderColor: "var(--garis)",
                              }}
                            >
                              <div className="flex items-center justify-between gap-2 font-semibold">
                                <span className="capitalize">
                                  {msg.sender_name || msg.sender_role}
                                </span>
                                <span style={{ color: "var(--muted-brk)" }}>
                                  {formatDateId(msg.created_at)}
                                </span>
                              </div>
                              <p className="mt-1">{msg.pesan}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            <Pager pagination={disputePagination} onChange={setDisputePage} />
          </ConsolePanel>

          <ConsolePanel
            icon={Send}
            title="Kirim tanggapan komplain"
            description="Pilih komplain dari daftar di atas atau masukkan UUID komplain untuk mengirim pesan tanggapan."
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
              >
                <input
                  id="coord-dispute-uuid"
                  className="brk-input"
                  value={disputeUuid}
                  onChange={(e) => setDisputeUuid(e.target.value)}
                  placeholder="Pilih dari daftar di atas atau tempel UUID komplain"
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
        </div>
      )}

      {/* Order Detail Modal (GET /console/orders/{uuid} with decrypted penerima/alamat, timeline & buyer rating) */}
      {detailOrder && (() => {
        const fullOrder: ConsoleOrder = {
          ...detailOrder,
          ...(orderDetailQuery.data ?? {}),
        };
        const serahMode =
          fullOrder.serah ?? fullOrder.metode_serah ?? "kirim";
        const kurirName = fullOrder.fulfillment?.kurir ?? fullOrder.kurir;
        const resiNumber = fullOrder.fulfillment?.resi ?? fullOrder.resi;
        const pickupCode =
          fullOrder.fulfillment?.pickup_code ?? fullOrder.pickup_code;
        const buktiKemasUrl =
          fullOrder.fulfillment?.bukti_kemas_url ??
          fullOrder.bukti_kemas_url;
        const rev = fullOrder.review;
        const ratingScore = rev?.rating ?? rev?.rating_barang ?? null;
        const recipientName =
          fullOrder.penerima?.nama ||
          fullOrder.buyer_name_masked ||
          "Pembeli terverifikasi";
        const recipientPhone =
          fullOrder.penerima?.kontak ||
          fullOrder.penerima?.telepon ||
          fullOrder.penerima?.no_hp ||
          fullOrder.buyer_phone_masked;
        const alamatObj = fullOrder.alamat;
        const decryptedAddress = alamatObj
          ? [
              alamatObj.alamat_lengkap || alamatObj.jalan_nomor,
              alamatObj.rt_rw,
              alamatObj.kelurahan,
              alamatObj.kecamatan,
              alamatObj.kabupaten,
              alamatObj.provinsi,
              alamatObj.kode_pos,
            ]
              .filter(Boolean)
              .join(", ") || alamatObj.ringkas
          : fullOrder.shipping_address_summary;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brk-order-detail-title"
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 sm:items-center sm:p-4"
            onClick={() => setDetailOrder(null)}
          >
            <div
              className="brk-float brk-safe-bottom max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-4xl border p-5 sm:p-6"
              style={{
                backgroundColor: "var(--putih)",
                borderColor: "var(--garis)",
                color: "var(--tinta)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-start justify-between gap-3 border-b pb-3"
                style={{ borderColor: "var(--garis)" }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      id="brk-order-detail-title"
                      className="brk-display brk-num text-lg font-bold"
                    >
                      Pesanan {detailOrder.kode_pesanan}
                    </span>
                    <StatusBadge value={detailOrder.status} />
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--muted-brk)" }}>
                    Dibuat {formatDateId(detailOrder.created_at)} — Metode serah:{" "}
                    <strong>
                      {serahMode === "ambil" ? "Ambil di toko" : "Kirim kurir"}
                    </strong>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Tutup detail pesanan"
                  className="size-10 shrink-0 rounded-lg"
                  onClick={() => setDetailOrder(null)}
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                {(orderDetailQuery.isLoading || orderDetailQuery.isFetching) && (
                  <div
                    className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--indigo-muda)",
                      borderColor: "var(--indigo)",
                      color: "var(--indigo)",
                    }}
                  >
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                    <span>
                      Memuat detail pesanan, alamat lengkap, linimasa, dan rating pembeli...
                    </span>
                  </div>
                )}

                {/* Buyer Rating & Review */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: ratingScore
                      ? "var(--kunyit-muda)"
                      : "var(--kertas)",
                    borderColor: ratingScore ? "var(--kunyit)" : "var(--garis)",
                  }}
                >
                  <p className="text-xs font-bold" style={{ color: ratingScore ? "var(--peringatan-teks)" : "var(--muted-brk)" }}>
                    Rating dan ulasan pembeli
                  </p>
                  {orderDetailQuery.isLoading && !ratingScore ? (
                    <div
                      className="mt-2 flex items-center gap-2 text-xs font-medium"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      <span>Memuat rating dan ulasan pembeli...</span>
                    </div>
                  ) : ratingScore ? (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`size-4 ${n <= ratingScore ? "fill-current" : "opacity-30"}`}
                            style={{ color: "var(--peringatan-teks)" }}
                            aria-hidden="true"
                          />
                        ))}
                        <span
                          className="brk-num ml-1 text-sm font-bold"
                          style={{ color: "var(--peringatan-teks)" }}
                        >
                          {ratingScore} / 5
                        </span>
                        {rev?.rating_layanan ? (
                          <span
                            className="brk-num ml-2 text-xs"
                            style={{ color: "var(--peringatan-teks)" }}
                          >
                            (Layanan: {rev.rating_layanan}/5)
                          </span>
                        ) : null}
                      </div>
                      {(rev?.komentar || rev?.teks) && (
                        <p className="text-sm font-medium" style={{ color: "var(--tinta)" }}>
                          "{rev.komentar || rev.teks}"
                        </p>
                      )}
                      {rev?.created_at && (
                        <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                          Diulas pada {formatDateId(rev.created_at)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs" style={{ color: "var(--muted-brk)" }}>
                      Pembeli belum memberikan rating atau ulasan untuk pesanan ini.
                    </p>
                  )}
                </div>

                {/* Items list */}
                {detailOrder.items && detailOrder.items.length > 0 && (
                  <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <p className="mb-2 text-xs font-bold" style={{ color: "var(--muted-brk)" }}>
                      Barang dalam pesanan
                    </p>
                    <ul className="space-y-2.5 text-sm">
                      {detailOrder.items.map((it) => (
                        <li
                          key={it.uuid}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            {it.cover_url && (
                              <img
                                src={it.cover_url}
                                alt={it.judul}
                                className="size-10 shrink-0 rounded-md object-cover"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{it.judul}</p>
                              <p className="brk-num text-xs" style={{ color: "var(--muted-brk)" }}>
                                {it.kode_barang}
                                {it.grade ? `, Grade ${it.grade}` : ""}
                              </p>
                            </div>
                          </div>
                          <span className="brk-num shrink-0 font-bold">
                            {formatRupiah(it.price_idr)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Shipping / Pickup details */}
                <div
                  className="grid grid-cols-1 gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2"
                  style={{
                    backgroundColor: "var(--kertas)",
                    borderColor: "var(--garis)",
                  }}
                >
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--muted-brk)" }}>
                      Penerima & tujuan
                    </p>
                    <p className="mt-1 font-semibold">{recipientName}</p>
                    {recipientPhone && (
                      <p className="brk-num text-xs" style={{ color: "var(--muted-brk)" }}>
                        {recipientPhone}
                      </p>
                    )}
                    {decryptedAddress && (
                      <p className="mt-1 text-xs">{decryptedAddress}</p>
                    )}
                    {alamatObj?.patokan && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted-brk)" }}>
                        Patokan: {alamatObj.patokan}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--muted-brk)" }}>
                      Pemenuhan
                    </p>
                    {serahMode === "kirim" ? (
                      <div className="mt-1 space-y-1 text-xs">
                        <p>
                          Kurir: <strong>{kurirName || "Belum diisi"}</strong>
                        </p>
                        <p className="brk-num">
                          Resi: <strong>{resiNumber || "Belum diisi"}</strong>
                        </p>
                        {buktiKemasUrl && (
                          <a
                            href={buktiKemasUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block font-semibold underline"
                            style={{ color: "var(--indigo)" }}
                          >
                            Lihat foto bukti kemas
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 space-y-1 text-xs">
                        <p>
                          Kode ambil:{" "}
                          <strong className="brk-num">
                            {pickupCode || "Akan muncul saat Siap diambil"}
                          </strong>
                        </p>
                        {detailOrder.fulfillment?.ambil_deadline && (
                          <p>
                            Batas ambil:{" "}
                            {formatDateId(detailOrder.fulfillment.ambil_deadline)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline status from GET /console/orders/{uuid} */}
                {orderDetailQuery.isLoading && !fullOrder.timeline?.length ? (
                  <div
                    className="flex items-center gap-2 rounded-xl border p-4 text-xs"
                    style={{ borderColor: "var(--garis)", color: "var(--muted-brk)" }}
                  >
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    <span>Memuat linimasa status pesanan...</span>
                  </div>
                ) : fullOrder.timeline && fullOrder.timeline.length > 0 ? (
                  <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <p className="mb-2 text-xs font-bold" style={{ color: "var(--muted-brk)" }}>
                      Linimasa pesanan
                    </p>
                    <ol className="space-y-2 text-xs">
                      {fullOrder.timeline.map((t, idx) => (
                        <li
                          key={idx}
                          className="flex flex-wrap items-center justify-between gap-2 border-b pb-1.5 last:border-b-0 last:pb-0"
                          style={{ borderColor: "var(--garis)" }}
                        >
                          <span className="font-semibold">
                            {t.label || (t.status ? t.status.replaceAll("_", " ") : "Status")}
                            {t.keterangan ? ` — ${t.keterangan}` : ""}
                          </span>
                          <span className="brk-num" style={{ color: "var(--muted-brk)" }}>
                            {formatDateId(t.timestamp || t.waktu || t.at)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {/* Price breakdown */}
                <dl
                  className="space-y-1.5 rounded-xl border p-4 text-sm"
                  style={{ borderColor: "var(--garis)" }}
                >
                  <div className="flex justify-between">
                    <dt style={{ color: "var(--muted-brk)" }}>Subtotal barang</dt>
                    <dd className="brk-num font-semibold">
                      {formatRupiah(fullOrder.subtotal_idr)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt style={{ color: "var(--muted-brk)" }}>Ongkir</dt>
                    <dd className="brk-num">{formatRupiah(detailOrder.shipping_idr)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt style={{ color: "var(--muted-brk)" }}>Biaya kemas</dt>
                    <dd className="brk-num">{formatRupiah(detailOrder.packaging_idr)}</dd>
                  </div>
                  {(detailOrder.rounding_charity_idr ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <dt style={{ color: "var(--daun)" }}>Pembulatan Kebaikan</dt>
                      <dd className="brk-num font-semibold" style={{ color: "var(--daun)" }}>
                        {formatRupiah(detailOrder.rounding_charity_idr)}
                      </dd>
                    </div>
                  )}
                  <div
                    className="flex justify-between border-t pt-2 text-base font-bold"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <dt>Total dibayar</dt>
                    <dd className="brk-display brk-num">
                      {formatRupiah(detailOrder.total_idr)}
                    </dd>
                  </div>
                </dl>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="brk-btn brk-btn-secondary"
                    onClick={() => setDetailOrder(null)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
