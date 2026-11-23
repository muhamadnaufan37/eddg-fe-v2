import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  MessageSquareWarning,
  Scale,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAdminLedgerAdjustment,
  createIdempotencyKey,
  decideAdminDispute,
  getAdminLedgerReconciliation,
  getAdminPayouts,
  parseBarokahiinError,
  rejectAdminPayout,
  transferAdminPayout,
  type PayoutRecord,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ConsoleSelect,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  InfoBanner,
  LoadingSkeleton,
  StatusBadge,
} from "../components/ui/ConsoleUi";
import { formatDateId, formatRupiah, unwrapList } from "../components/ui/utils";

export default function AdminFinanceDisputes() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"payouts" | "ledger" | "disputes">(
    "payouts",
  );

  // Payout modals
  const [transferTarget, setTransferTarget] = useState<PayoutRecord | null>(
    null,
  );
  const [buktiRef, setBuktiRef] = useState("");
  const [rejectTarget, setRejectTarget] = useState<PayoutRecord | null>(null);
  const [rejectAlasan, setRejectAlasan] = useState("");

  // Ledger adjustment
  const [debitAccount, setDebitAccount] = useState("");
  const [creditAccount, setCreditAccount] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjAlasan, setAdjAlasan] = useState("");
  const [adjConfirmOpen, setAdjConfirmOpen] = useState(false);
  const [adjKey, setAdjKey] = useState(() => createIdempotencyKey("ledger-adj"));

  // Dispute decision form (POST /admin/disputes/{uuid}/decide)
  const [disputeUuid, setDisputeUuid] = useState("");
  const [disputeConfirmOpen, setDisputeConfirmOpen] = useState(false);
  const [putusan, setPutusan] = useState<
    "tolak" | "refund_sebagian" | "refund_penuh"
  >("tolak");
  const [nominalRefund, setNominalRefund] = useState("");
  const [kelalaian, setKelalaian] = useState(false);
  const [biayaRetur, setBiayaRetur] = useState("0");
  const [disputeCatatan, setDisputeCatatan] = useState("");

  const payoutsQuery = useQuery({
    queryKey: ["barokahiin", "admin", "payouts"],
    queryFn: () => getAdminPayouts({ per_page: 30 }),
    enabled: subTab === "payouts",
  });

  const reconQuery = useQuery({
    queryKey: ["barokahiin", "admin", "ledger-reconciliation"],
    queryFn: getAdminLedgerReconciliation,
    enabled: subTab === "ledger",
  });

  const transferMut = useMutation({
    mutationFn: () => transferAdminPayout(transferTarget!.uuid, buktiRef.trim()),
    onSuccess: () => {
      setTransferTarget(null);
      setBuktiRef("");
      toast.success("Penarikan ditandai selesai dengan bukti transfer");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const rejectPayoutMut = useMutation({
    mutationFn: () =>
      rejectAdminPayout(rejectTarget!.uuid, rejectAlasan.trim()),
    onSuccess: () => {
      setRejectTarget(null);
      setRejectAlasan("");
      toast.success("Penarikan ditolak dan dana dikembalikan ke saldo Tersedia");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const adjMut = useMutation({
    mutationFn: () =>
      createAdminLedgerAdjustment(
        {
          debit_account: debitAccount.trim(),
          credit_account: creditAccount.trim(),
          amount_idr: Number(adjAmount) || 0,
          alasan: adjAlasan.trim(),
        },
        adjKey,
      ),
    onSuccess: () => {
      setAdjConfirmOpen(false);
      setDebitAccount("");
      setCreditAccount("");
      setAdjAmount("");
      setAdjAlasan("");
      setAdjKey(createIdempotencyKey("ledger-adj"));
      toast.success("Entri koreksi ledger tercatat");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "ledger-reconciliation"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const decideMut = useMutation({
    mutationFn: () =>
      decideAdminDispute(disputeUuid.trim(), {
        putusan,
        nominal_refund_idr:
          putusan === "refund_sebagian" || putusan === "refund_penuh"
            ? Number(nominalRefund) || undefined
            : undefined,
        kelalaian_koordinator: kelalaian,
        biaya_retur_idr: Number(biayaRetur) || 0,
        catatan: disputeCatatan.trim() || undefined,
      }),
    onSuccess: () => {
      setDisputeConfirmOpen(false);
      setDisputeUuid("");
      setDisputeCatatan("");
      toast.success("Putusan komplain tercatat");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const { items: payouts } = unwrapList(payoutsQuery.data);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`brk-btn ${subTab === "payouts" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("payouts")}
        >
          <Wallet className="size-4" aria-hidden="true" />
          <span>Penarikan koordinator</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "ledger" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("ledger")}
        >
          <Scale className="size-4" aria-hidden="true" />
          <span>Rekonsiliasi dan koreksi ledger</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "disputes" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("disputes")}
        >
          <MessageSquareWarning className="size-4" aria-hidden="true" />
          <span>Putusan komplain</span>
        </button>
      </div>

      {subTab === "payouts" && (
        <ConsolePanel
          icon={Wallet}
          title="Antrean penarikan saldo koordinator"
          description="Verifikasi kesesuaian nama rekening dengan identitas koordinator, lakukan transfer, lalu catat referensi bukti transfer."
        >
          {payoutsQuery.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : payoutsQuery.error ? (
            <ErrorBanner
              message={parseBarokahiinError(payoutsQuery.error).message}
              onRetry={() => void payoutsQuery.refetch()}
            />
          ) : payouts.length === 0 ? (
            <EmptyState
              title="Tidak ada antrean penarikan"
              description="Pengajuan penarikan dari koordinator akan muncul di sini."
            />
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <article
                  key={p.uuid}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: "var(--garis)" }}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="brk-display brk-num text-lg font-bold">
                        {formatRupiah(p.jumlah_idr)}
                      </span>
                      <StatusBadge value={p.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold">
                      {p.coordinator_name || p.coordinator_uuid || "Koordinator"}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      {p.bank_name ? `${p.bank_name}, ` : ""}
                      {p.account_number_masked || "Rekening terverifikasi"}
                      {p.account_holder ? ` a.n. ${p.account_holder}` : ""} —{" "}
                      {formatDateId(p.created_at)}
                    </p>
                    {p.bukti_ref && (
                      <p className="mt-1 text-xs font-semibold" style={{ color: "var(--daun)" }}>
                        Bukti transfer: {p.bukti_ref}
                      </p>
                    )}
                  </div>

                  {(p.status === "diajukan" || p.status === "diproses") && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="brk-btn brk-btn-daun"
                        onClick={() => {
                          setTransferTarget(p);
                          setBuktiRef("");
                        }}
                      >
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        <span>Catat transfer</span>
                      </button>
                      <button
                        type="button"
                        className="brk-btn brk-btn-danger"
                        onClick={() => {
                          setRejectTarget(p);
                          setRejectAlasan("");
                        }}
                      >
                        <XCircle className="size-4" aria-hidden="true" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </ConsolePanel>
      )}

      {subTab === "ledger" && (
        <div className="space-y-5">
          <ConsolePanel
            icon={Scale}
            title="Rekonsiliasi ledger internal"
            description="Memastikan jumlah seluruh entri ledger berimbang sempurna (total_entries_sum = 0)."
          >
            {reconQuery.isLoading ? (
              <LoadingSkeleton rows={2} />
            ) : reconQuery.error ? (
              <ErrorBanner
                message={parseBarokahiinError(reconQuery.error).message}
                onRetry={() => void reconQuery.refetch()}
              />
            ) : reconQuery.data ? (
              <div className="space-y-4">
                <InfoBanner
                  tone={reconQuery.data.balanced ? "success" : "danger"}
                  title={
                    reconQuery.data.balanced
                      ? "Ledger seimbang (balanced = true)"
                      : "Selisih rekonsiliasi terdeteksi"
                  }
                  message={`Total jumlah seluruh entri ledger: ${formatRupiah(reconQuery.data.total_entries_sum)}.`}
                />

                {reconQuery.data.accounts &&
                  reconQuery.data.accounts.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr
                            className="border-b text-xs font-semibold"
                            style={{
                              borderColor: "var(--garis)",
                              color: "var(--muted-brk)",
                            }}
                          >
                            <th className="py-2.5 pr-4">Akun Ledger</th>
                            <th className="py-2.5 text-right">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reconQuery.data.accounts.map((acc) => (
                            <tr
                              key={acc.account}
                              className="border-b"
                              style={{ borderColor: "var(--garis)" }}
                            >
                              <td className="py-2.5 pr-4 font-semibold">
                                {acc.account}
                              </td>
                              <td className="brk-num py-2.5 text-right font-bold">
                                {formatRupiah(acc.balance_idr)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            ) : null}
          </ConsolePanel>

          <ConsolePanel
            icon={Scale}
            title="Entri koreksi ledger (immutable)"
            description="Ledger tidak pernah dihapus atau diubah. Gunakan entri koreksi berpasangan (debit dan kredit) dengan alasan wajib dan Idempotency-Key."
          >
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  !debitAccount.trim() ||
                  !creditAccount.trim() ||
                  !adjAmount ||
                  !adjAlasan.trim()
                ) {
                  toast.error("Seluruh kolom koreksi ledger wajib diisi.");
                  return;
                }
                setAdjKey(createIdempotencyKey("ledger-adj"));
                setAdjConfirmOpen(true);
              }}
            >
              <FieldWrapper id="adj-debit" label="Akun Debit" required>
                <input
                  id="adj-debit"
                  className="brk-input"
                  value={debitAccount}
                  onChange={(e) => setDebitAccount(e.target.value)}
                  placeholder="Contoh: PLATFORM_OPERATIONAL"
                  required
                />
              </FieldWrapper>

              <FieldWrapper id="adj-credit" label="Akun Kredit" required>
                <input
                  id="adj-credit"
                  className="brk-input"
                  value={creditAccount}
                  onChange={(e) => setCreditAccount(e.target.value)}
                  placeholder="Contoh: GUARANTEE_FUND"
                  required
                />
              </FieldWrapper>

              <FieldWrapper
                id="adj-amount"
                label="Nominal koreksi (Rp, bilangan bulat)"
                required
              >
                <input
                  id="adj-amount"
                  type="number"
                  min={1}
                  className="brk-input brk-num"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  required
                />
              </FieldWrapper>

              <FieldWrapper id="adj-alasan" label="Alasan koreksi (wajib)" required>
                <input
                  id="adj-alasan"
                  className="brk-input"
                  value={adjAlasan}
                  onChange={(e) => setAdjAlasan(e.target.value)}
                  placeholder="Jelaskan dasar audit koreksi ini"
                  required
                />
              </FieldWrapper>

              <div className="sm:col-span-2">
                <button type="submit" className="brk-btn brk-btn-primary">
                  Tinjau dan catat koreksi ledger
                </button>
              </div>
            </form>
          </ConsolePanel>
        </div>
      )}

      {subTab === "disputes" && (
        <ConsolePanel
          icon={MessageSquareWarning}
          title="Tetapkan putusan komplain"
          description="Putuskan tolak, refund sebagian, atau refund penuh berdasarkan UUID komplain. Biaya retur karena kelalaian koordinator dipotong dari komisi barang tersebut."
        >
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!disputeUuid.trim()) {
                toast.error("UUID komplain wajib diisi.");
                return;
              }
              setDisputeConfirmOpen(true);
            }}
          >
            <FieldWrapper id="dsp-uuid" label="UUID komplain" required>
              <input
                id="dsp-uuid"
                className="brk-input"
                value={disputeUuid}
                onChange={(e) => setDisputeUuid(e.target.value)}
                placeholder="Masukkan UUID komplain"
                required
              />
            </FieldWrapper>

            <FieldWrapper id="dsp-putusan" label="Putusan Admin" required>
              <ConsoleSelect
                id="dsp-putusan"
                value={putusan}
                onChange={(v) =>
                  setPutusan(
                    v as "tolak" | "refund_sebagian" | "refund_penuh",
                  )
                }
                options={[
                  { value: "tolak", label: "Tolak komplain (pesanan selesai)" },
                  { value: "refund_sebagian", label: "Refund sebagian" },
                  { value: "refund_penuh", label: "Refund penuh (+ retur barang)" },
                ]}
              />
            </FieldWrapper>

            {(putusan === "refund_sebagian" || putusan === "refund_penuh") && (
              <FieldWrapper id="dsp-nominal" label="Nominal refund (Rp)">
                <input
                  id="dsp-nominal"
                  type="number"
                  className="brk-input brk-num"
                  value={nominalRefund}
                  onChange={(e) => setNominalRefund(e.target.value)}
                />
              </FieldWrapper>
            )}

            <FieldWrapper id="dsp-retur" label="Biaya retur (Rp)">
              <input
                id="dsp-retur"
                type="number"
                className="brk-input brk-num"
                value={biayaRetur}
                onChange={(e) => setBiayaRetur(e.target.value)}
              />
            </FieldWrapper>

            <div className="sm:col-span-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={kelalaian}
                  onChange={(e) => setKelalaian(e.target.checked)}
                  className="size-4"
                />
                <span>
                  Terdapat kelalaian koordinator (potong komisi dan biaya retur)
                </span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <FieldWrapper id="dsp-catatan" label="Catatan putusan">
                <textarea
                  id="dsp-catatan"
                  className="brk-textarea"
                  value={disputeCatatan}
                  onChange={(e) => setDisputeCatatan(e.target.value)}
                />
              </FieldWrapper>
            </div>

            <div className="sm:col-span-2">
              <button type="submit" className="brk-btn brk-btn-primary">
                Tinjau dan tetapkan putusan
              </button>
            </div>
          </form>
        </ConsolePanel>
      )}

      {/* Payout transfer modal */}
      <ConfirmDialog
        open={Boolean(transferTarget)}
        title="Catat transfer penarikan selesai"
        description={`Konfirmasi transfer sebesar ${formatRupiah(transferTarget?.jumlah_idr)} untuk ${transferTarget?.coordinator_name || "koordinator"}.`}
        consequences="Saldo Ditahan Penarikan akan didebit permanen dan penarikan ditandai selesai."
        confirmLabel="Tandai sudah ditransfer"
        tone="daun"
        loading={transferMut.isPending}
        onCancel={() => setTransferTarget(null)}
        onConfirm={() => {
          if (!buktiRef.trim()) {
            toast.error("Referensi bukti transfer wajib diisi.");
            return;
          }
          transferMut.mutate();
        }}
      >
        <FieldWrapper
          id="payout-bukti"
          label="Nomor referensi atau bukti transfer"
          required
        >
          <input
            id="payout-bukti"
            className="brk-input"
            value={buktiRef}
            onChange={(e) => setBuktiRef(e.target.value)}
            placeholder="Contoh: TRF-BCA-20261123-0042"
          />
        </FieldWrapper>
      </ConfirmDialog>

      {/* Payout reject modal */}
      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Tolak permintaan penarikan"
        description="Dana akan dikembalikan dari Ditahan Penarikan ke saldo Tersedia koordinator."
        confirmLabel="Tolak penarikan"
        tone="danger"
        loading={rejectPayoutMut.isPending}
        onCancel={() => setRejectTarget(null)}
        onConfirm={() => {
          if (!rejectAlasan.trim()) {
            toast.error("Alasan penolakan wajib diisi.");
            return;
          }
          rejectPayoutMut.mutate();
        }}
      >
        <FieldWrapper id="payout-rej-alasan" label="Alasan penolakan" required>
          <textarea
            id="payout-rej-alasan"
            className="brk-textarea"
            value={rejectAlasan}
            onChange={(e) => setRejectAlasan(e.target.value)}
          />
        </FieldWrapper>
      </ConfirmDialog>

      {/* Ledger adjustment confirm */}
      <ConfirmDialog
        open={adjConfirmOpen}
        title="Konfirmasi entri koreksi ledger"
        description={`Debit ${debitAccount} dan Kredit ${creditAccount} sebesar ${formatRupiah(Number(adjAmount))}.`}
        consequences="Entri koreksi bersifat immutable dan akan tercatat di Audit Log beserta alasan Anda."
        confirmLabel="Catat koreksi"
        tone="danger"
        loading={adjMut.isPending}
        onCancel={() => setAdjConfirmOpen(false)}
        onConfirm={() => adjMut.mutate()}
      />

      {/* Dispute decide confirm */}
      <ConfirmDialog
        open={disputeConfirmOpen}
        title={`Konfirmasi putusan komplain`}
        description={`Tetapkan putusan "${putusan.replaceAll("_", " ")}" untuk komplain UUID ${disputeUuid}.`}
        consequences="Putusan refund akan membuat entri lawan atau koreksi negatif pada dompet koordinator sesuai ketentuan PRD 8.7."
        confirmLabel="Tetapkan putusan"
        tone="primary"
        loading={decideMut.isPending}
        onCancel={() => setDisputeConfirmOpen(false)}
        onConfirm={() => decideMut.mutate()}
      />
    </div>
  );
}
