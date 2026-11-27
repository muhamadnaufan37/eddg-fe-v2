import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Coins, HeartHandshake, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  EMPTY_WILAYAH,
  allocateAdminPool,
  approveAdminDisbursement,
  approveAdminProgram,
  createIdempotencyKey,
  getAdminPrograms,
  parseBarokahiinError,
  type WilayahValue,
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
  RupiahInput,
  StatusBadge,
  WilayahCascader,
} from "../components/ui/ConsoleUi";
import { formatDateId, formatRupiah, unwrapList } from "../components/ui/utils";

export default function AdminCharity() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const programsQuery = useQuery({
    queryKey: ["barokahiin", "admin", "programs", statusFilter, page],
    queryFn: () =>
      getAdminPrograms({ status: statusFilter, page, per_page: 20 }),
  });

  const { items: programs, pagination } = unwrapList(programsQuery.data);

  // Approve program (POST /admin/programs/{uuid}/approve)
  const [approveProgUuid, setApproveProgUuid] = useState("");

  // Pool allocation form (POST /admin/pool/allocate)
  const [wilayah, setWilayah] = useState<WilayahValue>(EMPTY_WILAYAH);
  const [programUuid, setProgramUuid] = useState("");
  const [amountIdr, setAmountIdr] = useState("500000");
  const [catatan, setCatatan] = useState("");
  const [allocConfirmOpen, setAllocConfirmOpen] = useState(false);
  const [allocKey, setAllocKey] = useState(() =>
    createIdempotencyKey("pool-alloc"),
  );

  // Approve disbursement (POST /admin/disbursements/{uuid}/approve)
  const [disbUuidInput, setDisbUuidInput] = useState("");

  const approveProgMut = useMutation({
    mutationFn: (uuid: string) => approveAdminProgram(uuid),
    onSuccess: () => {
      setApproveProgUuid("");
      toast.success("Program Charity disetujui untuk menerima dana");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const allocateMut = useMutation({
    mutationFn: () =>
      allocateAdminPool(
        {
          province_code: wilayah.province_code || undefined,
          regency_code: wilayah.regency_code,
          program_uuid: programUuid.trim(),
          amount_idr: Number(amountIdr) || 0,
          catatan: catatan.trim() || undefined,
        },
        allocKey,
      ),
    onSuccess: () => {
      setAllocConfirmOpen(false);
      setCatatan("");
      setAllocKey(createIdempotencyKey("pool-alloc"));
      toast.success(
        "Dana Kegiatan wilayah berhasil dialokasikan ke Dompet Program",
      );
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const approveDisbMut = useMutation({
    mutationFn: (uuid: string) => approveAdminDisbursement(uuid),
    onSuccess: () => {
      setDisbUuidInput("");
      toast.success("Pencairan Dompet Program disetujui");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  return (
    <div className="space-y-5">
      {/* Live Programs List (GET /admin/programs) */}
      <ConsolePanel
        icon={HeartHandshake}
        title="Daftar program Charity"
        description="Tinjau pengajuan program, setujui program baru, alokasikan Dana Kegiatan wilayah, dan setujui pengajuan pencairan."
      >
        <div className="mb-4 w-full sm:max-w-60">
          <ConsoleSelect
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "Semua status" },
              { value: "diajukan", label: "Diajukan (butuh persetujuan)" },
              { value: "disetujui", label: "Disetujui" },
              { value: "berjalan", label: "Berjalan" },
              { value: "selesai", label: "Selesai" },
              { value: "dilaporkan", label: "Dilaporkan" },
              { value: "ditolak", label: "Ditolak" },
            ]}
          />
        </div>

        {programsQuery.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : programsQuery.error ? (
          <ErrorBanner
            message={parseBarokahiinError(programsQuery.error).message}
            onRetry={() => void programsQuery.refetch()}
          />
        ) : programs.length === 0 ? (
          <EmptyState
            title="Belum ada program Charity"
            description="Program Charity yang diajukan koordinator wilayah akan tampil di sini."
          />
        ) : (
          <div className="space-y-3">
            {programs.map((prog) => (
              <article
                key={prog.uuid}
                className="rounded-xl border p-4 text-sm"
                style={{ borderColor: "var(--garis)" }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{prog.judul}</h3>
                      <StatusBadge value={prog.status} />
                    </div>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      {prog.coordinator_name ? `${prog.coordinator_name} · ` : ""}
                      {prog.region_name || ""}
                      {prog.periode_mulai
                        ? ` · ${formatDateId(prog.periode_mulai)} – ${formatDateId(prog.periode_selesai)}`
                        : ""}
                    </p>
                    <p
                      className="brk-num mt-1 text-xs font-semibold"
                      style={{ color: "var(--indigo)" }}
                    >
                      Saldo: {formatRupiah(prog.wallet_balance_idr ?? prog.terkumpul_idr)} / Target {formatRupiah(prog.target_idr)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prog.status === "diajukan" && (
                      <button
                        type="button"
                        className="brk-btn brk-btn-daun"
                        disabled={approveProgMut.isPending}
                        onClick={() => approveProgMut.mutate(prog.uuid)}
                      >
                        {approveProgMut.isPending &&
                        approveProgMut.variables === prog.uuid ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        )}
                        <span>
                          {approveProgMut.isPending &&
                          approveProgMut.variables === prog.uuid
                            ? "Menyetujui..."
                            : "Setujui program"}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="brk-btn brk-btn-secondary"
                      onClick={() => setProgramUuid(prog.uuid)}
                    >
                      <Coins className="size-4" aria-hidden="true" />
                      <span>Pilih untuk alokasi</span>
                    </button>
                  </div>
                </div>

                {prog.disbursements && prog.disbursements.length > 0 && (
                  <div
                    className="mt-3 space-y-2 border-t pt-3 text-xs"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <p className="font-bold" style={{ color: "var(--muted-brk)" }}>
                      Pengajuan pencairan ({prog.disbursements.length})
                    </p>
                    {prog.disbursements.map((d) => (
                      <div
                        key={d.uuid}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5"
                        style={{
                          backgroundColor: "var(--kertas)",
                          borderColor: "var(--garis)",
                        }}
                      >
                        <div>
                          <span className="brk-num font-bold">
                            {formatRupiah(d.jumlah_idr)}
                          </span>{" "}
                          — {d.keperluan} ({d.status})
                        </div>
                        {d.status === "diajukan" && (
                          <button
                            type="button"
                            className="brk-btn brk-btn-primary min-h-8 px-2.5 text-xs"
                            disabled={approveDisbMut.isPending}
                            onClick={() => approveDisbMut.mutate(d.uuid)}
                          >
                            {approveDisbMut.isPending &&
                            approveDisbMut.variables === d.uuid ? (
                              <>
                                <Loader2
                                  className="size-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                                <span>Menyetujui...</span>
                              </>
                            ) : (
                              "Setujui pencairan"
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        <Pager pagination={pagination} onChange={setPage} />
      </ConsolePanel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Allocate regional activity pool */}
        <ConsolePanel
          className="lg:col-span-6"
          icon={Coins}
          title="Alokasi Dana Kegiatan wilayah"
          description="Pindahkan dana dari pool Dana Kegiatan wilayah (30%) ke Dompet Program yang sudah disetujui menggunakan Idempotency-Key."
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!wilayah.regency_code) {
                toast.error("Pilih wilayah pool asal (Provinsi & Kabupaten/Kota).");
                return;
              }
              if (!programUuid.trim() || !amountIdr) {
                toast.error("UUID program tujuan dan nominal wajib diisi.");
                return;
              }
              setAllocKey(createIdempotencyKey("pool-alloc"));
              setAllocConfirmOpen(true);
            }}
          >
            <FieldWrapper label="Wilayah asal pool (Kabupaten / Kota)" required>
              <WilayahCascader
                value={wilayah}
                onChange={setWilayah}
                maxLevel="regency"
              />
            </FieldWrapper>

            <FieldWrapper
              id="alloc-prog"
              label="Program Charity tujuan"
              required
            >
              <ConsoleSelect
                id="alloc-prog"
                value={programUuid}
                onChange={setProgramUuid}
                placeholder="Pilih program yang disetujui"
                options={programs.map((p) => ({
                  value: p.uuid,
                  label: `${p.judul} (${p.status})`,
                }))}
              />
            </FieldWrapper>

            <FieldWrapper
              id="alloc-amount"
              label="Nominal alokasi (Rp)"
              required
            >
              <RupiahInput
                id="alloc-amount"
                value={amountIdr}
                onChange={setAmountIdr}
                step={10000}
                required
              />
            </FieldWrapper>

            <FieldWrapper id="alloc-note" label="Catatan alokasi">
              <input
                id="alloc-note"
                className="brk-input"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </FieldWrapper>

            <button type="submit" className="brk-btn brk-btn-daun w-full">
              Alokasikan dana ke program
            </button>
          </form>
        </ConsolePanel>

        {/* Approve Program & Approve Disbursement */}
        <div className="space-y-5 lg:col-span-6">
          <ConsolePanel
            icon={HeartHandshake}
            title="Setujui pengajuan program Charity"
            description="Program belum dapat menerima dana dari bagi hasil, Pembulatan Kebaikan, atau Barang Charity sebelum disetujui Admin."
          >
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!approveProgUuid.trim()) return;
                approveProgMut.mutate(approveProgUuid.trim());
              }}
            >
              <FieldWrapper
                id="approve-prog-uuid"
                label="UUID program Charity"
                required
              >
                <input
                  id="approve-prog-uuid"
                  className="brk-input"
                  value={approveProgUuid}
                  onChange={(e) => setApproveProgUuid(e.target.value)}
                  placeholder="Masukkan UUID program yang diajukan"
                  required
                />
              </FieldWrapper>
              <button
                type="submit"
                className="brk-btn brk-btn-daun w-full"
                disabled={approveProgMut.isPending}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                <span>
                  {approveProgMut.isPending
                    ? "Menyetujui..."
                    : "Setujui program Charity"}
                </span>
              </button>
            </form>
          </ConsolePanel>

          <ConsolePanel
            icon={CheckCircle2}
            title="Setujui pencairan Dompet Program"
            description="Menyetujui pengajuan pencairan dana program oleh koordinator."
          >
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!disbUuidInput.trim()) return;
                approveDisbMut.mutate(disbUuidInput.trim());
              }}
            >
              <FieldWrapper id="disb-uuid" label="UUID pencairan" required>
                <input
                  id="disb-uuid"
                  className="brk-input"
                  placeholder="Masukkan UUID pencairan..."
                  value={disbUuidInput}
                  onChange={(e) => setDisbUuidInput(e.target.value)}
                  required
                />
              </FieldWrapper>
              <button
                type="submit"
                className="brk-btn brk-btn-primary w-full"
                disabled={approveDisbMut.isPending}
              >
                {approveDisbMut.isPending
                  ? "Menyetujui..."
                  : "Setujui pencairan"}
              </button>
            </form>
          </ConsolePanel>
        </div>
      </div>

      <ConfirmDialog
        open={allocConfirmOpen}
        title="Konfirmasi alokasi Dana Kegiatan"
        description={`Alokasikan ${formatRupiah(Number(amountIdr))} dari pool wilayah ${wilayah.regency_code} ke program ${programUuid}.`}
        consequences="Transaksi ini menggunakan Idempotency-Key dan langsung tercatat di ledger."
        confirmLabel="Konfirmasi alokasi"
        tone="daun"
        loading={allocateMut.isPending}
        onCancel={() => setAllocConfirmOpen(false)}
        onConfirm={() => allocateMut.mutate()}
      />
    </div>
  );
}
