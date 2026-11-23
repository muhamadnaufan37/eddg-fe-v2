import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, HeartHandshake, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  createIdempotencyKey,
  getConsoleWallet,
  getConsoleWalletEntries,
  parseBarokahiinError,
  requestConsolePayout,
  updateWalletCharityShare,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  LoadingSkeleton,
  Pager,
} from "../components/ui/ConsoleUi";
import { formatDateId, formatRupiah, unwrapList } from "../components/ui/utils";

export default function CoordinatorWallet() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Charity share settings
  const [charityPct, setCharityPct] = useState("0");
  const [charityProgramId, setCharityProgramId] = useState("");

  // Payout modal
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("100000");
  const [payoutIdempotencyKey, setPayoutIdempotencyKey] = useState(() =>
    createIdempotencyKey("payout"),
  );

  const walletQuery = useQuery({
    queryKey: ["barokahiin", "console", "wallet"],
    queryFn: getConsoleWallet,
  });

  const entriesQuery = useQuery({
    queryKey: ["barokahiin", "console", "wallet-entries", page],
    queryFn: () => getConsoleWalletEntries({ page, per_page: 20 }),
  });

  useEffect(() => {
    if (!walletQuery.data) return;
    setCharityPct(String(walletQuery.data.charity_share_pct ?? 0));
    if (walletQuery.data.charity_program_id) {
      setCharityProgramId(String(walletQuery.data.charity_program_id));
    }
  }, [walletQuery.data]);

  const charityShareMut = useMutation({
    mutationFn: () =>
      updateWalletCharityShare({
        charity_share_pct: Math.min(100, Math.max(0, Number(charityPct) || 0)),
        charity_program_id: charityProgramId
          ? Number(charityProgramId) || charityProgramId
          : null,
      }),
    onSuccess: () => {
      toast.success(
        "Pengaturan alokasi sukarela ke Charity disimpan untuk pesanan berikutnya",
      );
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "wallet"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const payoutMut = useMutation({
    mutationFn: () =>
      requestConsolePayout(Number(payoutAmount), payoutIdempotencyKey),
    onSuccess: () => {
      setPayoutOpen(false);
      setPayoutIdempotencyKey(createIdempotencyKey("payout"));
      toast.success(
        "Permintaan penarikan diajukan. Saldo dipindahkan ke Ditahan Penarikan.",
      );
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  if (walletQuery.isLoading) return <LoadingSkeleton rows={4} />;
  if (walletQuery.error) {
    return (
      <ErrorBanner
        message={parseBarokahiinError(walletQuery.error).message}
        onRetry={() => void walletQuery.refetch()}
      />
    );
  }

  const wallet = walletQuery.data;
  const minPayout = wallet?.min_payout_idr ?? 100000;
  const { items: entries, pagination } = unwrapList(entriesQuery.data);

  return (
    <div className="space-y-5">
      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="brk-card p-5">
          <p className="text-sm font-medium" style={{ color: "var(--muted-brk)" }}>
            Saldo Tersedia
          </p>
          <p
            className="brk-display brk-num mt-2 text-2xl font-bold"
            style={{ color: "var(--daun)" }}
          >
            {formatRupiah(wallet?.available_idr)}
          </p>
          <p className="mt-1.5 text-xs" style={{ color: "var(--muted-brk)" }}>
            Komisi pesanan selesai serta penggantian ongkir dan biaya kemas yang siap ditarik.
          </p>
          <button
            type="button"
            className="brk-btn brk-btn-primary mt-4 w-full"
            disabled={(wallet?.available_idr ?? 0) < minPayout}
            onClick={() => {
              setPayoutAmount(String(Math.max(minPayout, wallet?.available_idr ?? minPayout)));
              setPayoutIdempotencyKey(createIdempotencyKey("payout"));
              setPayoutOpen(true);
            }}
          >
            <ArrowUpRight className="size-4" aria-hidden="true" />
            <span>Ajukan penarikan</span>
          </button>
          <p className="brk-num mt-2 text-xs" style={{ color: "var(--muted-brk)" }}>
            Minimal penarikan: {formatRupiah(minPayout)}
          </p>
        </div>

        <div className="brk-card p-5">
          <p className="text-sm font-medium" style={{ color: "var(--muted-brk)" }}>
            Saldo Tertunda
          </p>
          <p className="brk-display brk-num mt-2 text-2xl font-bold">
            {formatRupiah(wallet?.pending_idr)}
          </p>
          <p className="mt-1.5 text-xs" style={{ color: "var(--muted-brk)" }}>
            Komisi dari pesanan berbayar yang menunggu masa jendela komplain 48 jam berakhir.
          </p>
        </div>

        <div className="brk-card p-5">
          <p className="text-sm font-medium" style={{ color: "var(--muted-brk)" }}>
            Ditahan untuk Penarikan
          </p>
          <p
            className="brk-display brk-num mt-2 text-2xl font-bold"
            style={{ color: "var(--indigo)" }}
          >
            {formatRupiah(wallet?.payout_hold_idr)}
          </p>
          <p className="mt-1.5 text-xs" style={{ color: "var(--muted-brk)" }}>
            Dana yang sedang diproses transfer oleh Admin Keuangan ke rekening terverifikasi Anda.
          </p>
        </div>
      </div>

      {/* Voluntary charity share from commission */}
      <ConsolePanel
        icon={HeartHandshake}
        title="Alokasi sukarela komisi ke Charity"
        description="Anda dapat mengalihkan 0% sampai 100% komisi ke satu program Charity yang disetujui. Pengaturan ini berlaku untuk pesanan berikutnya."
      >
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            charityShareMut.mutate();
          }}
        >
          <FieldWrapper
            id="wallet-charity-pct"
            label="Persentase komisi ke Charity (%)"
            helper="Bilangan bulat 0 sampai 100."
          >
            <input
              id="wallet-charity-pct"
              type="number"
              min={0}
              max={100}
              className="brk-input brk-num"
              value={charityPct}
              onChange={(e) => setCharityPct(e.target.value)}
            />
          </FieldWrapper>

          <FieldWrapper
            id="wallet-charity-prog"
            label="ID Program Charity tujuan"
            helper="Masukkan ID program Charity yang disetujui Admin."
          >
            <input
              id="wallet-charity-prog"
              className="brk-input brk-num"
              value={charityProgramId}
              onChange={(e) => setCharityProgramId(e.target.value)}
              placeholder="Contoh: 1"
            />
          </FieldWrapper>

          <button
            type="submit"
            className="brk-btn brk-btn-daun"
            disabled={charityShareMut.isPending}
          >
            {charityShareMut.isPending ? "Menyimpan..." : "Simpan alokasi"}
          </button>
        </form>
      </ConsolePanel>

      {/* Ledger history */}
      <ConsolePanel
        icon={Receipt}
        title="Riwayat entri dompet (ledger)"
        description="Seluruh pencatatan bersifat immutable. Penggantian ongkir dan biaya kemas tercatat terpisah dari komisi."
      >
        {entriesQuery.isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : entriesQuery.error ? (
          <ErrorBanner
            message={parseBarokahiinError(entriesQuery.error).message}
            onRetry={() => void entriesQuery.refetch()}
          />
        ) : entries.length === 0 ? (
          <EmptyState
            title="Belum ada mutasi dompet"
            description="Komisi, penggantian ongkir, dan penarikan Anda akan tercatat di sini."
          />
        ) : (
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
                  <th className="py-3 pr-4">Waktu</th>
                  <th className="py-3 pr-4">Jenis dan keterangan</th>
                  <th className="py-3 pr-4">Bucket</th>
                  <th className="py-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr
                    key={entry.uuid || entry.id || idx}
                    className="border-b"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <td className="brk-num whitespace-nowrap py-3 pr-4 text-xs" style={{ color: "var(--muted-brk)" }}>
                      {formatDateId(entry.created_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold capitalize">
                        {entry.jenis.replaceAll("_", " ")}
                      </p>
                      {(entry.keterangan || entry.order_code) && (
                        <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                          {entry.order_code ? `Pesanan ${entry.order_code}` : ""}{" "}
                          {entry.keterangan || ""}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs font-semibold">
                      {entry.bucket || "-"}
                    </td>
                    <td
                      className="brk-num whitespace-nowrap py-3 text-right font-bold"
                      style={{
                        color:
                          entry.amount_idr >= 0
                            ? "var(--daun)"
                            : "var(--bahaya)",
                      }}
                    >
                      {formatRupiah(entry.amount_idr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={pagination} onChange={setPage} />
      </ConsolePanel>

      <ConfirmDialog
        open={payoutOpen}
        title="Ajukan penarikan saldo"
        description="Dana akan ditransfer manual per batch oleh Admin Keuangan hanya ke rekening terverifikasi atas nama Anda sendiri."
        consequences="Saldo yang diajukan akan langsung dipindahkan ke Ditahan Penarikan sampai Admin Keuangan mengunggah bukti transfer."
        confirmLabel="Konfirmasi penarikan"
        tone="primary"
        loading={payoutMut.isPending}
        onCancel={() => setPayoutOpen(false)}
        onConfirm={() => {
          const amt = Number(payoutAmount) || 0;
          if (amt < minPayout) {
            toast.error(`Minimal penarikan adalah ${formatRupiah(minPayout)}.`);
            return;
          }
          if (amt > (wallet?.available_idr ?? 0)) {
            toast.error("Nominal melebihi saldo Tersedia.");
            return;
          }
          payoutMut.mutate();
        }}
      >
        <div className="space-y-3">
          <FieldWrapper
            id="payout-amount"
            label="Nominal penarikan (Rp)"
            required
            helper={`Saldo Tersedia: ${formatRupiah(wallet?.available_idr)}`}
          >
            <input
              id="payout-amount"
              type="number"
              min={minPayout}
              step={1000}
              className="brk-input brk-num"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
            />
          </FieldWrapper>
          {wallet?.bank_account_masked && (
            <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
              Rekening tujuan: <strong>{wallet.bank_account_masked}</strong>
            </p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}
