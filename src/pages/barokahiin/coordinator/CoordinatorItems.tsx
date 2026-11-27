import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { useReactToPrint } from "react-to-print";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  Loader2,
  Package,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EMPTY_WILAYAH,
  addConsoleDonorConsent,
  createConsoleDonor,
  createConsoleItem,
  getConsoleDonors,
  getConsoleItem,
  getConsoleItemSop,
  getConsoleItems,
  getConsoleOrder,
  getConsoleOrders,
  getConsoleStore,
  parseBarokahiinError,
  republishConsoleItem,
  submitConsoleItem,
  updateConsoleItem,
  updateConsoleItemSopCheck,
  withdrawConsoleItem,
  type ConsoleItem,
  type ItemGrade,
  type ItemJalur,
  type SopCheckItem,
  type WilayahValue,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ConsoleSelect,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  GradeBadge,
  InfoBanner,
  LoadingSkeleton,
  OrganisasiSelect,
  Pager,
  RupiahInput,
  StatusBadge,
  WilayahCascader,
  type OrganisasiValue,
} from "../components/ui/ConsoleUi";
import { MediaUploadQueue } from "../components/ui/MediaUploadQueue";
import {
  GRADE_GUIDELINES,
  ITEM_CATEGORIES_SEED,
  PHOTO_ANGLE_GUIDES,
  detectForbiddenKeywords,
  formatDateId,
  formatRupiah,
  unwrapList,
} from "../components/ui/utils";

const DRAFT_STORAGE_KEY = "barokahiin_console_item_draft_v05";

interface ItemDraftForm {
  donor_uuid: string;
  category_id: string;
  jalur: ItemJalur;
  charity_program_id: string;
  grade: ItemGrade;
  judul: string;
  keterangan: string;
  kekurangan: string;
  noDefectConfirmed: boolean;
  weight_g: string;
  dim_l_cm: string;
  dim_w_cm: string;
  dim_h_cm: string;
  ref_new_price_idr: string;
  price_idr: string;
  lokasi_penyimpanan: string;
  serial_imei: string;
}

const emptyDraft: ItemDraftForm = {
  donor_uuid: "",
  category_id: "1",
  jalur: "jual",
  charity_program_id: "",
  grade: "B",
  judul: "",
  keterangan: "",
  kekurangan: "",
  noDefectConfirmed: false,
  weight_g: "500",
  dim_l_cm: "30",
  dim_w_cm: "20",
  dim_h_cm: "10",
  ref_new_price_idr: "200000",
  price_idr: "85000",
  lokasi_penyimpanan: "",
  serial_imei: "",
};

export default function CoordinatorItems({
  onGoToStore,
}: {
  onGoToStore: () => void;
}) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [jalurFilter, setJalurFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Active editor state
  const [editorMode, setEditorMode] = useState<"list" | "form">("list");
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [editingItem, setEditingItem] = useState<ConsoleItem | null>(null);
  const [form, setForm] = useState<ItemDraftForm>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      return saved ? { ...emptyDraft, ...JSON.parse(saved) } : emptyDraft;
    } catch {
      return emptyDraft;
    }
  });
  const [versionConflict, setVersionConflict] = useState(false);

  // Quick-add donor inline state (frontend-spec.md 8.3 step 1)
  const [quickDonorOpen, setQuickDonorOpen] = useState(false);
  const [qdNama, setQdNama] = useState("");
  const [qdKontak, setQdKontak] = useState("");
  const [qdWilayah, setQdWilayah] = useState<WilayahValue>(EMPTY_WILAYAH);
  const [quickConsentRef, setQuickConsentRef] = useState("");

  // Optional item wilayah & organisasi override (BAROKAHIIN_WILAYAH_FLOW.md 4.E.2)
  const [itemWilayah, setItemWilayah] = useState<WilayahValue>(EMPTY_WILAYAH);
  const [itemOrg, setItemOrg] = useState<OrganisasiValue>({
    daerah_id: "",
    desa_id: "",
    kelompok_id: "",
  });

  // SOP per-item disclosure & filter state
  const [onlyPendingSop, setOnlyPendingSop] = useState(false);
  const [disclosureByCode, setDisclosureByCode] = useState<Record<string, string>>({});

  // Detail modal state
  const [detailItem, setDetailItem] = useState<ConsoleItem | null>(null);

  // Print QR label modal (thermal 58mm / 80mm)
  const [labelItem, setLabelItem] = useState<ConsoleItem | null>(null);
  const [thermalWidth, setThermalWidth] = useState<"58mm" | "80mm">("58mm");
  const thermalLabelRef = useRef<HTMLDivElement>(null);
  const handlePrintThermal = useReactToPrint({
    contentRef: thermalLabelRef,
    documentTitle: labelItem
      ? `Label-${labelItem.kode_barang}`
      : "Label-Barokahiin",
    pageStyle: `
      @page {
        size: ${thermalWidth} auto;
        margin: 2mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact;
        }
      }
    `,
  });
  // Withdraw dialog
  const [withdrawTarget, setWithdrawTarget] = useState<ConsoleItem | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");

  // Auto-save draft locally when creating a new item
  useEffect(() => {
    if (editorMode === "form" && !editingItem) {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      } catch {
        // ignore storage quota
      }
    }
  }, [form, editorMode, editingItem]);

  const storeQuery = useQuery({
    queryKey: ["barokahiin", "console", "store"],
    queryFn: getConsoleStore,
  });

  const donorsQuery = useQuery({
    queryKey: ["barokahiin", "console", "donors", "select"],
    queryFn: () => getConsoleDonors({ per_page: 100 }),
  });

  const itemsQuery = useQuery({
    queryKey: [
      "barokahiin",
      "console",
      "items",
      statusFilter,
      categoryFilter,
      jalurFilter,
      gradeFilter,
      search,
      page,
    ],
    queryFn: () =>
      getConsoleItems({
        status: statusFilter,
        category_id: categoryFilter || undefined,
        jalur: jalurFilter || undefined,
        grade: gradeFilter || undefined,
        q: search,
        page,
        per_page: 12,
      }),
  });

  const sopQuery = useQuery({
    queryKey: ["barokahiin", "console", "item-sop", editingItem?.uuid],
    queryFn: () => getConsoleItemSop(editingItem!.uuid),
    enabled: Boolean(editingItem?.uuid && editorMode === "form"),
  });

  const detailQuery = useQuery({
    queryKey: ["barokahiin", "console", "item-detail", detailItem?.uuid],
    queryFn: () => getConsoleItem(detailItem!.uuid),
    enabled: Boolean(detailItem?.uuid),
  });

  // Fallback lookup: if a sold item doesn't embed `review`, find its order and check its review
  const soldOrdersQuery = useQuery({
    queryKey: ["barokahiin", "console", "orders", "for-item-rating"],
    queryFn: () => getConsoleOrders({ per_page: 50 }),
    enabled: Boolean(detailItem && detailItem.status === "terjual"),
    staleTime: 1000 * 60 * 2,
  });

  const matchedOrderForDetail = useMemo(() => {
    if (!detailItem || detailItem.status !== "terjual") return null;
    const { items: orderList } = unwrapList(soldOrdersQuery.data);
    return (
      orderList.find((ord) =>
        ord.items?.some(
          (oi) =>
            oi.uuid === detailItem.uuid ||
            oi.kode_barang === detailItem.kode_barang,
        ),
      ) ?? null
    );
  }, [detailItem, soldOrdersQuery.data]);

  const matchedOrderDetailQuery = useQuery({
    queryKey: [
      "barokahiin",
      "console",
      "order-detail",
      matchedOrderForDetail?.uuid,
    ],
    queryFn: () => getConsoleOrder(matchedOrderForDetail!.uuid),
    enabled: Boolean(
      matchedOrderForDetail?.uuid && !matchedOrderForDetail?.review,
    ),
  });

  useEffect(() => {
    if (!detailItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailItem]);

  const isEditableStatus = (status?: string) =>
    status === "draft" ||
    status === "perlu_revisi" ||
    status === "terbit" ||
    status === "ditarik";

  const storeVerified =
    storeQuery.data?.address_verified ||
    storeQuery.data?.active_address?.status === "terverifikasi" ||
    storeQuery.data?.status === "aktif";

  const selectedCategory = useMemo(
    () =>
      ITEM_CATEGORIES_SEED.find(
        (c) => String(c.id) === String(form.category_id),
      ),
    [form.category_id],
  );

  const forbiddenMatches = useMemo(
    () => detectForbiddenKeywords(`${form.judul} ${form.keterangan}`),
    [form.judul, form.keterangan],
  );

  const guidelineRange = useMemo(() => {
    const ref = Number(form.ref_new_price_idr) || 0;
    const rule = GRADE_GUIDELINES[form.grade];
    return {
      min: Math.round((ref * rule.minPct) / 500) * 500,
      max: Math.round((ref * rule.maxPct) / 500) * 500,
    };
  }, [form.ref_new_price_idr, form.grade]);

  const priceNum = Number(form.price_idr) || 0;
  const priceBelowMin = priceNum > 0 && priceNum < 15000;
  const priceNotMultiple500 = priceNum > 0 && priceNum % 500 !== 0;
  const priceOutsideGuideline =
    guidelineRange.max > 0 &&
    (priceNum < guidelineRange.min || priceNum > guidelineRange.max);

  const isPickupOnlyBySize =
    Number(form.weight_g) > 20000 ||
    Math.max(
      Number(form.dim_l_cm) || 0,
      Number(form.dim_w_cm) || 0,
      Number(form.dim_h_cm) || 0,
    ) > 100 ||
    selectedCategory?.code === "TN";

  const saveDraftMut = useMutation({
    mutationFn: async () => {
      if (selectedCategory?.forbidden) {
        throw new Error(
          "Kategori makanan dan minuman dilarang pada Fase 1 (FORBIDDEN_CATEGORY).",
        );
      }
      const payload = {
        donor_uuid: form.donor_uuid,
        category_id: Number(form.category_id) || form.category_id,
        jalur: form.jalur,
        charity_program_id:
          form.jalur === "charity" && form.charity_program_id
            ? Number(form.charity_program_id) || form.charity_program_id
            : null,
        province_code: itemWilayah.province_code || undefined,
        regency_code: itemWilayah.regency_code || undefined,
        district_code: itemWilayah.district_code || undefined,
        village_code: itemWilayah.village_code || undefined,
        daerah_id: itemOrg.daerah_id ? Number(itemOrg.daerah_id) || itemOrg.daerah_id : undefined,
        desa_id: itemOrg.desa_id ? Number(itemOrg.desa_id) || itemOrg.desa_id : undefined,
        kelompok_id: itemOrg.kelompok_id ? Number(itemOrg.kelompok_id) || itemOrg.kelompok_id : undefined,
        grade: form.grade,
        judul: form.judul.trim(),
        keterangan: form.keterangan.trim(),
        kekurangan: form.noDefectConfirmed
          ? "Tidak ada kekurangan berarti"
          : form.kekurangan.trim(),
        weight_g: Number(form.weight_g) || 0,
        dim_l_cm: Number(form.dim_l_cm) || 0,
        dim_w_cm: Number(form.dim_w_cm) || 0,
        dim_h_cm: Number(form.dim_h_cm) || 0,
        ref_new_price_idr: Number(form.ref_new_price_idr) || 0,
        price_idr: Number(form.price_idr) || 0,
        lokasi_penyimpanan: form.lokasi_penyimpanan.trim(),
        serial_imei: form.serial_imei.trim() || undefined,
      };

      if (editingItem) {
        return updateConsoleItem(editingItem.uuid, {
          ...payload,
          version: editingItem.version ?? 1,
        });
      }
      return createConsoleItem(payload);
    },
    onSuccess: (saved) => {
      setVersionConflict(false);
      setEditingItem(saved);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      toast.success("Draf barang tersimpan");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "items"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "item-sop", saved.uuid],
      });
    },
    onError: (err) => {
      const parsed = parseBarokahiinError(err);
      if (parsed.code === "VERSION_CONFLICT" || parsed.status === 409) {
        setVersionConflict(true);
      }
      toast.error(parsed.message);
    },
  });

  const updateSopMut = useMutation({
    mutationFn: ({
      checkCode,
      nilai,
      mediaId,
      teks,
    }: {
      checkCode: string;
      nilai: boolean | string | number;
      mediaId?: number | string | null;
      teks?: string | null;
    }) =>
      updateConsoleItemSopCheck(editingItem!.uuid, checkCode, {
        nilai,
        media_id: mediaId ?? null,
        teks_keterbukaan: teks ?? null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "item-sop", editingItem?.uuid],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const submitReviewMut = useMutation({
    mutationFn: () => submitConsoleItem(editingItem!.uuid),
    onSuccess: () => {
      toast.success("Diajukan untuk review");
      setEditorMode("list");
      setEditingItem(null);
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const withdrawMut = useMutation({
    mutationFn: () =>
      withdrawConsoleItem(withdrawTarget!.uuid, withdrawReason.trim() || undefined),
    onSuccess: () => {
      setWithdrawTarget(null);
      setWithdrawReason("");
      toast.success("Barang ditarik dari storefront");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "items"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const republishMut = useMutation({
    mutationFn: (uuid: string) => republishConsoleItem(uuid),
    onSuccess: () => {
      toast.success("Barang diterbitkan ulang");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "items"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const quickDonorMut = useMutation({
    mutationFn: () =>
      createConsoleDonor({
        province_code: qdWilayah.province_code || undefined,
        regency_code: qdWilayah.regency_code || undefined,
        district_code: qdWilayah.district_code || undefined,
        village_code: qdWilayah.village_code,
        nama: qdNama.trim(),
        kontak: qdKontak.trim(),
        anonim: true,
      }),
    onSuccess: (created) => {
      setQuickDonorOpen(false);
      setQdNama("");
      setQdKontak("");
      if (created?.uuid) {
        setForm((prev) => ({ ...prev, donor_uuid: created.uuid }));
      }
      toast.success("Donatur cepat tersimpan dan langsung dipilih");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "donors"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const quickConsentMut = useMutation({
    mutationFn: async (donorUuid: string) => {
      const ref = quickConsentRef.trim() || "Persetujuan langsung saat serah terima";
      await addConsoleDonorConsent(donorUuid, { jenis: "jual", bukti_ref: ref });
      await addConsoleDonorConsent(donorUuid, {
        jenis: "publikasi_media",
        bukti_ref: ref,
      });
    },
    onSuccess: () => {
      setQuickConsentRef("");
      toast.success("Persetujuan jual dan publikasi media dicatat");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "donors"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const openNewItem = () => {
    setEditingItem(null);
    setVersionConflict(false);
    setActiveStep(1);
    setEditorMode("form");
  };

  const openEditItem = (item: ConsoleItem) => {
    setEditingItem(item);
    setVersionConflict(false);
    setForm({
      donor_uuid: item.donor_uuid || item.donor?.uuid || "",
      category_id: String(item.category_id ?? "1"),
      jalur: item.jalur ?? "jual",
      charity_program_id: item.charity_program_id
        ? String(item.charity_program_id)
        : "",
      grade: item.grade ?? "B",
      judul: item.judul ?? "",
      keterangan: item.keterangan ?? "",
      kekurangan: item.kekurangan ?? "",
      noDefectConfirmed: false,
      weight_g: String(item.weight_g ?? 500),
      dim_l_cm: String(item.dim_l_cm ?? 30),
      dim_w_cm: String(item.dim_w_cm ?? 20),
      dim_h_cm: String(item.dim_h_cm ?? 10),
      ref_new_price_idr: String(item.ref_new_price_idr ?? 0),
      price_idr: String(item.price_idr ?? 0),
      lokasi_penyimpanan: item.lokasi_penyimpanan ?? "",
      serial_imei: item.serial_imei ?? "",
    });
    setActiveStep(1);
    setEditorMode("form");
  };

  const { items, pagination } = unwrapList(itemsQuery.data);
  const { items: donors } = unwrapList(donorsQuery.data);
  const selectedDonor = donors.find((d) => d.uuid === form.donor_uuid);
  const selectedDonorConsentsOk = Boolean(
    selectedDonor &&
      (selectedDonor.has_jual_consent ||
        selectedDonor.consents?.some((c) => c.jenis === "jual")) &&
      (selectedDonor.has_media_consent ||
        selectedDonor.consents?.some((c) => c.jenis === "publikasi_media")),
  );

  if (editorMode === "form") {
    const sopChecks: SopCheckItem[] = sopQuery.data?.checks ?? [];
    const gateErrors = sopQuery.data?.gate_errors ?? [];
    const passedCount =
      sopQuery.data?.passed_count ??
      sopChecks.filter((c) => c.lulus || c.nilai === true).length;

    const canSubmitReview =
      Boolean(editingItem?.uuid) &&
      storeVerified &&
      gateErrors.length === 0 &&
      !selectedCategory?.forbidden &&
      !priceBelowMin;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              {editingItem
                ? `Kurasi barang ${editingItem.kode_barang}`
                : "Tambah barang kurasi baru"}
            </h2>
            <p className="text-sm" style={{ color: "var(--muted-brk)" }}>
              Draf tersimpan otomatis di perangkat agar data tidak hilang saat koneksi terputus.
            </p>
          </div>
          <button
            type="button"
            className="brk-btn brk-btn-secondary"
            onClick={() => setEditorMode("list")}
          >
            Kembali ke daftar
          </button>
        </div>

        {!storeVerified && (
          <InfoBanner
            tone="warning"
            title="Alamat toko belum terverifikasi"
            message="Anda tetap dapat menyimpan draf dan mengisi SOP, tetapi tombol Ajukan review nonaktif sampai alamat toko diverifikasi Admin."
            action={
              <button
                type="button"
                className="brk-btn brk-btn-primary"
                onClick={onGoToStore}
              >
                Verifikasi toko
              </button>
            }
          />
        )}

        {editingItem?.status === "terbit" && (
          <InfoBanner
            tone="info"
            title="Mengubah barang yang sudah terbit (ITM-09)"
            message="Perubahan harga dalam batas konfigurasi langsung berlaku tanpa review. Perubahan keterangan atau foto signifikan akan mengembalikan barang ke antrean review Admin."
          />
        )}

        {versionConflict && (
          <InfoBanner
            tone="danger"
            title="Konflik perubahan bersamaan (409)"
            message="Barang ini baru saja diubah di sesi lain. Muat ulang daftar untuk mengambil versi terbaru tanpa menimpa data."
            action={
              <button
                type="button"
                className="brk-btn brk-btn-secondary"
                onClick={() => {
                  setVersionConflict(false);
                  void itemsQuery.refetch();
                }}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                <span>Muat ulang</span>
              </button>
            }
          />
        )}

        {/* Stepper (real sequence: 1..4) */}
        <nav
          aria-label="Tahapan kurasi barang"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {[
            { step: 1 as const, label: "1. Donatur dan kategori" },
            { step: 2 as const, label: "2. Data publik dan harga" },
            { step: 3 as const, label: "3. SOP dan kamera" },
            { step: 4 as const, label: "4. Pratinjau dan ajukan" },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step)}
              className="brk-btn text-left text-sm"
              style={{
                backgroundColor:
                  activeStep === s.step ? "var(--indigo-btn)" : "var(--putih)",
                color:
                  activeStep === s.step ? "#ffffff" : "var(--tinta)",
                borderColor:
                  activeStep === s.step ? "var(--indigo-btn)" : "var(--garis)",
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {activeStep === 1 && (
          <ConsolePanel
            icon={Package}
            title="Langkah 1: Pilih donatur, kategori, dan jalur"
            description="Pastikan donatur sudah memiliki persetujuan jual dan publikasi media."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldWrapper id="itm-donor" label="Donatur" required>
                  <ConsoleSelect
                    id="itm-donor"
                    value={form.donor_uuid}
                    onChange={(v) =>
                      setForm((prev) => ({ ...prev, donor_uuid: v }))
                    }
                    placeholder="Pilih donatur wilayah"
                    options={[
                      { value: "", label: "Pilih donatur wilayah" },
                      ...donors.map((d) => ({ value: d.uuid, label: d.nama })),
                    ]}
                  />
                </FieldWrapper>
                <button
                  type="button"
                  className="brk-btn brk-btn-ghost min-h-9 px-2 text-xs"
                  onClick={() => setQuickDonorOpen((prev) => !prev)}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>
                    {quickDonorOpen ? "Tutup tambah cepat" : "Tambah donatur cepat"}
                  </span>
                </button>
              </div>

              <FieldWrapper id="itm-cat" label="Kategori barang" required>
                <ConsoleSelect
                  id="itm-cat"
                  value={form.category_id}
                  onChange={(v) =>
                    setForm((prev) => ({ ...prev, category_id: v }))
                  }
                  options={ITEM_CATEGORIES_SEED.map((c) => ({
                    value: String(c.id),
                    label: `${c.code} — ${c.nama}`,
                  }))}
                />
              </FieldWrapper>

              <FieldWrapper
                id="itm-jalur"
                label="Jalur barang"
                required
                helper="Barang Charity maksimal 20% dari barang aktif toko (95% ke program, 5% Dana Jaminan)."
              >
                <ConsoleSelect
                  id="itm-jalur"
                  value={form.jalur}
                  onChange={(v) =>
                    setForm((prev) => ({ ...prev, jalur: v as ItemJalur }))
                  }
                  options={[
                    { value: "jual", label: "Jual reguler (bagi hasil 40/30/25/5)" },
                    {
                      value: "charity",
                      label: "Barang Charity (95% program / 5% jaminan)",
                    },
                    { value: "salurkan", label: "Salurkan langsung (in-kind)" },
                  ]}
                />
              </FieldWrapper>

              {form.jalur === "charity" && (
                <FieldWrapper
                  id="itm-prog"
                  label="ID Program Charity tujuan"
                  required
                  helper="Masukkan ID program Charity yang sudah disetujui Admin."
                >
                  <input
                    id="itm-prog"
                    className="brk-input brk-num"
                    value={form.charity_program_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        charity_program_id: e.target.value,
                      }))
                    }
                    placeholder="Contoh: 1"
                  />
                </FieldWrapper>
              )}
            </div>

            {quickDonorOpen && (
              <div
                className="mt-4 space-y-3 rounded-xl border p-4"
                style={{
                  backgroundColor: "var(--kertas)",
                  borderColor: "var(--indigo)",
                }}
              >
                <p className="text-sm font-bold">Tambah donatur cepat</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FieldWrapper id="qd-nama" label="Nama donatur" required>
                    <input
                      id="qd-nama"
                      className="brk-input"
                      value={qdNama}
                      onChange={(e) => setQdNama(e.target.value)}
                    />
                  </FieldWrapper>
                  <FieldWrapper id="qd-kontak" label="Nomor HP" required>
                    <input
                      id="qd-kontak"
                      className="brk-input brk-num"
                      inputMode="tel"
                      value={qdKontak}
                      onChange={(e) => setQdKontak(e.target.value)}
                      placeholder="0812..."
                    />
                  </FieldWrapper>
                </div>
                <FieldWrapper label="Wilayah donatur (sampai Kelurahan/Desa)" required>
                  <WilayahCascader
                    value={qdWilayah}
                    onChange={setQdWilayah}
                    maxLevel="village"
                  />
                </FieldWrapper>
                <button
                  type="button"
                  className="brk-btn brk-btn-primary"
                  disabled={
                    quickDonorMut.isPending ||
                    !qdNama.trim() ||
                    !qdKontak.trim() ||
                    !qdWilayah.village_code
                  }
                  onClick={() => quickDonorMut.mutate()}
                >
                  {quickDonorMut.isPending ? "Menyimpan..." : "Simpan dan pilih donatur"}
                </button>
              </div>
            )}

            {selectedDonor && !selectedDonorConsentsOk && (
              <div
                className="mt-4 space-y-3 rounded-xl border p-4"
                style={{
                  backgroundColor: "var(--kunyit-muda)",
                  borderColor: "var(--kunyit)",
                }}
              >
                <p className="text-sm font-bold" style={{ color: "var(--peringatan-teks)" }}>
                  Persetujuan donatur ({selectedDonor.nama}) belum lengkap
                </p>
                <p className="text-xs" style={{ color: "var(--peringatan-teks)" }}>
                  Barang tidak bisa diajukan review tanpa persetujuan jual dan publikasi media (U01). Catat keduanya langsung di sini:
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    aria-label="Referensi bukti persetujuan"
                    className="brk-input flex-1"
                    placeholder="Bukti persetujuan (mis. WhatsApp / Formulir #12)"
                    value={quickConsentRef}
                    onChange={(e) => setQuickConsentRef(e.target.value)}
                  />
                  <button
                    type="button"
                    className="brk-btn brk-btn-daun shrink-0"
                    disabled={quickConsentMut.isPending}
                    onClick={() => quickConsentMut.mutate(selectedDonor.uuid)}
                  >
                    {quickConsentMut.isPending
                      ? "Mencatat..."
                      : "Catat persetujuan jual dan media"}
                  </button>
                </div>
              </div>
            )}

            {/* Optional wilayah & organisasi tagging for catalog filters */}
            <div
              className="mt-4 space-y-3 rounded-xl border p-4"
              style={{ borderColor: "var(--garis)" }}
            >
              <div>
                <p className="text-sm font-bold">
                  Wilayah barang dan organisasi (opsional)
                </p>
                <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                  Jika wilayah administratif dikosongkan, otomatis mengikuti wilayah donatur. Isi daerah/desa/kelompok agar barang tampil pada filter organisasi.
                </p>
              </div>
              <WilayahCascader
                value={itemWilayah}
                onChange={setItemWilayah}
                maxLevel="village"
              />
              <OrganisasiSelect value={itemOrg} onChange={setItemOrg} />
            </div>

            {selectedCategory?.forbidden && (
              <div className="mt-4">
                <ErrorBanner message="Kategori makanan dan minuman (MK) diblokir pada Fase 1 sesuai aturan PRD." />
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="brk-btn brk-btn-primary"
                disabled={selectedCategory?.forbidden}
                onClick={() => setActiveStep(2)}
              >
                Lanjut ke data publik
              </button>
            </div>
          </ConsolePanel>
        )}

        {activeStep === 2 && (
          <ConsolePanel
            icon={ClipboardCheck}
            title="Langkah 2: Data publik, kondisi, ukuran, dan harga"
            description="Tulis kekurangan secara jujur. Harga minimum Rp 15.000 dengan kelipatan Rp 500."
          >
            {forbiddenMatches.length > 0 && (
              <div className="mb-4">
                <InfoBanner
                  tone="danger"
                  title="Peringatan kata kunci barang terlarang"
                  message={`Ditemukan kata yang perlu diperiksa: ${forbiddenMatches.join(", ")}. Pastikan barang bukan kategori terlarang Fase 1.`}
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper id="itm-judul" label="Judul publik" required>
                  <input
                    id="itm-judul"
                    className="brk-input"
                    value={form.judul}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, judul: e.target.value }))
                    }
                    placeholder="Contoh: Kemeja batik anak lengan panjang ukuran M"
                  />
                </FieldWrapper>

                <FieldWrapper id="itm-grade" label="Grade kondisi baku" required>
                  <ConsoleSelect
                    id="itm-grade"
                    value={form.grade}
                    onChange={(v) =>
                      setForm((prev) => ({ ...prev, grade: v as ItemGrade }))
                    }
                    options={[
                      {
                        value: "A",
                        label: "Grade A, sangat baik (50-70% harga baru)",
                      },
                      {
                        value: "B",
                        label: "Grade B, baik (35-55% harga baru)",
                      },
                      {
                        value: "C",
                        label: "Grade C, cukup (20-40% harga baru)",
                      },
                    ]}
                  />
                </FieldWrapper>
              </div>

              <FieldWrapper
                id="itm-ket"
                label="Keterangan barang"
                required
                helper="Hindari klaim tak berbukti seperti '100% original'."
              >
                <textarea
                  id="itm-ket"
                  className="brk-textarea"
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      keterangan: e.target.value,
                    }))
                  }
                />
              </FieldWrapper>

              <FieldWrapper
                id="itm-kekurangan"
                label="Kekurangan barang (wajib jujur)"
                required
              >
                <label className="mb-2 flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.noDefectConfirmed}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        noDefectConfirmed: e.target.checked,
                      }))
                    }
                    className="size-4"
                  />
                  <span>Tidak ada kekurangan berarti (dinyatakan eksplisit)</span>
                </label>
                {!form.noDefectConfirmed && (
                  <textarea
                    id="itm-kekurangan"
                    className="brk-textarea"
                    value={form.kekurangan}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        kekurangan: e.target.value,
                      }))
                    }
                    placeholder="Jelaskan semua goresan, noda, atau bagian yang aus."
                  />
                )}
              </FieldWrapper>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <FieldWrapper id="itm-berat" label="Berat (gram)" required>
                  <input
                    id="itm-berat"
                    type="number"
                    className="brk-input brk-num"
                    value={form.weight_g}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, weight_g: e.target.value }))
                    }
                  />
                </FieldWrapper>
                <FieldWrapper id="itm-p" label="Panjang (cm)" required>
                  <input
                    id="itm-p"
                    type="number"
                    className="brk-input brk-num"
                    value={form.dim_l_cm}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dim_l_cm: e.target.value }))
                    }
                  />
                </FieldWrapper>
                <FieldWrapper id="itm-l" label="Lebar (cm)" required>
                  <input
                    id="itm-l"
                    type="number"
                    className="brk-input brk-num"
                    value={form.dim_w_cm}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dim_w_cm: e.target.value }))
                    }
                  />
                </FieldWrapper>
                <FieldWrapper id="itm-t" label="Tinggi (cm)" required>
                  <input
                    id="itm-t"
                    type="number"
                    className="brk-input brk-num"
                    value={form.dim_h_cm}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dim_h_cm: e.target.value }))
                    }
                  />
                </FieldWrapper>
              </div>

              {isPickupOnlyBySize && (
                <InfoBanner
                  tone="info"
                  title="Otomatis bertanda Ambil di tempat saja"
                  message="Berat lebih dari 20 kg, sisi lebih dari 100 cm, atau kategori tanaman hanya mendukung metode Ambil di toko."
                />
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  id="itm-ref-price"
                  label="Harga referensi baru (Rp)"
                  required
                >
                  <RupiahInput
                    id="itm-ref-price"
                    value={form.ref_new_price_idr}
                    onChange={(val) =>
                      setForm((prev) => ({ ...prev, ref_new_price_idr: val }))
                    }
                    required
                  />
                </FieldWrapper>

                <FieldWrapper
                  id="itm-price"
                  label="Harga usulan (Rp)"
                  required
                  helper={`Rentang pedoman Grade ${form.grade}: ${formatRupiah(guidelineRange.min)} sampai ${formatRupiah(guidelineRange.max)}`}
                  error={
                    priceBelowMin
                      ? "Harga minimum adalah Rp 15.000. Di bawah itu, gabung paket atau jadikan Barang Charity."
                      : priceNotMultiple500
                        ? "Harga harus kelipatan Rp 500."
                        : null
                  }
                >
                  <RupiahInput
                    id="itm-price"
                    value={form.price_idr}
                    onChange={(val) =>
                      setForm((prev) => ({ ...prev, price_idr: val }))
                    }
                    required
                  />
                </FieldWrapper>
              </div>

              {priceOutsideGuideline && !priceBelowMin && (
                <InfoBanner
                  tone="warning"
                  title="Harga usulan di luar pedoman"
                  message="Harga di luar rentang pedoman memerlukan persetujuan khusus dari Admin Reviewer."
                />
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  id="itm-loc"
                  label="Lokasi penyimpanan fisik (U13)"
                  required
                >
                  <input
                    id="itm-loc"
                    className="brk-input"
                    value={form.lokasi_penyimpanan}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lokasi_penyimpanan: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Rak B2, Gudang Utama"
                  />
                </FieldWrapper>

                {selectedCategory?.code === "EL" && (
                  <FieldWrapper
                    id="itm-serial"
                    label="Nomor seri atau IMEI (privat, EL05)"
                    required
                    helper="Tidak pernah ditampilkan ke publik."
                  >
                    <input
                      id="itm-serial"
                      className="brk-input brk-num"
                      value={form.serial_imei}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          serial_imei: e.target.value,
                        }))
                      }
                    />
                  </FieldWrapper>
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-2 pt-2">
                <button
                  type="button"
                  className="brk-btn brk-btn-secondary"
                  onClick={() => setActiveStep(1)}
                >
                  Kembali
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="brk-btn brk-btn-primary"
                    disabled={saveDraftMut.isPending || priceBelowMin}
                    onClick={async () => {
                      await saveDraftMut.mutateAsync();
                      setActiveStep(3);
                    }}
                  >
                    {saveDraftMut.isPending
                      ? "Menyimpan draf..."
                      : "Simpan draf dan isi SOP"}
                  </button>
                </div>
              </div>
            </div>
          </ConsolePanel>
        )}

        {activeStep === 3 && (
          <div className="space-y-5">
            <ConsolePanel
              icon={Camera}
              title="Langkah 3: Foto, video, dan checklist SOP dinamis"
              description="Foto minimum 4 (maksimal 10), video maksimal 2 (≤ 60 detik, ≤ 100 MB). Pastikan tidak ada data pribadi di media (U12)."
            >
              <div
                className="mb-4 rounded-xl border p-4"
                style={{
                  backgroundColor: "var(--kertas)",
                  borderColor: "var(--garis)",
                }}
              >
                <p className="text-sm font-bold">Panduan sudut foto wajib (U06)</p>
                <ul className="mt-2 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2" style={{ color: "var(--muted-brk)" }}>
                  {PHOTO_ANGLE_GUIDES.map((g) => (
                    <li key={g} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 shrink-0" style={{ color: "var(--indigo)" }} aria-hidden="true" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <MediaUploadQueue
                    ownerType="item"
                    ownerUuid={editingItem?.uuid || ""}
                    acceptVideo
                    guideLabel="Gunakan latar netral. Video fungsi wajib untuk elektronik, mainan suara, stroller, dan perkakas."
                    buttonLabel="Ambil foto atau video"
                    onUploaded={() => {
                      toast.success("Media tersimpan ke barang");
                      void queryClient.invalidateQueries({
                        queryKey: [
                          "barokahiin",
                          "console",
                          "item-sop",
                          editingItem?.uuid,
                        ],
                      });
                    }}
                  />
                </div>
              </div>

              {!editingItem ? (
                <InfoBanner
                  tone="info"
                  title="Simpan draf terlebih dahulu"
                  message="Kembali ke Langkah 2 dan klik Simpan draf agar checklist SOP dari server dimuat."
                />
              ) : sopQuery.isLoading ? (
                <LoadingSkeleton rows={4} />
              ) : sopQuery.error ? (
                <ErrorBanner
                  message={parseBarokahiinError(sopQuery.error).message}
                  onRetry={() => void sopQuery.refetch()}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="brk-num text-sm font-bold">
                        Progres SOP: {passedCount} dari {sopChecks.length} butir lulus
                      </p>
                      <label className="flex min-h-9 cursor-pointer items-center gap-1.5 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={onlyPendingSop}
                          onChange={(e) => setOnlyPendingSop(e.target.checked)}
                          className="size-4"
                        />
                        <span>Tampilkan yang belum lulus saja</span>
                      </label>
                    </div>
                    {gateErrors.length === 0 ? (
                      <StatusBadge value="terverifikasi" />
                    ) : (
                      <StatusBadge value="perlu_revisi" />
                    )}
                  </div>

                  {gateErrors.length > 0 && (
                    <div
                      className="rounded-xl border p-3.5 text-sm"
                      style={{
                        backgroundColor: "var(--kunyit-muda)",
                        borderColor: "var(--kunyit)",
                        color: "var(--peringatan-teks)",
                      }}
                    >
                      <p className="font-bold">
                        Syarat yang belum terpenuhi sebelum ajukan review:
                      </p>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs">
                        {gateErrors.map((errMsg, idx) => (
                          <li key={idx}>{errMsg}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <ul className="space-y-3">
                    {sopChecks
                      .filter((chk) =>
                        onlyPendingSop
                          ? !(chk.lulus || chk.nilai === true)
                          : true,
                      )
                      .map((chk) => {
                        const code = chk.code || chk.kode || "";
                        const isPassed = Boolean(chk.lulus || chk.nilai === true);
                        const needsMedia =
                          chk.tipe_bukti === "foto" ||
                          chk.tipe_bukti === "video";
                        return (
                          <li
                            key={code}
                            className="space-y-3 rounded-xl border p-4"
                            style={{
                              borderColor: isPassed
                                ? "var(--daun)"
                                : "var(--garis)",
                            }}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-bold">
                                  {code} — {chk.pertanyaan}
                                </p>
                                {chk.catatan_reviewer && (
                                  <p
                                    className="mt-1 text-xs font-semibold"
                                    style={{ color: "var(--bahaya)" }}
                                  >
                                    Catatan Reviewer: {chk.catatan_reviewer}
                                  </p>
                                )}
                                {!isPassed && chk.tindakan_gagal && (
                                  <p
                                    className="mt-1 text-xs"
                                    style={{ color: "var(--muted-brk)" }}
                                  >
                                    Tindakan bila gagal: {chk.tindakan_gagal}
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                  type="button"
                                  className={`brk-btn min-h-10 px-3 text-xs ${isPassed ? "brk-btn-daun" : "brk-btn-secondary"}`}
                                  disabled={updateSopMut.isPending}
                                  onClick={() =>
                                    updateSopMut.mutate({
                                      checkCode: code,
                                      nilai: true,
                                      mediaId: chk.media_id,
                                      teks: disclosureByCode[code] || chk.teks_keterbukaan || null,
                                    })
                                  }
                                >
                                  <CheckCircle2 className="size-4" aria-hidden="true" />
                                  <span>Lulus</span>
                                </button>
                                <button
                                  type="button"
                                  className={`brk-btn min-h-10 px-3 text-xs ${!isPassed && chk.nilai === false ? "brk-btn-danger" : "brk-btn-secondary"}`}
                                  disabled={updateSopMut.isPending}
                                  onClick={() =>
                                    updateSopMut.mutate({
                                      checkCode: code,
                                      nilai: false,
                                      teks: disclosureByCode[code] || chk.teks_keterbukaan || null,
                                    })
                                  }
                                >
                                  <span>Gagal / Keterbukaan</span>
                                </button>
                              </div>
                            </div>

                            {needsMedia && editingItem?.uuid && (
                              <div
                                className="rounded-lg border p-3"
                                style={{
                                  backgroundColor: "var(--kertas)",
                                  borderColor: "var(--garis)",
                                }}
                              >
                                <MediaUploadQueue
                                  ownerType="item"
                                  ownerUuid={editingItem.uuid}
                                  acceptVideo={chk.tipe_bukti === "video"}
                                  checkId={chk.id ?? code}
                                  guideLabel={
                                    chk.panduan_sudut ||
                                    `Unggah bukti ${chk.tipe_bukti} untuk butir ${code}.`
                                  }
                                  buttonLabel={`Ambil ${chk.tipe_bukti} (${code})`}
                                  onUploaded={(media) => {
                                    updateSopMut.mutate({
                                      checkCode: code,
                                      nilai: true,
                                      mediaId: media.id ?? media.uuid,
                                    });
                                  }}
                                />
                              </div>
                            )}

                            {(!isPassed || chk.teks_keterbukaan) && (
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                  aria-label={`Teks keterbukaan untuk ${code}`}
                                  className="brk-input min-h-10 flex-1 text-xs"
                                  placeholder="Tulis keterbukaan/catatan untuk pembeli (opsional)..."
                                  value={
                                    disclosureByCode[code] ??
                                    chk.teks_keterbukaan ??
                                    ""
                                  }
                                  onChange={(e) =>
                                    setDisclosureByCode((prev) => ({
                                      ...prev,
                                      [code]: e.target.value,
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  className="brk-btn brk-btn-secondary min-h-10 shrink-0 px-3 text-xs"
                                  disabled={updateSopMut.isPending}
                                  onClick={() =>
                                    updateSopMut.mutate({
                                      checkCode: code,
                                      nilai: isPassed,
                                      teks: disclosureByCode[code] ?? "",
                                    })
                                  }
                                >
                                  Simpan catatan
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex justify-between gap-2">
                <button
                  type="button"
                  className="brk-btn brk-btn-secondary"
                  onClick={() => setActiveStep(2)}
                >
                  Kembali
                </button>
                <button
                  type="button"
                  className="brk-btn brk-btn-primary"
                  onClick={() => setActiveStep(4)}
                >
                  <Eye className="size-4" aria-hidden="true" />
                  <span>Pratinjau dan ajukan</span>
                </button>
              </div>
            </ConsolePanel>
          </div>
        )}

        {activeStep === 4 && (
          <ConsolePanel
            icon={Eye}
            title="Langkah 4: Pratinjau publik dan ajukan review"
            description="Periksa tampilan seperti yang dilihat pembeli sebelum mengajukan ke Admin Reviewer."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div
                className="rounded-xl border p-4 lg:col-span-7"
                style={{
                  backgroundColor: "var(--kertas)",
                  borderColor: "var(--garis)",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="brk-num rounded-md border px-2 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: "var(--putih)",
                      borderColor: "var(--garis)",
                    }}
                  >
                    {editingItem?.kode_barang || "Kode otomatis"}
                  </span>
                  <GradeBadge grade={form.grade} />
                  {form.jalur === "charity" && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--daun-muda)",
                        color: "var(--daun-tua)",
                      }}
                    >
                      Barang Charity (95% ke program)
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-xl font-bold">
                  {form.judul || "Judul barang"}
                </h3>
                <p
                  className="brk-display brk-num mt-1 text-2xl font-bold"
                  style={{ color: "var(--indigo)" }}
                >
                  {formatRupiah(Number(form.price_idr))}
                </p>

                <div
                  className="mt-4 rounded-lg border p-3"
                  style={{
                    backgroundColor: "var(--putih)",
                    borderColor: "var(--garis)",
                  }}
                >
                  <p className="text-xs font-bold" style={{ color: "var(--muted-brk)" }}>
                    Kekurangan (ditampilkan setara ke pembeli)
                  </p>
                  <p className="mt-1 text-sm">
                    {form.noDefectConfirmed
                      ? "Tidak ada kekurangan berarti"
                      : form.kekurangan || "Belum diisi"}
                  </p>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-bold" style={{ color: "var(--muted-brk)" }}>
                    Keterangan
                  </p>
                  <p className="mt-1 text-sm">
                    {form.keterangan || "Belum diisi"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 lg:col-span-5">
                <div
                  className="rounded-xl border p-4 text-sm"
                  style={{ borderColor: "var(--garis)" }}
                >
                  <p className="font-bold">Pemeriksaan akhir</p>
                  <ul className="mt-2 space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      {storeVerified ? (
                        <CheckCircle2 className="size-4" style={{ color: "var(--daun)" }} />
                      ) : (
                        <AlertTriangle className="size-4" style={{ color: "var(--bahaya)" }} />
                      )}
                      <span>Alamat toko terverifikasi Admin</span>
                    </li>
                    <li className="flex items-center gap-2">
                      {gateErrors.length === 0 ? (
                        <CheckCircle2 className="size-4" style={{ color: "var(--daun)" }} />
                      ) : (
                        <AlertTriangle className="size-4" style={{ color: "var(--bahaya)" }} />
                      )}
                      <span>
                        Semua butir wajib SOP lulus ({gateErrors.length} kurang)
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="brk-btn brk-btn-primary w-full"
                  disabled={!canSubmitReview || submitReviewMut.isPending}
                  onClick={() => submitReviewMut.mutate()}
                >
                  <Send className="size-4" aria-hidden="true" />
                  <span>
                    {submitReviewMut.isPending
                      ? "Mengajukan..."
                      : "Ajukan review"}
                  </span>
                </button>
              </div>
            </div>
          </ConsolePanel>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!storeVerified && (
        <InfoBanner
          tone="warning"
          title="Pengajuan review terkunci sementara"
          message="Alamat tokomu belum terverifikasi, jadi barang belum bisa diterbitkan. Lengkapi dan ajukan verifikasi di Toko saya."
          action={
            <button
              type="button"
              className="brk-btn brk-btn-primary"
              onClick={onGoToStore}
            >
              Buka Toko saya
            </button>
          }
        />
      )}

      <ConsolePanel
        icon={Package}
        title="Daftar barang kurasi"
        description="Kelola draf, checklist SOP, revisi Reviewer, cetak label fisik (kode dan QR), serta penarikan barang."
        action={
          <button
            type="button"
            className="brk-btn brk-btn-primary"
            onClick={openNewItem}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>Tambah barang</span>
          </button>
        }
      >
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="search"
            aria-label="Cari barang"
            className="brk-input"
            placeholder="Cari kode atau judul..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <ConsoleSelect
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            placeholder="Semua status"
            options={[
              { value: "", label: "Semua status" },
              {
                value: "draft,perlu_revisi",
                label: "Perlu tindakan (Draf & Revisi)",
              },
              { value: "draft", label: "Draf" },
              { value: "menunggu_review", label: "Menunggu review" },
              { value: "perlu_revisi", label: "Perlu revisi" },
              { value: "terbit", label: "Terbit" },
              { value: "ditahan", label: "Ditahan" },
              { value: "terjual", label: "Terjual" },
              { value: "ditarik", label: "Ditarik" },
              { value: "ditolak", label: "Ditolak" },
            ]}
          />
          <ConsoleSelect
            value={categoryFilter}
            onChange={(v) => {
              setCategoryFilter(v);
              setPage(1);
            }}
            placeholder="Semua kategori"
            options={[
              { value: "", label: "Semua kategori" },
              ...ITEM_CATEGORIES_SEED.map((c) => ({
                value: String(c.id),
                label: `${c.code} — ${c.nama}`,
              })),
            ]}
          />
          <ConsoleSelect
            value={jalurFilter}
            onChange={(v) => {
              setJalurFilter(v);
              setPage(1);
            }}
            placeholder="Semua jalur"
            options={[
              { value: "", label: "Semua jalur" },
              { value: "jual", label: "Jual reguler" },
              { value: "charity", label: "Charity" },
              { value: "salurkan", label: "Salurkan langsung" },
            ]}
          />
          <ConsoleSelect
            value={gradeFilter}
            onChange={(v) => {
              setGradeFilter(v);
              setPage(1);
            }}
            placeholder="Semua grade"
            options={[
              { value: "", label: "Semua grade" },
              { value: "A", label: "Grade A" },
              { value: "B", label: "Grade B" },
              { value: "C", label: "Grade C" },
            ]}
          />
        </div>
        {(search ||
          statusFilter ||
          categoryFilter ||
          jalurFilter ||
          gradeFilter) && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              className="brk-btn brk-btn-ghost min-h-9 px-3 text-xs"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setCategoryFilter("");
                setJalurFilter("");
                setGradeFilter("");
                setPage(1);
              }}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>Reset filter</span>
            </button>
          </div>
        )}

        {itemsQuery.isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : itemsQuery.error ? (
          <ErrorBanner
            message={parseBarokahiinError(itemsQuery.error).message}
            onRetry={() => void itemsQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Belum ada barang yang cocok"
            description="Mulai catat barang donasi baru atau ubah filter status."
            action={
              <button
                type="button"
                className="brk-btn brk-btn-primary"
                onClick={openNewItem}
              >
                <Plus className="size-4" aria-hidden="true" />
                <span>Tambah barang</span>
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {items.map((item) => {
              const raw = item as ConsoleItem & {
                judul_publik?: string;
                nama_internal?: string;
                harga_rupiah?: number;
                kondisi_grade?: string;
              };
              const displayTitle =
                item.judul || raw.judul_publik || raw.nama_internal || item.kode_barang;
              const displayPrice = item.price_idr ?? raw.harga_rupiah ?? 0;
              const displayGrade = item.grade || raw.kondisi_grade;
              const displayCover =
                item.cover_url || item.media?.find((m) => m.tipe === "foto")?.url;

              return (
                <article
                  key={item.uuid}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-4"
                  style={{ borderColor: "var(--garis)" }}
                >
                  <div className="flex gap-3">
                    {displayCover ? (
                      <img
                        src={displayCover}
                        alt={`${displayTitle}, Grade ${displayGrade || "-"}`}
                        className="aspect-4/5 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="flex aspect-4/5 w-20 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: "var(--kertas)",
                          color: "var(--muted-brk)",
                        }}
                      >
                        <Package className="size-6" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="brk-num text-xs font-bold"
                          style={{ color: "var(--muted-brk)" }}
                        >
                          {item.kode_barang}
                        </span>
                        <StatusBadge value={item.status} />
                      </div>
                      <h3 className="mt-1 line-clamp-2 text-base font-bold">
                        {displayTitle}
                      </h3>
                      <p
                        className="brk-display brk-num mt-1 text-lg font-bold"
                        style={{ color: "var(--indigo)" }}
                      >
                        {formatRupiah(displayPrice)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <GradeBadge grade={displayGrade} />
                        {(() => {
                          const rev = item.review ?? item.order?.review ?? null;
                          const score =
                            rev?.rating ?? rev?.rating_barang ?? null;
                          if (!score) return null;
                          return (
                            <span
                              className="brk-num inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold"
                              style={{
                                backgroundColor: "var(--kunyit-muda)",
                                borderColor: "var(--kunyit)",
                                color: "var(--peringatan-teks)",
                              }}
                            >
                              <Star
                                className="size-3 fill-current"
                                aria-hidden="true"
                              />
                              <span>{score}/5</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex flex-wrap gap-2 border-t pt-3"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <button
                      type="button"
                      className="brk-btn brk-btn-secondary"
                      onClick={() => setDetailItem(item)}
                    >
                      <Eye className="size-4" aria-hidden="true" />
                      <span>Lihat detail</span>
                    </button>
                    {(item.status === "draft" ||
                      item.status === "perlu_revisi") && (
                      <button
                        type="button"
                        className="brk-btn brk-btn-primary"
                        onClick={() => openEditItem(item)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        <span>Lanjutkan kurasi</span>
                      </button>
                    )}
                    {(item.status === "terbit" ||
                      item.status === "ditarik") && (
                      <button
                        type="button"
                        className="brk-btn brk-btn-primary"
                        onClick={() => openEditItem(item)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        <span>Edit barang</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="brk-btn brk-btn-neutral"
                      onClick={() => setLabelItem(item)}
                    >
                      <Printer className="size-4" aria-hidden="true" />
                      <span>Cetak label</span>
                    </button>
                    {item.status === "terbit" && (
                      <button
                        type="button"
                        className="brk-btn brk-btn-warning"
                        onClick={() => setWithdrawTarget(item)}
                      >
                        <EyeOff className="size-4" aria-hidden="true" />
                        <span>Tarik barang</span>
                      </button>
                    )}
                    {item.status === "ditarik" && (
                      <button
                        type="button"
                        className="brk-btn brk-btn-daun"
                        disabled={republishMut.isPending}
                        onClick={() => republishMut.mutate(item.uuid)}
                      >
                        {republishMut.isPending &&
                        republishMut.variables === item.uuid ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <RotateCcw className="size-4" aria-hidden="true" />
                        )}
                        <span>
                          {republishMut.isPending &&
                          republishMut.variables === item.uuid
                            ? "Menerbitkan..."
                            : "Terbitkan ulang"}
                        </span>
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

      {/* Item Detail Modal (accessible for all statuses) */}
      {detailItem && (() => {
        const full = detailQuery.data ?? detailItem;
        const rawFull = full as ConsoleItem & {
          judul_publik?: string;
          nama_internal?: string;
          harga_rupiah?: number;
          kondisi_grade?: string;
        };
        const title =
          full.judul || rawFull.judul_publik || rawFull.nama_internal || full.kode_barang;
        const price = full.price_idr ?? rawFull.harga_rupiah ?? 0;
        const grade = full.grade || rawFull.kondisi_grade;
        const mediaList = full.media ?? [];

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brk-item-detail-title"
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 sm:items-center sm:p-4"
            onClick={() => setDetailItem(null)}
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
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="brk-num text-xs font-bold"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      {full.kode_barang}
                    </span>
                    <StatusBadge value={full.status} />
                    <GradeBadge grade={grade} />
                  </div>
                  <h2
                    id="brk-item-detail-title"
                    className="mt-1.5 text-lg font-bold"
                  >
                    {title}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Tutup detail barang"
                  className="size-10 shrink-0 rounded-lg"
                  onClick={() => setDetailItem(null)}
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                {(detailQuery.isLoading || detailQuery.isFetching) && (
                  <div
                    className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--indigo-muda)",
                      borderColor: "var(--indigo)",
                      color: "var(--indigo)",
                    }}
                  >
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                    <span>Memuat detail barang terbaru dari server...</span>
                  </div>
                )}

                {full.alasan_tolak && (
                  <InfoBanner
                    tone={full.status === "ditolak" ? "danger" : "warning"}
                    title={
                      full.status === "ditolak"
                        ? "Alasan penolakan"
                        : "Catatan revisi Reviewer"
                    }
                    message={full.alasan_tolak}
                  />
                )}

                {/* Buyer Rating & Review (for sold items or whenever review exists) */}
                {(() => {
                  const resolvedReview =
                    full.review ??
                    full.order?.review ??
                    matchedOrderDetailQuery.data?.review ??
                    matchedOrderForDetail?.review ??
                    null;
                  const ratingScore =
                    resolvedReview?.rating ??
                    resolvedReview?.rating_barang ??
                    null;
                  const loadingRating =
                    full.status === "terjual" &&
                    !ratingScore &&
                    (detailQuery.isLoading ||
                      soldOrdersQuery.isLoading ||
                      matchedOrderDetailQuery.isLoading);

                  if (full.status !== "terjual" && !ratingScore) return null;

                  return (
                    <div
                      className="rounded-xl border p-4"
                      style={{
                        backgroundColor: ratingScore
                          ? "var(--kunyit-muda)"
                          : "var(--kertas)",
                        borderColor: ratingScore
                          ? "var(--kunyit)"
                          : "var(--garis)",
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className="text-xs font-bold"
                          style={{
                            color: ratingScore
                              ? "var(--peringatan-teks)"
                              : "var(--muted-brk)",
                          }}
                        >
                          Rating dan ulasan pembeli
                        </p>
                        {(full.order?.kode_pesanan ||
                          matchedOrderForDetail?.kode_pesanan) && (
                          <span
                            className="brk-num text-xs font-semibold"
                            style={{ color: "var(--muted-brk)" }}
                          >
                            Pesanan{" "}
                            {full.order?.kode_pesanan ||
                              matchedOrderForDetail?.kode_pesanan}
                          </span>
                        )}
                      </div>

                      {loadingRating ? (
                        <div
                          className="mt-2 flex items-center gap-2 text-xs font-medium"
                          style={{ color: "var(--muted-brk)" }}
                        >
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          <span>Memuat rating dan ulasan pembeli...</span>
                        </div>
                      ) : ratingScore ? (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex flex-wrap items-center gap-1">
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
                            {resolvedReview?.rating_layanan ? (
                              <span
                                className="brk-num ml-2 text-xs"
                                style={{ color: "var(--peringatan-teks)" }}
                              >
                                (Layanan: {resolvedReview.rating_layanan}/5)
                              </span>
                            ) : null}
                          </div>
                          {(resolvedReview?.komentar ||
                            resolvedReview?.teks) && (
                            <p
                              className="text-sm font-medium"
                              style={{ color: "var(--tinta)" }}
                            >
                              "{resolvedReview.komentar || resolvedReview.teks}"
                            </p>
                          )}
                          {resolvedReview?.created_at && (
                            <p
                              className="text-xs"
                              style={{ color: "var(--muted-brk)" }}
                            >
                              Diulas pada{" "}
                              {formatDateId(resolvedReview.created_at)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p
                          className="mt-1 text-xs"
                          style={{ color: "var(--muted-brk)" }}
                        >
                          Pembeli belum memberikan rating atau ulasan untuk
                          barang ini.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Media gallery */}
                {mediaList.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {mediaList.map((m) =>
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
                          alt={m.alt || title}
                          className="aspect-4/5 w-full rounded-lg object-cover"
                        />
                      ),
                    )}
                  </div>
                )}

                {/* Key pricing & specs */}
                <div
                  className="grid grid-cols-2 gap-3 rounded-xl border p-4 text-sm sm:grid-cols-4"
                  style={{
                    backgroundColor: "var(--kertas)",
                    borderColor: "var(--garis)",
                  }}
                >
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                      Harga jual
                    </p>
                    <p
                      className="brk-display brk-num font-bold"
                      style={{ color: "var(--indigo)" }}
                    >
                      {formatRupiah(price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                      Harga baru ref.
                    </p>
                    <p className="brk-num font-semibold">
                      {formatRupiah(full.ref_new_price_idr)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                      Berat / Dimensi
                    </p>
                    <p className="brk-num font-semibold">
                      {full.weight_g ?? 0} g ({full.dim_l_cm ?? 0}×
                      {full.dim_w_cm ?? 0}×{full.dim_h_cm ?? 0} cm)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                      Jalur
                    </p>
                    <p className="font-semibold capitalize">
                      {full.jalur || "jual"}
                    </p>
                  </div>
                </div>

                {full.lokasi_penyimpanan && (
                  <div
                    className="rounded-xl border p-3 text-sm"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      Lokasi penyimpanan fisik
                    </p>
                    <p className="mt-0.5 font-medium">
                      {full.lokasi_penyimpanan}
                    </p>
                  </div>
                )}

                {/* Defect & description */}
                <div className="space-y-3 text-sm">
                  <div
                    className="rounded-xl border p-3.5"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      Kekurangan barang
                    </p>
                    <p className="mt-1">{full.kekurangan || "-"}</p>
                  </div>

                  <div
                    className="rounded-xl border p-3.5"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      Keterangan publik
                    </p>
                    <p className="mt-1 whitespace-pre-line">
                      {full.keterangan || "-"}
                    </p>
                  </div>
                </div>

                <div
                  className="flex flex-wrap items-center justify-between gap-2 border-t pt-4"
                  style={{ borderColor: "var(--garis)" }}
                >
                  <button
                    type="button"
                    className="brk-btn brk-btn-secondary"
                    onClick={() => {
                      setLabelItem(full);
                      setDetailItem(null);
                    }}
                  >
                    <Printer className="size-4" aria-hidden="true" />
                    <span>Cetak label</span>
                  </button>

                  <div className="flex flex-wrap gap-2">
                    {isEditableStatus(full.status) && (
                      <button
                        type="button"
                        className="brk-btn brk-btn-primary"
                        onClick={() => {
                          setDetailItem(null);
                          openEditItem(full);
                        }}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        <span>
                          {full.status === "draft" ||
                          full.status === "perlu_revisi"
                            ? "Lanjutkan kurasi"
                            : "Edit barang"}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="brk-btn brk-btn-secondary"
                      onClick={() => setDetailItem(null)}
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Print Thermal Physical Label Modal (ITM-12, 58mm / 80mm thermal paper) */}
      {labelItem && (() => {
        const rawLbl = labelItem as ConsoleItem & {
          judul_publik?: string;
          nama_internal?: string;
          harga_rupiah?: number;
          kondisi_grade?: string;
        };
        const lblTitle =
          labelItem.judul ||
          rawLbl.judul_publik ||
          rawLbl.nama_internal ||
          labelItem.kode_barang;
        const lblPrice = labelItem.price_idr ?? rawLbl.harga_rupiah ?? 0;
        const lblGrade = labelItem.grade || rawLbl.kondisi_grade;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cetak label thermal barang"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setLabelItem(null)}
          >
            <div
              className="brk-float max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-4xl border p-5"
              style={{
                backgroundColor: "var(--putih)",
                borderColor: "var(--garis)",
                color: "var(--tinta)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold">
                    Cetak Label Thermal ({thermalWidth})
                  </h3>
                  <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                    Khusus printer stiker / kertas thermal hitam-putih.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Tutup"
                  className="size-10 rounded-lg"
                  onClick={() => setLabelItem(null)}
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>
              </div>

              {/* Thermal paper width selector */}
              <div className="mt-3 flex gap-2">
                {(["58mm", "80mm"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    className="brk-btn min-h-9 flex-1 text-xs"
                    style={{
                      backgroundColor:
                        thermalWidth === size
                          ? "var(--indigo-btn)"
                          : "var(--kertas)",
                      color: thermalWidth === size ? "#ffffff" : "var(--tinta)",
                      borderColor:
                        thermalWidth === size
                          ? "var(--indigo-btn)"
                          : "var(--garis)",
                    }}
                    onClick={() => setThermalWidth(size)}
                  >
                    Kertas {size}
                  </button>
                ))}
              </div>

              {/* Printable Thermal Sticker Area */}
              <div className="mt-4 flex justify-center rounded-xl border p-4" style={{ backgroundColor: "var(--kertas)", borderColor: "var(--garis)" }}>
                <div
                  ref={thermalLabelRef}
                  style={{
                    width: thermalWidth === "58mm" ? "216px" : "296px",
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    padding: "10px 8px",
                    border: "1px dashed #000000",
                    fontFamily: "Arial, Helvetica, sans-serif",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      borderBottom: "1px dashed #000000",
                      paddingBottom: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                      }}
                    >
                      BAROKAHIIN
                    </div>
                    <div style={{ fontSize: "9px" }}>
                      Barang Layak Kurasi Lokal
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <QRCode
                      value={`${labelItem.kode_barang}|${labelItem.uuid}`}
                      size={thermalWidth === "58mm" ? 112 : 140}
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: thermalWidth === "58mm" ? "13px" : "15px",
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {labelItem.kode_barang}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        marginTop: "4px",
                        lineHeight: 1.25,
                      }}
                    >
                      {lblTitle}
                    </div>
                    <div
                      style={{
                        fontSize: thermalWidth === "58mm" ? "15px" : "17px",
                        fontWeight: 800,
                        marginTop: "6px",
                        paddingTop: "6px",
                        borderTop: "1px dashed #000000",
                      }}
                    >
                      {formatRupiah(lblPrice)}
                    </div>
                    <div style={{ fontSize: "10px", marginTop: "4px" }}>
                      {lblGrade ? `Grade ${lblGrade}` : ""}
                      {lblGrade && labelItem.lokasi_penyimpanan ? " | " : ""}
                      {labelItem.lokasi_penyimpanan
                        ? `Simpan: ${labelItem.lokasi_penyimpanan}`
                        : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="brk-btn brk-btn-secondary"
                  onClick={() => setLabelItem(null)}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="brk-btn brk-btn-primary"
                  onClick={() => handlePrintThermal()}
                >
                  <Printer className="size-4" aria-hidden="true" />
                  <span>Cetak / PDF Thermal</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <ConfirmDialog
        open={Boolean(withdrawTarget)}
        title="Tarik barang dari storefront"
        description={`Tarik ${withdrawTarget?.kode_barang || "barang ini"} agar sementara tidak tampil di katalog publik.`}
        confirmLabel="Tarik barang"
        tone="danger"
        loading={withdrawMut.isPending}
        onCancel={() => setWithdrawTarget(null)}
        onConfirm={() => withdrawMut.mutate()}
      >
        <FieldWrapper id="withdraw-alasan" label="Alasan penarikan">
          <input
            id="withdraw-alasan"
            className="brk-input"
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="Contoh: Perlu pengecekan ulang kondisi"
          />
        </FieldWrapper>
      </ConfirmDialog>
    </div>
  );
}
