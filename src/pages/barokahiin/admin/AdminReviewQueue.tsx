import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileWarning,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminReviewQueue,
  parseBarokahiinError,
  submitAdminItemAudit,
  submitAdminItemReview,
  type ConsoleItem,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ConsoleSelect,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  GradeBadge,
  LoadingSkeleton,
  Pager,
  RupiahInput,
  StatusBadge,
} from "../components/ui/ConsoleUi";
import { formatDateId, formatRupiah, unwrapList } from "../components/ui/utils";

export default function AdminReviewQueue() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ConsoleItem | null>(null);

  // Review form state
  const [finalPrice, setFinalPrice] = useState("");
  const [specialPriceApproval, setSpecialPriceApproval] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [notesPerCheck, setNotesPerCheck] = useState<Record<string, string>>(
    {},
  );
  const [pendingDecision, setPendingDecision] = useState<
    "setuju" | "revisi" | "tolak" | null
  >(null);

  // Audit sampling modal (for published items)
  const [auditUuid, setAuditUuid] = useState("");
  const [auditResult, setAuditResult] = useState<"lulus" | "gagal">("lulus");
  const [auditNote, setAuditNote] = useState("");

  const queueQuery = useQuery({
    queryKey: ["barokahiin", "admin", "review-queue", page],
    queryFn: () => getAdminReviewQueue({ page, per_page: 12 }),
  });

  const reviewMut = useMutation({
    mutationFn: (keputusan: "setuju" | "revisi" | "tolak") => {
      if (!selected) throw new Error("Pilih barang terlebih dahulu");
      const cleanedNotes = Object.fromEntries(
        Object.entries(notesPerCheck).filter(([, v]) => v.trim() !== ""),
      );
      return submitAdminItemReview(selected.uuid, {
        keputusan,
        price_idr:
          keputusan === "setuju" && finalPrice
            ? Number(finalPrice)
            : undefined,
        special_price_approval:
          keputusan === "setuju" ? specialPriceApproval : undefined,
        catatan_per_butir:
          Object.keys(cleanedNotes).length > 0 ? cleanedNotes : undefined,
        alasan: alasan.trim() || undefined,
      });
    },
    onSuccess: (_, keputusan) => {
      const msg =
        keputusan === "setuju"
          ? "Barang disetujui dan diterbitkan ke storefront"
          : keputusan === "revisi"
            ? "Permintaan revisi dikirim ke koordinator"
            : "Barang ditolak";
      toast.success(msg);
      setPendingDecision(null);
      setSelected(null);
      setAlasan("");
      setNotesPerCheck({});
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const auditMut = useMutation({
    mutationFn: () =>
      submitAdminItemAudit(auditUuid.trim(), {
        hasil: auditResult,
        catatan: auditNote.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(
        auditResult === "lulus"
          ? "Audit sampling tercatat lulus"
          : "Audit gagal: barang otomatis ditarik dari storefront",
      );
      setAuditUuid("");
      setAuditNote("");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  // Keyboard shortcuts for fast desktop review (Alt+A / Alt+R / Alt+T)
  useEffect(() => {
    if (!selected || pendingDecision) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "a") {
        e.preventDefault();
        setPendingDecision("setuju");
      } else if (key === "r") {
        e.preventDefault();
        setPendingDecision("revisi");
      } else if (key === "t") {
        e.preventDefault();
        setPendingDecision("tolak");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, pendingDecision]);

  const { items: queue, pagination } = unwrapList(queueQuery.data);

  const selectItem = (item: ConsoleItem) => {
    setSelected(item);
    setFinalPrice(String(item.price_idr ?? ""));
    setSpecialPriceApproval(false);
    setAlasan("");
    setNotesPerCheck({});
  };

  return (
    <div className="space-y-5">
      <ConsolePanel
        icon={ClipboardCheck}
        title="Antrean review barang (SLA 2 hari kerja)"
        description="Periksa media bukti dan hasil checklist SOP secara berdampingan. Keputusan Setujui langsung menerbitkan barang ke storefront."
      >
        {queueQuery.isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : queueQuery.error ? (
          <ErrorBanner
            message={parseBarokahiinError(queueQuery.error).message}
            onRetry={() => void queueQuery.refetch()}
          />
        ) : queue.length === 0 ? (
          <EmptyState
            title="Antrean review kosong"
            description="Semua pengajuan barang dari koordinator telah ditinjau."
          />
        ) : (
          <div className="space-y-4">
            {/* Queue list */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {queue.map((item) => {
                const isSelected = selected?.uuid === item.uuid;
                return (
                  <button
                    key={item.uuid}
                    type="button"
                    onClick={() => selectItem(item)}
                    className="rounded-xl border p-3.5 text-left transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? "var(--indigo-muda)"
                        : "var(--putih)",
                      borderColor: isSelected
                        ? "var(--indigo)"
                        : "var(--garis)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="brk-num text-xs font-bold">
                        {item.kode_barang}
                      </span>
                      <StatusBadge value={item.status} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm font-bold">
                      {item.judul}
                    </p>
                    <p
                      className="brk-num mt-1 text-sm font-bold"
                      style={{ color: "var(--indigo)" }}
                    >
                      {formatRupiah(item.price_idr)}
                    </p>
                    <p
                      className="mt-1 flex items-center gap-1 text-xs"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      <Clock className="size-3.5" aria-hidden="true" />
                      <span>
                        Diajukan: {formatDateId(item.submitted_at || item.created_at)}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>

            <Pager pagination={pagination} onChange={setPage} />

            {/* Side-by-side detail reviewer */}
            {selected && (
              <div
                className="mt-4 grid grid-cols-1 gap-5 rounded-xl border p-4 lg:grid-cols-12 lg:p-5"
                style={{
                  backgroundColor: "var(--kertas)",
                  borderColor: "var(--indigo)",
                }}
              >
                {/* Left: Media + public info */}
                <div className="space-y-4 lg:col-span-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="brk-num text-sm font-bold">
                        {selected.kode_barang}
                      </span>
                      <GradeBadge grade={selected.grade} />
                    </div>
                    <h3 className="mt-1 text-xl font-bold">{selected.judul}</h3>
                    <p
                      className="brk-display brk-num mt-1 text-2xl font-bold"
                      style={{ color: "var(--indigo)" }}
                    >
                      {formatRupiah(selected.price_idr)}
                    </p>
                    <p className="brk-num text-xs" style={{ color: "var(--muted-brk)" }}>
                      Harga referensi baru: {formatRupiah(selected.ref_new_price_idr)}
                    </p>
                  </div>

                  {/* Media grid */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(selected.media ?? []).length === 0 ? (
                      <p className="col-span-full text-xs" style={{ color: "var(--muted-brk)" }}>
                        Belum ada media terlampir.
                      </p>
                    ) : (
                      selected.media!.map((m) =>
                        m.tipe === "video" ? (
                          <video
                            key={m.uuid}
                            src={m.url}
                            poster={m.thumbnail_url || undefined}
                            controls
                            preload="metadata"
                            className="aspect-4/5 w-full rounded-lg bg-black object-cover"
                          />
                        ) : (
                          <img
                            key={m.uuid}
                            src={m.url}
                            alt={m.alt || selected.judul}
                            className="aspect-4/5 w-full rounded-lg object-cover"
                          />
                        ),
                      )
                    )}
                  </div>

                  <div
                    className="rounded-lg border p-3 text-sm"
                    style={{
                      backgroundColor: "var(--putih)",
                      borderColor: "var(--garis)",
                    }}
                  >
                    <p className="text-xs font-bold" style={{ color: "var(--muted-brk)" }}>
                      Kekurangan yang ditulis koordinator
                    </p>
                    <p className="mt-1">{selected.kekurangan || "-"}</p>
                    <p
                      className="mt-3 text-xs font-bold"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      Keterangan publik
                    </p>
                    <p className="mt-1">{selected.keterangan || "-"}</p>
                  </div>
                </div>

                {/* Right: SOP Checks + Decision */}
                <div className="space-y-4 lg:col-span-6">
                  <h4 className="text-base font-bold">
                    Hasil checklist SOP dan catatan per butir
                  </h4>
                  <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {(selected.checkResults || selected.check_results || []).map(
                      (chk) => {
                        const code = chk.code || chk.kode || "";
                        const ok = Boolean(chk.lulus || chk.nilai === true);
                        return (
                          <li
                            key={code}
                            className="rounded-lg border p-3 text-xs"
                            style={{
                              backgroundColor: "var(--putih)",
                              borderColor: ok
                                ? "var(--daun)"
                                : "var(--bahaya)",
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold">
                                {code} — {chk.pertanyaan}
                              </span>
                              {ok ? (
                                <CheckCircle2
                                  className="size-4 shrink-0"
                                  style={{ color: "var(--daun)" }}
                                />
                              ) : (
                                <XCircle
                                  className="size-4 shrink-0"
                                  style={{ color: "var(--bahaya)" }}
                                />
                              )}
                            </div>
                            <input
                              aria-label={`Catatan untuk butir ${code}`}
                              className="brk-input mt-2 min-h-9.5 py-1.5 text-xs"
                              placeholder="Catatan revisi untuk butir ini (opsional)..."
                              value={notesPerCheck[code] || ""}
                              onChange={(e) =>
                                setNotesPerCheck((prev) => ({
                                  ...prev,
                                  [code]: e.target.value,
                                }))
                              }
                            />
                          </li>
                        );
                      },
                    )}
                  </ul>

                  <div
                    className="space-y-3 rounded-xl border p-4"
                    style={{
                      backgroundColor: "var(--putih)",
                      borderColor: "var(--garis)",
                    }}
                  >
                    <FieldWrapper
                      id="rev-price"
                      label="Harga final disetujui (Rp)"
                    >
                      <RupiahInput
                        id="rev-price"
                        value={finalPrice}
                        onChange={setFinalPrice}
                      />
                    </FieldWrapper>

                    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={specialPriceApproval}
                        onChange={(e) =>
                          setSpecialPriceApproval(e.target.checked)
                        }
                        className="size-4"
                      />
                      <span>
                        Persetujuan khusus harga di luar pedoman (U10)
                      </span>
                    </label>

                    <FieldWrapper
                      id="rev-alasan"
                      label="Catatan umum atau alasan penolakan"
                    >
                      <textarea
                        id="rev-alasan"
                        className="brk-textarea"
                        value={alasan}
                        onChange={(e) => setAlasan(e.target.value)}
                        placeholder="Wajib diisi saat meminta revisi atau menolak barang."
                      />
                    </FieldWrapper>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="brk-btn brk-btn-daun flex-1"
                        onClick={() => setPendingDecision("setuju")}
                      >
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        <span>Setujui dan terbitkan</span>
                      </button>
                      <button
                        type="button"
                        className="brk-btn brk-btn-kunyit"
                        onClick={() => setPendingDecision("revisi")}
                      >
                        <FileWarning className="size-4" aria-hidden="true" />
                        <span>Minta revisi</span>
                      </button>
                      <button
                        type="button"
                        className="brk-btn brk-btn-danger"
                        onClick={() => setPendingDecision("tolak")}
                      >
                        <XCircle className="size-4" aria-hidden="true" />
                        <span>Tolak</span>
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                      Pintasan keyboard: Alt+A (Setujui), Alt+R (Revisi), Alt+T (Tolak)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ConsolePanel>

      {/* Post-publish Audit Sampling */}
      <ConsolePanel
        icon={ShieldAlert}
        title="Audit sampling pasca-terbit"
        description="Catat hasil audit acak (nilai awal 10%) untuk barang yang sudah terbit. Hasil Gagal otomatis menarik barang dari storefront dan memengaruhi Skor Toko."
      >
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!auditUuid.trim()) return;
            auditMut.mutate();
          }}
        >
          <FieldWrapper id="audit-uuid" label="UUID barang terbit" required>
            <input
              id="audit-uuid"
              className="brk-input"
              value={auditUuid}
              onChange={(e) => setAuditUuid(e.target.value)}
              placeholder="Masukkan UUID barang"
              required
            />
          </FieldWrapper>

          <FieldWrapper id="audit-hasil" label="Hasil audit" required>
            <ConsoleSelect
              id="audit-hasil"
              value={auditResult}
              onChange={(v) => setAuditResult(v as "lulus" | "gagal")}
              options={[
                { value: "lulus", label: "Lulus audit" },
                { value: "gagal", label: "Gagal (tarik otomatis)" },
              ]}
            />
          </FieldWrapper>

          <FieldWrapper id="audit-catatan" label="Catatan audit">
            <input
              id="audit-catatan"
              className="brk-input"
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              placeholder="Temuan pemeriksaan"
            />
          </FieldWrapper>

          <button
            type="submit"
            className="brk-btn brk-btn-primary"
            disabled={auditMut.isPending}
          >
            {auditMut.isPending ? "Menyimpan..." : "Simpan hasil audit"}
          </button>
        </form>
      </ConsolePanel>

      <ConfirmDialog
        open={Boolean(pendingDecision)}
        title={
          pendingDecision === "setuju"
            ? "Setujui dan terbitkan barang"
            : pendingDecision === "revisi"
              ? "Minta revisi ke koordinator"
              : "Tolak pengajuan barang"
        }
        description={`Konfirmasi keputusan untuk barang ${selected?.kode_barang || ""}.`}
        consequences={
          pendingDecision === "setuju"
            ? "Barang akan langsung tampil di storefront publik dengan harga final yang disetujui."
            : pendingDecision === "tolak"
              ? "Barang tidak dapat diterbitkan. Koordinator wajib mengabari donatur."
              : "Koordinator diberi waktu maksimal 3 hari kerja untuk memperbaiki butir yang dicatat."
        }
        confirmLabel="Konfirmasi keputusan"
        tone={
          pendingDecision === "setuju"
            ? "daun"
            : pendingDecision === "tolak"
              ? "danger"
              : "primary"
        }
        loading={reviewMut.isPending}
        onCancel={() => setPendingDecision(null)}
        onConfirm={() => {
          if (!pendingDecision) return;
          reviewMut.mutate(pendingDecision);
        }}
      />
    </div>
  );
}
