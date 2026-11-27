import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Coins, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import {
  EMPTY_WILAYAH,
  allocateAdminPool,
  approveAdminDisbursement,
  approveAdminProgram,
  createIdempotencyKey,
  parseBarokahiinError,
  type WilayahValue,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  FieldWrapper,
  RupiahInput,
  WilayahCascader,
} from "../components/ui/ConsoleUi";
import { formatRupiah } from "../components/ui/utils";

export default function AdminCharity() {
  const queryClient = useQueryClient();

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
              label="UUID Program Charity tujuan"
              required
            >
              <input
                id="alloc-prog"
                className="brk-input"
                value={programUuid}
                onChange={(e) => setProgramUuid(e.target.value)}
                placeholder="Masukkan UUID program yang disetujui"
                required
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
