import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Ticket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createAdminVoucher,
  deleteAdminVoucher,
  getAdminVouchers,
  parseBarokahiinError,
  updateAdminVoucher,
  type AdminVoucher,
  type AdminVoucherPayload,
  type VoucherType,
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
} from "../components/ui/ConsoleUi";
import {
  ITEM_CATEGORIES_SEED,
  formatDateId,
  formatRupiah,
  unwrapList,
} from "../components/ui/utils";

interface VoucherFormState {
  code: string;
  nama: string;
  deskripsi: string;
  tipe: VoucherType;
  nilai: string;
  max_discount_idr: string;
  min_subtotal_idr: string;
  quota_total: string;
  per_user_limit: string;
  category_id: string;
  is_public: boolean;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
}

const emptyVoucherForm: VoucherFormState = {
  code: "",
  nama: "",
  deskripsi: "",
  tipe: "fixed",
  nilai: "15000",
  max_discount_idr: "",
  min_subtotal_idr: "50000",
  quota_total: "100",
  per_user_limit: "1",
  category_id: "",
  is_public: true,
  is_active: true,
  starts_at: "",
  ends_at: "",
};

function toDateTimeLocal(val?: string | null): string {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

export default function AdminVouchers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminVoucher | null>(null);
  const [form, setForm] = useState<VoucherFormState>(emptyVoucherForm);
  const [deleteTarget, setDeleteTarget] = useState<AdminVoucher | null>(null);

  const vouchersQuery = useQuery({
    queryKey: ["barokahiin", "admin", "vouchers", search, page],
    queryFn: () => getAdminVouchers({ q: search, page, per_page: 15 }),
  });

  const buildPayload = (): AdminVoucherPayload => ({
    code: form.code.trim().toUpperCase(),
    nama: form.nama.trim(),
    deskripsi: form.deskripsi.trim() || null,
    tipe: form.tipe,
    nilai: Number(form.nilai) || 0,
    max_discount_idr:
      form.tipe === "percent" && form.max_discount_idr
        ? Number(form.max_discount_idr)
        : null,
    min_subtotal_idr: Number(form.min_subtotal_idr) || 0,
    quota_total: form.quota_total ? Number(form.quota_total) : null,
    per_user_limit: Math.max(1, Number(form.per_user_limit) || 1),
    category_id: form.category_id ? Number(form.category_id) : null,
    is_public: form.is_public,
    is_active: form.is_active,
    starts_at: form.starts_at || null,
    ends_at: form.ends_at || null,
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = buildPayload();
      if (editing) {
        return updateAdminVoucher(editing.uuid, payload);
      }
      return createAdminVoucher(payload);
    },
    onSuccess: () => {
      toast.success(
        editing ? "Voucher berhasil diperbarui" : "Voucher baru berhasil dibuat",
      );
      setModalOpen(false);
      setEditing(null);
      setForm(emptyVoucherForm);
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "vouchers"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const toggleActiveMut = useMutation({
    mutationFn: (v: AdminVoucher) =>
      updateAdminVoucher(v.uuid, { is_active: !v.is_active }),
    onSuccess: () => {
      toast.success("Status aktif voucher diperbarui");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "vouchers"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteAdminVoucher(deleteTarget!.uuid),
    onSuccess: () => {
      setDeleteTarget(null);
      toast.success("Voucher berhasil dihapus");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "vouchers"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyVoucherForm);
    setModalOpen(true);
  };

  const openEdit = (v: AdminVoucher) => {
    setEditing(v);
    setForm({
      code: v.code ?? "",
      nama: v.nama ?? "",
      deskripsi: v.deskripsi ?? "",
      tipe: v.tipe ?? "fixed",
      nilai: String(v.nilai ?? 0),
      max_discount_idr:
        v.max_discount_idr !== null && v.max_discount_idr !== undefined
          ? String(v.max_discount_idr)
          : "",
      min_subtotal_idr: String(v.min_subtotal_idr ?? 0),
      quota_total:
        v.quota_total !== null && v.quota_total !== undefined
          ? String(v.quota_total)
          : "",
      per_user_limit: String(v.per_user_limit ?? 1),
      category_id: v.category_id ? String(v.category_id) : "",
      is_public: Boolean(v.is_public),
      is_active: Boolean(v.is_active),
      starts_at: toDateTimeLocal(v.starts_at),
      ends_at: toDateTimeLocal(v.ends_at),
    });
    setModalOpen(true);
  };

  const { items: vouchers, pagination } = unwrapList(vouchersQuery.data);

  return (
    <div className="space-y-5">
      <ConsolePanel
        icon={Ticket}
        title="Manajemen Voucher E-Commerce"
        description="Kelola voucher potongan tetap, persentase, atau gratis ongkir yang tampil di halaman checkout Storefront."
        action={
          <button
            type="button"
            className="brk-btn brk-btn-primary"
            onClick={openCreate}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>Buat voucher</span>
          </button>
        }
      >
        <div className="mb-4">
          <input
            type="search"
            aria-label="Cari kode atau nama voucher"
            className="brk-input sm:max-w-sm"
            placeholder="Cari kode atau nama voucher..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {vouchersQuery.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : vouchersQuery.error ? (
          <ErrorBanner
            message={parseBarokahiinError(vouchersQuery.error).message}
            onRetry={() => void vouchersQuery.refetch()}
          />
        ) : vouchers.length === 0 ? (
          <EmptyState
            title="Belum ada voucher"
            description="Buat voucher promosi untuk mendukung transaksi di Storefront Barokahiin."
            action={
              <button
                type="button"
                className="brk-btn brk-btn-primary"
                onClick={openCreate}
              >
                <Plus className="size-4" aria-hidden="true" />
                <span>Buat voucher pertama</span>
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {vouchers.map((v) => (
              <article
                key={v.uuid}
                className="flex flex-col justify-between gap-3 rounded-xl border p-4"
                style={{ borderColor: "var(--garis)" }}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="brk-num rounded-md border px-2.5 py-1 text-sm font-bold"
                      style={{
                        backgroundColor: "var(--indigo-muda)",
                        color: "var(--indigo)",
                        borderColor: "var(--indigo)",
                      }}
                    >
                      {v.code}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge value={v.is_active ? "aktif" : "ditarik"} />
                      {v.is_public && (
                        <span
                          className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                          style={{
                            borderColor: "var(--garis)",
                            color: "var(--muted-brk)",
                          }}
                        >
                          Publik
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="mt-2 text-base font-bold">{v.nama}</h3>
                  {v.deskripsi && (
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      {v.deskripsi}
                    </p>
                  )}

                  <dl className="brk-num mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt style={{ color: "var(--muted-brk)" }}>Nilai potongan</dt>
                      <dd className="font-bold">
                        {v.tipe === "percent"
                          ? `${v.nilai}%${v.max_discount_idr ? ` (maks. ${formatRupiah(v.max_discount_idr)})` : ""}`
                          : v.tipe === "free_shipping"
                            ? `Gratis ongkir s/d ${formatRupiah(v.nilai)}`
                            : formatRupiah(v.nilai)}
                      </dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--muted-brk)" }}>Minimal belanja</dt>
                      <dd className="font-bold">
                        {formatRupiah(v.min_subtotal_idr)}
                      </dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--muted-brk)" }}>Kuota / Batas user</dt>
                      <dd className="font-semibold">
                        {v.quota_used ?? 0} / {v.quota_total ?? "Tanpa batas"} (
                        {v.per_user_limit}x/akun)
                      </dd>
                    </div>
                    <div>
                      <dt style={{ color: "var(--muted-brk)" }}>Masa berlaku</dt>
                      <dd className="font-semibold">
                        {v.ends_at ? formatDateId(v.ends_at, false) : "Tanpa batas"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div
                  className="flex flex-wrap gap-2 border-t pt-3"
                  style={{ borderColor: "var(--garis)" }}
                >
                  <button
                    type="button"
                    className="brk-btn brk-btn-secondary min-h-10 px-3 text-xs"
                    onClick={() => openEdit(v)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    className="brk-btn brk-btn-ghost min-h-10 px-3 text-xs"
                    disabled={toggleActiveMut.isPending}
                    onClick={() => toggleActiveMut.mutate(v)}
                  >
                    {v.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    type="button"
                    className="brk-btn brk-btn-danger min-h-10 px-3 text-xs"
                    onClick={() => setDeleteTarget(v)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    <span>Hapus</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pager pagination={pagination} onChange={setPage} />
      </ConsolePanel>

      {/* Create / Edit Voucher Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="brk-voucher-modal-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 sm:items-center sm:p-4"
          onClick={() => setModalOpen(false)}
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
              <h2 id="brk-voucher-modal-title" className="text-lg font-bold">
                {editing ? `Ubah voucher ${editing.code}` : "Buat voucher baru"}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Tutup modal voucher"
                className="size-10 shrink-0 rounded-lg"
                onClick={() => setModalOpen(false)}
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.code.trim() || !form.nama.trim()) {
                  toast.error("Kode dan nama voucher wajib diisi.");
                  return;
                }
                saveMut.mutate();
              }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper id="vc-code" label="Kode voucher" required>
                  <input
                    id="vc-code"
                    className="brk-input brk-num uppercase"
                    value={form.code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="Contoh: BAROKAH25"
                    required
                  />
                </FieldWrapper>

                <FieldWrapper id="vc-nama" label="Nama voucher" required>
                  <input
                    id="vc-nama"
                    className="brk-input"
                    value={form.nama}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nama: e.target.value }))
                    }
                    placeholder="Potongan Belanja Perdana"
                    required
                  />
                </FieldWrapper>
              </div>

              <FieldWrapper id="vc-desc" label="Deskripsi (opsional)">
                <input
                  id="vc-desc"
                  className="brk-input"
                  value={form.deskripsi}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, deskripsi: e.target.value }))
                  }
                />
              </FieldWrapper>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper id="vc-tipe" label="Tipe voucher" required>
                  <ConsoleSelect
                    id="vc-tipe"
                    value={form.tipe}
                    onChange={(v) =>
                      setForm((prev) => ({ ...prev, tipe: v as VoucherType }))
                    }
                    options={[
                      { value: "fixed", label: "Potongan nominal tetap (Rp)" },
                      { value: "percent", label: "Potongan persentase (%)" },
                      { value: "free_shipping", label: "Gratis ongkir (Rp)" },
                    ]}
                  />
                </FieldWrapper>

                <FieldWrapper
                  id="vc-nilai"
                  label={
                    form.tipe === "percent"
                      ? "Persentase diskon (%)"
                      : "Nilai potongan (Rp)"
                  }
                  required
                >
                  {form.tipe === "percent" ? (
                    <input
                      id="vc-nilai"
                      type="number"
                      min={1}
                      max={100}
                      className="brk-input brk-num"
                      value={form.nilai}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, nilai: e.target.value }))
                      }
                      required
                    />
                  ) : (
                    <RupiahInput
                      id="vc-nilai"
                      value={form.nilai}
                      onChange={(val) =>
                        setForm((prev) => ({ ...prev, nilai: val }))
                      }
                      required
                    />
                  )}
                </FieldWrapper>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {form.tipe === "percent" && (
                  <FieldWrapper
                    id="vc-max"
                    label="Maksimal potongan (Rp, opsional)"
                  >
                    <RupiahInput
                      id="vc-max"
                      value={form.max_discount_idr}
                      onChange={(val) =>
                        setForm((prev) => ({ ...prev, max_discount_idr: val }))
                      }
                    />
                  </FieldWrapper>
                )}

                <FieldWrapper
                  id="vc-min"
                  label="Minimal subtotal belanja (Rp)"
                  required
                >
                  <RupiahInput
                    id="vc-min"
                    value={form.min_subtotal_idr}
                    onChange={(val) =>
                      setForm((prev) => ({ ...prev, min_subtotal_idr: val }))
                    }
                    required
                  />
                </FieldWrapper>

                <FieldWrapper
                  id="vc-cat"
                  label="Batasi kategori (opsional)"
                >
                  <ConsoleSelect
                    id="vc-cat"
                    value={form.category_id}
                    onChange={(v) =>
                      setForm((prev) => ({ ...prev, category_id: v }))
                    }
                    placeholder="Semua kategori"
                    options={[
                      { value: "", label: "Semua kategori" },
                      ...ITEM_CATEGORIES_SEED.filter((c) => !c.forbidden).map(
                        (c) => ({
                          value: String(c.id),
                          label: `${c.code} — ${c.nama}`,
                        }),
                      ),
                    ]}
                  />
                </FieldWrapper>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper id="vc-quota" label="Kuota total (kosongkan jika tak terbatas)">
                  <input
                    id="vc-quota"
                    type="number"
                    min={1}
                    className="brk-input brk-num"
                    value={form.quota_total}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, quota_total: e.target.value }))
                    }
                  />
                </FieldWrapper>

                <FieldWrapper id="vc-limit" label="Batas pemakaian per pembeli" required>
                  <input
                    id="vc-limit"
                    type="number"
                    min={1}
                    className="brk-input brk-num"
                    value={form.per_user_limit}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        per_user_limit: e.target.value,
                      }))
                    }
                    required
                  />
                </FieldWrapper>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper id="vc-start" label="Mulai berlaku (opsional)">
                  <input
                    id="vc-start"
                    type="datetime-local"
                    className="brk-input"
                    value={form.starts_at}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, starts_at: e.target.value }))
                    }
                  />
                </FieldWrapper>
                <FieldWrapper id="vc-end" label="Berakhir pada (opsional)">
                  <input
                    id="vc-end"
                    type="datetime-local"
                    className="brk-input"
                    value={form.ends_at}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, ends_at: e.target.value }))
                    }
                  />
                </FieldWrapper>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_public}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, is_public: e.target.checked }))
                    }
                    className="size-4"
                  />
                  <span>Tampilkan di daftar voucher publik</span>
                </label>

                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="size-4"
                  />
                  <span>Status aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="brk-btn brk-btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="brk-btn brk-btn-primary"
                  disabled={saveMut.isPending}
                >
                  {saveMut.isPending ? "Menyimpan..." : "Simpan voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Hapus voucher ${deleteTarget?.code || ""}`}
        description="Voucher yang dihapus tidak dapat digunakan lagi oleh pembeli di Storefront."
        confirmLabel="Hapus voucher"
        tone="danger"
        loading={deleteMut.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate()}
      />
    </div>
  );
}
