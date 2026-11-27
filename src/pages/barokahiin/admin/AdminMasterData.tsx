import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAdminCategory,
  createAdminShippingRate,
  createAdminSopCheck,
  deleteAdminCategory,
  deleteAdminPriceGuideline,
  deleteAdminShippingRate,
  deleteAdminSopCheck,
  getAdminCategories,
  getAdminPriceGuidelines,
  getAdminShippingRates,
  getAdminSopTemplates,
  parseBarokahiinError,
  updateAdminCategory,
  updateAdminShippingRate,
  updateAdminSopCheck,
  upsertAdminPriceGuideline,
  type AdminCategory,
  type AdminShippingRate,
  type AdminSopCheck,
  type ItemGrade,
  type ShippingZona,
  type SopCheckButuhBukti,
  type SopCheckOnFail,
  type SopCheckTipe,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ConsoleSelect,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  LoadingSkeleton,
  StatusBadge,
} from "../components/ui/ConsoleUi";
import { formatRupiah, unwrapList } from "../components/ui/utils";

type MasterTab = "categories" | "sop" | "prices" | "shipping";

const ZONA_LABELS: Record<string, string> = {
  dalam_kota: "Dalam Kota",
  jawa_barat: "Jawa Barat",
  luar_jawa_barat: "Luar Jawa Barat",
};

export default function AdminMasterData() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<MasterTab>("categories");

  // --- Categories state (kode, nama, aktif, terlarang, aturan.pickup_only, urutan) ---
  const [editCat, setEditCat] = useState<AdminCategory | null>(null);
  const [catKode, setCatKode] = useState("");
  const [catNama, setCatNama] = useState("");
  const [catAktif, setCatAktif] = useState(true);
  const [catTerlarang, setCatTerlarang] = useState(false);
  const [catPickupOnly, setCatPickupOnly] = useState(false);
  const [catUrutan, setCatUrutan] = useState("1");
  const [deleteCatTarget, setDeleteCatTarget] = useState<AdminCategory | null>(
    null,
  );

  // --- SOP state (kode, teks, tipe, wajib, butuh_bukti, on_fail, urutan) ---
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [editCheck, setEditCheck] = useState<AdminSopCheck | null>(null);
  const [chkKode, setChkKode] = useState("");
  const [chkTeks, setChkTeks] = useState("");
  const [chkTipe, setChkTipe] = useState<SopCheckTipe>("bool");
  const [chkWajib, setChkWajib] = useState(true);
  const [chkButuhBukti, setChkButuhBukti] =
    useState<SopCheckButuhBukti>("none");
  const [chkOnFail, setChkOnFail] = useState<SopCheckOnFail>("fix");
  const [chkUrutan, setChkUrutan] = useState("1");

  // --- Price Guidelines state (category_id: number | null, grade, min_pct, max_pct) ---
  const [pgCategoryId, setPgCategoryId] = useState(""); // "" => null (Global)
  const [pgGrade, setPgGrade] = useState<ItemGrade>("A");
  const [pgMinPct, setPgMinPct] = useState("55");
  const [pgMaxPct, setPgMaxPct] = useState("75");

  // --- Shipping Rates state (origin_region_id: null, zona, berat_min_g, berat_max_g, tarif_idr, aktif) ---
  const [editShip, setEditShip] = useState<AdminShippingRate | null>(null);
  const [shipZona, setShipZona] = useState<ShippingZona>("dalam_kota");
  const [shipBeratMin, setShipBeratMin] = useState("0");
  const [shipBeratMax, setShipBeratMax] = useState("1000");
  const [shipTarifIdr, setShipTarifIdr] = useState("10000");
  const [shipAktif, setShipAktif] = useState(true);

  // Queries
  const categoriesQuery = useQuery({
    queryKey: ["barokahiin", "admin", "categories"],
    queryFn: getAdminCategories,
  });

  const sopQuery = useQuery({
    queryKey: ["barokahiin", "admin", "sop-templates"],
    queryFn: getAdminSopTemplates,
    enabled: subTab === "sop",
  });

  const priceQuery = useQuery({
    queryKey: ["barokahiin", "admin", "price-guidelines"],
    queryFn: getAdminPriceGuidelines,
    enabled: subTab === "prices",
  });

  const shippingQuery = useQuery({
    queryKey: ["barokahiin", "admin", "shipping-rates"],
    queryFn: getAdminShippingRates,
    enabled: subTab === "shipping",
  });

  const { items: categories } = unwrapList(categoriesQuery.data);
  const { items: sopTemplates } = unwrapList(sopQuery.data);
  const { items: priceGuidelines } = unwrapList(priceQuery.data);
  const { items: shippingRates } = unwrapList(shippingQuery.data);

  // Mutations: Categories
  const saveCatMut = useMutation({
    mutationFn: () => {
      const payload = {
        kode: catKode.trim().toUpperCase(),
        nama: catNama.trim(),
        aktif: catAktif,
        terlarang: catTerlarang,
        aturan: { pickup_only: catPickupOnly },
        urutan: Number(catUrutan) || 1,
      };
      return editCat
        ? updateAdminCategory(editCat.uuid, payload)
        : createAdminCategory(payload);
    },
    onSuccess: () => {
      toast.success(
        editCat ? "Kategori berhasil diperbarui" : "Kategori baru ditambahkan",
      );
      setEditCat(null);
      setCatKode("");
      setCatNama("");
      setCatAktif(true);
      setCatTerlarang(false);
      setCatPickupOnly(false);
      setCatUrutan("1");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "categories"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const deleteCatMut = useMutation({
    mutationFn: (uuid: string) => deleteAdminCategory(uuid),
    onSuccess: () => {
      setDeleteCatTarget(null);
      toast.success("Kategori dihapus");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "categories"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  // Mutations: SOP Checks
  const saveCheckMut = useMutation({
    mutationFn: () => {
      const payload = {
        kode: chkKode.trim().toUpperCase(),
        teks: chkTeks.trim(),
        tipe: chkTipe,
        wajib: chkWajib,
        butuh_bukti: chkButuhBukti,
        on_fail: chkOnFail,
        urutan: Number(chkUrutan) || 1,
      };
      if (editCheck) {
        return updateAdminSopCheck(editCheck.id, payload);
      }
      const targetTpl =
        selectedTemplateId || (activeTemplate ? String(activeTemplate.id) : "");
      if (!targetTpl) {
        throw new Error("Pilih template SOP terlebih dahulu.");
      }
      return createAdminSopCheck(targetTpl, payload);
    },
    onSuccess: () => {
      toast.success(
        editCheck ? "Butir SOP diperbarui" : "Butir SOP baru ditambahkan",
      );
      setEditCheck(null);
      setChkKode("");
      setChkTeks("");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "sop-templates"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const deleteCheckMut = useMutation({
    mutationFn: (id: string | number) => deleteAdminSopCheck(id),
    onSuccess: () => {
      toast.success("Butir SOP dihapus");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "sop-templates"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  // Mutations: Price Guidelines (upsert by category_id + grade; null = global)
  const savePriceMut = useMutation({
    mutationFn: () =>
      upsertAdminPriceGuideline({
        category_id: pgCategoryId ? Number(pgCategoryId) : null,
        grade: pgGrade,
        min_pct: Number(pgMinPct) || 0,
        max_pct: Number(pgMaxPct) || 100,
      }),
    onSuccess: () => {
      toast.success("Panduan harga tersimpan");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "price-guidelines"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const deletePriceMut = useMutation({
    mutationFn: (id: string | number) => deleteAdminPriceGuideline(id),
    onSuccess: () => {
      toast.success("Panduan harga dihapus");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "price-guidelines"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  // Mutations: Shipping Rates
  const saveShipMut = useMutation({
    mutationFn: () => {
      const payload = {
        origin_region_id: null,
        zona: shipZona,
        berat_min_g: Number(shipBeratMin) || 0,
        berat_max_g: Number(shipBeratMax) || 1000,
        tarif_idr: Number(shipTarifIdr) || 0,
        aktif: shipAktif,
      };
      return editShip
        ? updateAdminShippingRate(editShip.id, payload)
        : createAdminShippingRate(payload);
    },
    onSuccess: () => {
      toast.success(
        editShip ? "Tarif ongkir diperbarui" : "Tarif ongkir ditambahkan",
      );
      setEditShip(null);
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "shipping-rates"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const deleteShipMut = useMutation({
    mutationFn: (id: string | number) => deleteAdminShippingRate(id),
    onSuccess: () => {
      toast.success("Tarif ongkir dihapus");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "shipping-rates"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const activeTemplate =
    sopTemplates.find((t) => String(t.id) === selectedTemplateId) ??
    sopTemplates[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`brk-btn ${subTab === "categories" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("categories")}
        >
          <Layers className="size-4" aria-hidden="true" />
          <span>Kategori</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "sop" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("sop")}
        >
          <ClipboardList className="size-4" aria-hidden="true" />
          <span>SOP Kurasi</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "prices" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("prices")}
        >
          <Tag className="size-4" aria-hidden="true" />
          <span>Panduan Harga</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "shipping" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("shipping")}
        >
          <Truck className="size-4" aria-hidden="true" />
          <span>Tabel Ongkir</span>
        </button>
      </div>

      {/* TAB 1: CATEGORIES */}
      {subTab === "categories" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <ConsolePanel
            className="lg:col-span-5"
            icon={Plus}
            title={editCat ? "Edit kategori" : "Tambah kategori barang"}
            description="Kategori dengan status terlarang (mis. MK / makanan) otomatis ditolak pada kurasi Fase 1."
          >
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!catKode.trim() || !catNama.trim()) {
                  toast.error("Kode dan nama kategori wajib diisi.");
                  return;
                }
                saveCatMut.mutate();
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <FieldWrapper id="cat-kode" label="Kode kategori" required>
                  <input
                    id="cat-kode"
                    className="brk-input uppercase"
                    value={catKode}
                    onChange={(e) => setCatKode(e.target.value)}
                    placeholder="Contoh: OL, EL, MK"
                    required
                  />
                </FieldWrapper>
                <FieldWrapper id="cat-urut" label="Urutan tampil">
                  <input
                    id="cat-urut"
                    type="number"
                    min={1}
                    className="brk-input brk-num"
                    value={catUrutan}
                    onChange={(e) => setCatUrutan(e.target.value)}
                  />
                </FieldWrapper>
              </div>
              <FieldWrapper id="cat-nama" label="Nama kategori" required>
                <input
                  id="cat-nama"
                  className="brk-input"
                  value={catNama}
                  onChange={(e) => setCatNama(e.target.value)}
                  placeholder="Contoh: Olahraga & Outdoor"
                  required
                />
              </FieldWrapper>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={catAktif}
                  onChange={(e) => setCatAktif(e.target.checked)}
                  className="size-4"
                />
                <span>Kategori aktif</span>
              </label>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={catTerlarang}
                  onChange={(e) => setCatTerlarang(e.target.checked)}
                  className="size-4"
                />
                <span>Kategori terlarang (blokir kurasi)</span>
              </label>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={catPickupOnly}
                  onChange={(e) => setCatPickupOnly(e.target.checked)}
                  className="size-4"
                />
                <span>Khusus ambil di toko (pickup only)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="brk-btn brk-btn-primary"
                  disabled={saveCatMut.isPending}
                >
                  {saveCatMut.isPending
                    ? "Menyimpan..."
                    : editCat
                      ? "Simpan perubahan"
                      : "Tambah kategori"}
                </button>
                {editCat && (
                  <button
                    type="button"
                    className="brk-btn brk-btn-secondary"
                    onClick={() => {
                      setEditCat(null);
                      setCatKode("");
                      setCatNama("");
                      setCatAktif(true);
                      setCatTerlarang(false);
                      setCatPickupOnly(false);
                      setCatUrutan("1");
                    }}
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </ConsolePanel>

          <ConsolePanel
            className="lg:col-span-7"
            icon={Layers}
            title="Daftar kategori"
            description="Master kategori yang tampil di formulir kurasi Koordinator dan filter Storefront."
          >
            {categoriesQuery.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : categoriesQuery.error ? (
              <ErrorBanner
                message={parseBarokahiinError(categoriesQuery.error).message}
                onRetry={() => void categoriesQuery.refetch()}
              />
            ) : categories.length === 0 ? (
              <EmptyState
                title="Belum ada kategori"
                description="Tambahkan kategori barang di formulir sebelah kiri."
              />
            ) : (
              <div className="space-y-2.5">
                {categories.map((c) => (
                  <div
                    key={c.uuid || c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3.5 text-sm"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="brk-num font-bold">{c.kode}</span>
                        <span className="font-semibold">{c.nama}</span>
                        {c.terlarang && <StatusBadge value="ditolak" />}
                        <StatusBadge
                          value={c.aktif === false ? "ditarik" : "aktif"}
                        />
                      </div>
                      <p
                        className="brk-num mt-0.5 text-xs"
                        style={{ color: "var(--muted-brk)" }}
                      >
                        Urutan: {c.urutan ?? "-"}
                        {c.aturan?.pickup_only ? " · Khusus ambil di toko" : ""}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="brk-btn brk-btn-secondary min-h-9 px-2.5 text-xs"
                        onClick={() => {
                          setEditCat(c);
                          setCatKode(c.kode);
                          setCatNama(c.nama);
                          setCatAktif(c.aktif !== false);
                          setCatTerlarang(Boolean(c.terlarang));
                          setCatPickupOnly(Boolean(c.aturan?.pickup_only));
                          setCatUrutan(String(c.urutan ?? 1));
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="brk-btn brk-btn-danger min-h-9 px-2.5 text-xs"
                        onClick={() => setDeleteCatTarget(c)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ConsolePanel>
        </div>
      )}

      {/* TAB 2: SOP CURATION TEMPLATES */}
      {subTab === "sop" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <ConsolePanel
            className="lg:col-span-5"
            icon={ClipboardList}
            title={editCheck ? "Edit butir SOP" : "Tambah butir SOP"}
            description="Tambahkan atau perbarui butir checklist SOP pada template kategori terpilih."
          >
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!chkKode.trim() || !chkTeks.trim()) {
                  toast.error("Kode dan teks butir SOP wajib diisi.");
                  return;
                }
                saveCheckMut.mutate();
              }}
            >
              {!editCheck && (
                <FieldWrapper id="sop-tpl" label="Template SOP" required>
                  <ConsoleSelect
                    id="sop-tpl"
                    value={
                      selectedTemplateId ||
                      (activeTemplate ? String(activeTemplate.id) : "")
                    }
                    onChange={setSelectedTemplateId}
                    placeholder="Pilih template SOP"
                    options={sopTemplates.map((t) => ({
                      value: String(t.id),
                      label:
                        t.nama ||
                        `${t.category_code || "UMUM"} — ${t.category_name || "Umum"} (v${t.versi ?? 1})`,
                    }))}
                  />
                </FieldWrapper>
              )}
              <div className="grid grid-cols-2 gap-3">
                <FieldWrapper id="chk-kode" label="Kode butir" required>
                  <input
                    id="chk-kode"
                    className="brk-input uppercase"
                    value={chkKode}
                    onChange={(e) => setChkKode(e.target.value)}
                    placeholder="Contoh: OL01"
                    required
                  />
                </FieldWrapper>
                <FieldWrapper id="chk-urut" label="Urutan">
                  <input
                    id="chk-urut"
                    type="number"
                    min={1}
                    className="brk-input brk-num"
                    value={chkUrutan}
                    onChange={(e) => setChkUrutan(e.target.value)}
                  />
                </FieldWrapper>
              </div>
              <FieldWrapper id="chk-teks" label="Teks checklist" required>
                <textarea
                  id="chk-teks"
                  className="brk-textarea"
                  value={chkTeks}
                  onChange={(e) => setChkTeks(e.target.value)}
                  placeholder="Contoh: Fungsi mekanis alat olahraga lulus uji"
                  required
                />
              </FieldWrapper>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FieldWrapper id="chk-tipe" label="Tipe input">
                  <ConsoleSelect
                    id="chk-tipe"
                    value={chkTipe}
                    onChange={(v) => setChkTipe(v as SopCheckTipe)}
                    options={[
                      { value: "bool", label: "Centang (bool)" },
                      { value: "text", label: "Teks (text)" },
                      { value: "number", label: "Angka (number)" },
                    ]}
                  />
                </FieldWrapper>
                <FieldWrapper id="chk-bukti" label="Butuh bukti">
                  <ConsoleSelect
                    id="chk-bukti"
                    value={chkButuhBukti}
                    onChange={(v) => setChkButuhBukti(v as SopCheckButuhBukti)}
                    options={[
                      { value: "none", label: "Tanpa bukti" },
                      { value: "foto", label: "Foto" },
                      { value: "video", label: "Video" },
                    ]}
                  />
                </FieldWrapper>
                <FieldWrapper id="chk-fail" label="Jika gagal">
                  <ConsoleSelect
                    id="chk-fail"
                    value={chkOnFail}
                    onChange={(v) => setChkOnFail(v as SopCheckOnFail)}
                    options={[
                      { value: "fix", label: "Perbaiki (fix)" },
                      { value: "reject", label: "Tolak (reject)" },
                    ]}
                  />
                </FieldWrapper>
              </div>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={chkWajib}
                  onChange={(e) => setChkWajib(e.target.checked)}
                  className="size-4"
                />
                <span>Butir wajib lulus sebelum pengajuan review</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="brk-btn brk-btn-primary"
                  disabled={saveCheckMut.isPending}
                >
                  {saveCheckMut.isPending
                    ? "Menyimpan..."
                    : editCheck
                      ? "Simpan butir SOP"
                      : "Tambah butir SOP"}
                </button>
                {editCheck && (
                  <button
                    type="button"
                    className="brk-btn brk-btn-secondary"
                    onClick={() => {
                      setEditCheck(null);
                      setChkKode("");
                      setChkTeks("");
                    }}
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </ConsolePanel>

          <ConsolePanel
            className="lg:col-span-7"
            icon={ClipboardList}
            title="Daftar template & butir SOP"
            description="Pilih template untuk melihat dan mengelola butir checklist SOP yang berlaku."
          >
            {sopQuery.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : sopQuery.error ? (
              <ErrorBanner
                message={parseBarokahiinError(sopQuery.error).message}
                onRetry={() => void sopQuery.refetch()}
              />
            ) : sopTemplates.length === 0 ? (
              <EmptyState
                title="Belum ada template SOP"
                description="Template SOP akan muncul di sini."
              />
            ) : (
              <div className="space-y-4">
                <ConsoleSelect
                  value={
                    selectedTemplateId ||
                    (activeTemplate ? String(activeTemplate.id) : "")
                  }
                  onChange={setSelectedTemplateId}
                  options={sopTemplates.map((t) => ({
                    value: String(t.id),
                    label:
                      t.nama ||
                      `${t.category_code || "UMUM"} — ${t.category_name || "Umum"} (${t.checks?.length ?? 0} butir)`,
                  }))}
                />

                {activeTemplate?.checks && activeTemplate.checks.length > 0 ? (
                  <div className="space-y-2">
                    {activeTemplate.checks.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex flex-col gap-2 rounded-xl border p-3 text-sm sm:flex-row sm:items-start sm:justify-between"
                        style={{ borderColor: "var(--garis)" }}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="brk-num font-bold">{ch.kode}</span>
                            <span
                              className="text-xs font-semibold uppercase"
                              style={{ color: "var(--indigo)" }}
                            >
                              {ch.tipe}
                            </span>
                            {ch.butuh_bukti && ch.butuh_bukti !== "none" && (
                              <span
                                className="text-xs font-semibold uppercase"
                                style={{ color: "var(--daun)" }}
                              >
                                Bukti: {ch.butuh_bukti}
                              </span>
                            )}
                            {ch.wajib && (
                              <span
                                className="text-xs font-semibold"
                                style={{ color: "var(--bahaya)" }}
                              >
                                Wajib
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm">{ch.teks}</p>
                          <p
                            className="mt-0.5 text-xs"
                            style={{ color: "var(--muted-brk)" }}
                          >
                            Jika gagal: {ch.on_fail} · Urutan: {ch.urutan ?? "-"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            type="button"
                            className="brk-btn brk-btn-secondary min-h-8 px-2.5 text-xs"
                            onClick={() => {
                              setEditCheck(ch);
                              setChkKode(ch.kode);
                              setChkTeks(ch.teks);
                              setChkTipe(
                                (ch.tipe as SopCheckTipe) || "bool",
                              );
                              setChkWajib(Boolean(ch.wajib));
                              setChkButuhBukti(
                                (ch.butuh_bukti as SopCheckButuhBukti) || "none",
                              );
                              setChkOnFail(
                                (ch.on_fail as SopCheckOnFail) || "fix",
                              );
                              setChkUrutan(String(ch.urutan ?? 1));
                            }}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="brk-btn brk-btn-danger min-h-8 px-2.5 text-xs"
                            disabled={deleteCheckMut.isPending}
                            onClick={() => deleteCheckMut.mutate(ch.id)}
                          >
                            {deleteCheckMut.isPending &&
                            deleteCheckMut.variables === ch.id ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Belum ada butir SOP"
                    description="Tambahkan butir checklist baru di formulir sebelah kiri."
                  />
                )}
              </div>
            )}
          </ConsolePanel>
        </div>
      )}

      {/* TAB 3: PRICE GUIDELINES (Kategori x Grade, null = Global) */}
      {subTab === "prices" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <ConsolePanel
            className="lg:col-span-5"
            icon={Tag}
            title="Atur panduan harga (Kategori × Grade)"
            description="Upsert rentang persentase panduan harga dari harga baru. Pilih Global (semua kategori) jika berlaku umum."
          >
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (Number(pgMinPct) > Number(pgMaxPct)) {
                  toast.error("Persentase minimum tidak boleh melebihi maksimum.");
                  return;
                }
                savePriceMut.mutate();
              }}
            >
              <FieldWrapper id="pg-cat" label="Kategori">
                <ConsoleSelect
                  id="pg-cat"
                  value={pgCategoryId}
                  onChange={setPgCategoryId}
                  placeholder="Global (semua kategori)"
                  options={[
                    { value: "", label: "Global (semua kategori)" },
                    ...categories.map((c) => ({
                      value: String(c.id),
                      label: `${c.kode} — ${c.nama}`,
                    })),
                  ]}
                />
              </FieldWrapper>
              <FieldWrapper id="pg-grade" label="Grade" required>
                <ConsoleSelect
                  id="pg-grade"
                  value={pgGrade}
                  onChange={(v) => setPgGrade(v as ItemGrade)}
                  options={[
                    { value: "A", label: "Grade A (Seperti baru)" },
                    { value: "B", label: "Grade B (Layak pakai baik)" },
                    { value: "C", label: "Grade C (Ada kekurangan terbuka)" },
                  ]}
                />
              </FieldWrapper>
              <div className="grid grid-cols-2 gap-3">
                <FieldWrapper id="pg-min-pct" label="Min % dari harga baru" required>
                  <input
                    id="pg-min-pct"
                    type="number"
                    min={0}
                    max={100}
                    className="brk-input brk-num"
                    value={pgMinPct}
                    onChange={(e) => setPgMinPct(e.target.value)}
                    required
                  />
                </FieldWrapper>
                <FieldWrapper id="pg-max-pct" label="Maks % dari harga baru" required>
                  <input
                    id="pg-max-pct"
                    type="number"
                    min={0}
                    max={100}
                    className="brk-input brk-num"
                    value={pgMaxPct}
                    onChange={(e) => setPgMaxPct(e.target.value)}
                    required
                  />
                </FieldWrapper>
              </div>
              <button
                type="submit"
                className="brk-btn brk-btn-primary w-full"
                disabled={savePriceMut.isPending}
              >
                {savePriceMut.isPending ? "Menyimpan..." : "Simpan panduan harga"}
              </button>
            </form>
          </ConsolePanel>

          <ConsolePanel
            className="lg:col-span-7"
            icon={Tag}
            title="Daftar panduan harga aktif"
            description="Acuan otomatis saat Koordinator menetapkan harga jual barang donasi."
          >
            {priceQuery.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : priceQuery.error ? (
              <ErrorBanner
                message={parseBarokahiinError(priceQuery.error).message}
                onRetry={() => void priceQuery.refetch()}
              />
            ) : priceGuidelines.length === 0 ? (
              <EmptyState
                title="Belum ada panduan harga"
                description="Tambahkan panduan harga berdasarkan kategori dan grade di sebelah kiri."
              />
            ) : (
              <div className="space-y-2.5">
                {priceGuidelines.map((pg) => (
                  <div
                    key={pg.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3.5 text-sm"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <div>
                      <p className="font-bold">
                        {pg.category_id === null
                          ? "Global (Semua Kategori)"
                          : pg.category_name || `Kategori #${pg.category_id}`}{" "}
                        — Grade {pg.grade}
                      </p>
                      <p
                        className="brk-num text-xs"
                        style={{ color: "var(--muted-brk)" }}
                      >
                        Rentang harga jual: {pg.min_pct}% – {pg.max_pct}% dari
                        harga baru
                      </p>
                    </div>
                    <button
                      type="button"
                      className="brk-btn brk-btn-danger min-h-8 px-2.5 text-xs"
                      disabled={deletePriceMut.isPending}
                      onClick={() => deletePriceMut.mutate(pg.id)}
                    >
                      {deletePriceMut.isPending &&
                      deletePriceMut.variables === pg.id ? (
                        <Loader2
                          className="size-3.5 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {deletePriceMut.isPending &&
                        deletePriceMut.variables === pg.id
                          ? "Menghapus..."
                          : "Hapus"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ConsolePanel>
        </div>
      )}

      {/* TAB 4: SHIPPING RATES (Zona x Berat) */}
      {subTab === "shipping" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <ConsolePanel
            className="lg:col-span-5"
            icon={Truck}
            title={editShip ? "Edit tarif ongkir" : "Tambah tarif ongkir"}
            description="Atur tarif pengiriman berdasarkan zona (dalam_kota, jawa_barat, luar_jawa_barat) dan rentang berat (gram)."
          >
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveShipMut.mutate();
              }}
            >
              <FieldWrapper id="sh-zona" label="Zona pengiriman" required>
                <ConsoleSelect
                  id="sh-zona"
                  value={shipZona}
                  onChange={(v) => setShipZona(v as ShippingZona)}
                  options={[
                    { value: "dalam_kota", label: "Dalam Kota (dalam_kota)" },
                    { value: "jawa_barat", label: "Jawa Barat (jawa_barat)" },
                    {
                      value: "luar_jawa_barat",
                      label: "Luar Jawa Barat (luar_jawa_barat)",
                    },
                  ]}
                />
              </FieldWrapper>
              <div className="grid grid-cols-2 gap-3">
                <FieldWrapper id="sh-minw" label="Berat min (gram)" required>
                  <input
                    id="sh-minw"
                    type="number"
                    min={0}
                    className="brk-input brk-num"
                    value={shipBeratMin}
                    onChange={(e) => setShipBeratMin(e.target.value)}
                    required
                  />
                </FieldWrapper>
                <FieldWrapper id="sh-maxw" label="Berat maks (gram)" required>
                  <input
                    id="sh-maxw"
                    type="number"
                    min={1}
                    className="brk-input brk-num"
                    value={shipBeratMax}
                    onChange={(e) => setShipBeratMax(e.target.value)}
                    required
                  />
                </FieldWrapper>
              </div>
              <FieldWrapper id="sh-tarif" label="Tarif ongkir (Rp)" required>
                <input
                  id="sh-tarif"
                  type="number"
                  step={500}
                  className="brk-input brk-num"
                  value={shipTarifIdr}
                  onChange={(e) => setShipTarifIdr(e.target.value)}
                  required
                />
              </FieldWrapper>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={shipAktif}
                  onChange={(e) => setShipAktif(e.target.checked)}
                  className="size-4"
                />
                <span>Tarif aktif</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="brk-btn brk-btn-primary"
                  disabled={saveShipMut.isPending}
                >
                  {saveShipMut.isPending
                    ? "Menyimpan..."
                    : editShip
                      ? "Simpan perubahan"
                      : "Tambah tarif"}
                </button>
                {editShip && (
                  <button
                    type="button"
                    className="brk-btn brk-btn-secondary"
                    onClick={() => setEditShip(null)}
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </ConsolePanel>

          <ConsolePanel
            className="lg:col-span-7"
            icon={Truck}
            title="Daftar tarif ongkir (Zona × Berat)"
            description="Digunakan untuk menghitung ongkir otomatis saat pembeli checkout."
          >
            {shippingQuery.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : shippingQuery.error ? (
              <ErrorBanner
                message={parseBarokahiinError(shippingQuery.error).message}
                onRetry={() => void shippingQuery.refetch()}
              />
            ) : shippingRates.length === 0 ? (
              <EmptyState
                title="Belum ada tarif ongkir"
                description="Tambahkan tarif ongkir per zona dan berat di formulir sebelah kiri."
              />
            ) : (
              <div className="space-y-2.5">
                {shippingRates.map((sr) => (
                  <div
                    key={sr.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3.5 text-sm"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">
                          {ZONA_LABELS[sr.zona] || sr.zona}
                        </span>
                        <span className="brk-num text-xs">
                          ({sr.berat_min_g}g – {sr.berat_max_g}g)
                        </span>
                        <StatusBadge
                          value={sr.aktif === false ? "ditarik" : "aktif"}
                        />
                      </div>
                      <p
                        className="brk-num mt-0.5 text-xs"
                        style={{ color: "var(--muted-brk)" }}
                      >
                        Tarif: <strong>{formatRupiah(sr.tarif_idr)}</strong>
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="brk-btn brk-btn-secondary min-h-8 px-2.5 text-xs"
                        onClick={() => {
                          setEditShip(sr);
                          setShipZona(
                            (sr.zona as ShippingZona) || "dalam_kota",
                          );
                          setShipBeratMin(String(sr.berat_min_g));
                          setShipBeratMax(String(sr.berat_max_g));
                          setShipTarifIdr(String(sr.tarif_idr));
                          setShipAktif(sr.aktif !== false);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="brk-btn brk-btn-danger min-h-8 px-2.5 text-xs"
                        disabled={deleteShipMut.isPending}
                        onClick={() => deleteShipMut.mutate(sr.id)}
                      >
                        {deleteShipMut.isPending &&
                        deleteShipMut.variables === sr.id ? (
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ConsolePanel>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteCatTarget)}
        title="Hapus kategori"
        description={`Yakin ingin menghapus kategori "${deleteCatTarget?.nama}" (${deleteCatTarget?.kode})?`}
        confirmLabel="Hapus kategori"
        tone="danger"
        loading={deleteCatMut.isPending}
        onCancel={() => setDeleteCatTarget(null)}
        onConfirm={() => {
          if (deleteCatTarget) deleteCatMut.mutate(deleteCatTarget.uuid);
        }}
      />
    </div>
  );
}
