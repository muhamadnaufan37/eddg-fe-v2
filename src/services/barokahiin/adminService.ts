import {
  ADMIN_BASE,
  createIdempotencyKey,
  deleteApiData,
  downloadApiCsv,
  getApiData,
  patchApiData,
  postApiData,
  putApiData,
} from "./apiClient";
import type {
  AddressCheckCode,
  AdminAuditLog,
  AdminCategory,
  AdminDashboardData,
  AdminPriceGuideline,
  AdminShippingRate,
  AdminSopCheck,
  AdminSopTemplate,
  AdminVoucher,
  CharityDisbursement,
  CharityProgram,
  ConsoleDispute,
  ConsoleItem,
  CoordinatorSanction,
  CoordinatorStore,
  CoordinatorSummary,
  ItemGrade,
  LedgerReconciliation,
  PaginatedList,
  PayoutRecord,
  SplitScheme,
  StaticPageRecord,
  StoreAddress,
  VoucherType,
} from "./types";

// --- 3.1 Dashboard, Coordinators, Stores & Address V1-V8 ---

export const getAdminDashboard = () =>
  getApiData<AdminDashboardData>(ADMIN_BASE, "/dashboard");

export const getAdminCoordinators = (
  params: { status?: string; q?: string; page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<CoordinatorSummary> | CoordinatorSummary[]>(
    ADMIN_BASE,
    "/coordinators",
    params,
  );

export const verifyAdminCoordinator = (
  uuid: string,
  payload: {
    status: string;
    level: 1 | 2 | 3;
    regency_codes?: string[];
    wilayah_codes?: string[];
    region_ids?: Array<number | string>;
    alasan?: string;
  },
) =>
  postApiData<CoordinatorSummary>(
    ADMIN_BASE,
    `/coordinators/${encodeURIComponent(uuid)}/verify`,
    payload,
  );

export const sanctionAdminCoordinator = (
  uuid: string,
  payload: {
    tingkat: "ringan" | "sedang" | "berat";
    jenis: string;
    alasan: string;
    selesai?: string | null;
  },
) =>
  postApiData<CoordinatorSanction>(
    ADMIN_BASE,
    `/coordinators/${encodeURIComponent(uuid)}/sanctions`,
    payload,
  );

export const getAdminStores = (
  params: { status?: string; q?: string; page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<CoordinatorStore> | CoordinatorStore[]>(
    ADMIN_BASE,
    "/stores",
    params,
  );

export const moderateAdminStore = (
  uuid: string,
  payload: {
    status: "aktif" | "dibatasi" | "ditangguhkan" | "ditutup";
    note?: string;
  },
) =>
  postApiData<CoordinatorStore>(
    ADMIN_BASE,
    `/stores/${encodeURIComponent(uuid)}/moderate`,
    payload,
  );

export const recordStoreAddressCheck = (
  addressUuid: string,
  payload: {
    kode: AddressCheckCode;
    lulus: boolean;
    catatan?: string;
  },
) =>
  postApiData<StoreAddress>(
    ADMIN_BASE,
    `/store-addresses/${encodeURIComponent(addressUuid)}/checks`,
    payload,
  );

export const verifyStoreAddress = (addressUuid: string) =>
  postApiData<StoreAddress>(
    ADMIN_BASE,
    `/store-addresses/${encodeURIComponent(addressUuid)}/verify`,
  );

export const rejectStoreAddress = (
  addressUuid: string,
  payload: {
    status: "perlu_perbaikan" | "ditolak";
    alasan: string;
  },
) =>
  postApiData<StoreAddress>(
    ADMIN_BASE,
    `/store-addresses/${encodeURIComponent(addressUuid)}/reject`,
    payload,
  );

// --- 3.2 Review Queue & Audit Sampling ---

export const getAdminReviewQueue = (
  params: { page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<ConsoleItem> | ConsoleItem[]>(
    ADMIN_BASE,
    "/review/queue",
    params,
  );

export const submitAdminItemReview = (
  uuid: string,
  payload: {
    keputusan: "setuju" | "revisi" | "tolak";
    price_idr?: number;
    special_price_approval?: boolean;
    catatan_per_butir?: Record<string, string>;
    alasan?: string;
  },
) =>
  postApiData<ConsoleItem>(
    ADMIN_BASE,
    `/items/${encodeURIComponent(uuid)}/review`,
    payload,
  );

export const submitAdminItemAudit = (
  uuid: string,
  payload: {
    hasil: "lulus" | "gagal";
    catatan?: string;
  },
) =>
  postApiData<ConsoleItem>(
    ADMIN_BASE,
    `/items/${encodeURIComponent(uuid)}/audit`,
    payload,
  );

// --- 3.3 Vouchers, Disputes, Payouts, Ledger, Charity, & Config ---

export interface AdminVoucherPayload {
  code: string;
  nama: string;
  deskripsi?: string | null;
  tipe: VoucherType;
  nilai: number;
  max_discount_idr?: number | null;
  min_subtotal_idr: number;
  quota_total?: number | null;
  per_user_limit: number;
  store_id?: number | string | null;
  category_id?: number | string | null;
  is_public: boolean;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

export const getAdminVouchers = (
  params: { q?: string; is_active?: string; page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<AdminVoucher> | AdminVoucher[]>(
    ADMIN_BASE,
    "/vouchers",
    params,
  );

export const createAdminVoucher = (payload: AdminVoucherPayload) =>
  postApiData<AdminVoucher>(ADMIN_BASE, "/vouchers", payload);

export const updateAdminVoucher = (
  uuid: string,
  payload: Partial<AdminVoucherPayload>,
) =>
  patchApiData<AdminVoucher>(
    ADMIN_BASE,
    `/vouchers/${encodeURIComponent(uuid)}`,
    payload,
  );

export const deleteAdminVoucher = (uuid: string) =>
  deleteApiData<unknown>(ADMIN_BASE, `/vouchers/${encodeURIComponent(uuid)}`);

export const getAdminDisputes = (
  params: { status?: string; page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<ConsoleDispute> | ConsoleDispute[]>(
    ADMIN_BASE,
    "/disputes",
    params,
  );

export const decideAdminDispute = (
  uuid: string,
  payload: {
    putusan: "tolak" | "refund_sebagian" | "refund_penuh";
    nominal_refund_idr?: number;
    kelalaian_koordinator?: boolean;
    biaya_retur_idr?: number;
    catatan?: string;
  },
) =>
  postApiData<ConsoleDispute>(
    ADMIN_BASE,
    `/disputes/${encodeURIComponent(uuid)}/decide`,
    payload,
  );

export const getAdminPayouts = (
  params: { status?: string; page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<PayoutRecord> | PayoutRecord[]>(
    ADMIN_BASE,
    "/payouts",
    params,
  );

export const transferAdminPayout = (uuid: string, bukti_ref: string) =>
  postApiData<PayoutRecord>(
    ADMIN_BASE,
    `/payouts/${encodeURIComponent(uuid)}/transfer`,
    { bukti_ref },
  );

export const rejectAdminPayout = (uuid: string, alasan: string) =>
  postApiData<PayoutRecord>(
    ADMIN_BASE,
    `/payouts/${encodeURIComponent(uuid)}/reject`,
    { alasan },
  );

export const getAdminLedgerReconciliation = () =>
  getApiData<LedgerReconciliation>(ADMIN_BASE, "/ledger/reconciliation");

export const exportAdminSalesCsv = (
  params: { from?: string; to?: string; status?: string } = {},
) =>
  downloadApiCsv(
    ADMIN_BASE,
    "/reports/sales/export",
    params,
    `laporan-penjualan-${params.from || "all"}-${params.to || "now"}.csv`,
  );

export const exportAdminLedgerCsv = (
  params: { from?: string; to?: string } = {},
) =>
  downloadApiCsv(
    ADMIN_BASE,
    "/reports/ledger/export",
    params,
    `laporan-ledger-${params.from || "all"}-${params.to || "now"}.csv`,
  );

export const createAdminLedgerAdjustment = (
  payload: {
    debit_account: string;
    credit_account: string;
    amount_idr: number;
    alasan: string;
  },
  idempotencyKey = createIdempotencyKey("ledger-adj"),
) =>
  postApiData<unknown>(ADMIN_BASE, "/ledger/adjustments", payload, {
    idempotencyKey,
  });

export const getAdminPrograms = (
  params: { status?: string; page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<CharityProgram> | CharityProgram[]>(
    ADMIN_BASE,
    "/programs",
    params,
  );

export const approveAdminProgram = (uuid: string) =>
  postApiData<CharityProgram>(
    ADMIN_BASE,
    `/programs/${encodeURIComponent(uuid)}/approve`,
  );

export const allocateAdminPool = (
  payload: {
    province_code?: string;
    regency_code: string;
    district_code?: string;
    village_code?: string;
    wilayah_code?: string;
    program_uuid: string;
    amount_idr: number;
    catatan?: string;
  },
  idempotencyKey = createIdempotencyKey("pool-alloc"),
) =>
  postApiData<unknown>(ADMIN_BASE, "/pool/allocate", payload, {
    idempotencyKey,
  });

export const approveAdminDisbursement = (uuid: string) =>
  postApiData<CharityDisbursement>(
    ADMIN_BASE,
    `/disbursements/${encodeURIComponent(uuid)}/approve`,
  );

export const getAdminSplitSchemes = (
  params: { page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<SplitScheme> | SplitScheme[]>(
    ADMIN_BASE,
    "/split-schemes",
    params,
  );

export const createAdminSplitScheme = (payload: {
  nama?: string;
  cakupan?: string;
  koordinator_pct: number;
  kegiatan_pct: number;
  operasional_pct: number;
  jaminan_pct: number;
  donatur_pct: number;
}) => postApiData<SplitScheme>(ADMIN_BASE, "/split-schemes", payload);

export const announceAdminSplitScheme = (
  uuid: string,
  mulai_berlaku: string,
) =>
  postApiData<SplitScheme>(
    ADMIN_BASE,
    `/split-schemes/${encodeURIComponent(uuid)}/announce`,
    { mulai_berlaku },
  );

export const getAdminConfig = () =>
  getApiData<Record<string, unknown>>(ADMIN_BASE, "/config");

export const updateAdminConfig = (payload: Record<string, unknown>) =>
  patchApiData<Record<string, unknown>>(ADMIN_BASE, "/config", payload);

export const getAdminPages = () =>
  getApiData<PaginatedList<StaticPageRecord> | StaticPageRecord[]>(
    ADMIN_BASE,
    "/pages",
  );

export const saveAdminPage = (payload: StaticPageRecord) =>
  putApiData<StaticPageRecord>(ADMIN_BASE, "/pages", payload);

export const updateAdminSettings = (payload: Record<string, unknown>) =>
  patchApiData<Record<string, unknown>>(ADMIN_BASE, "/settings", payload);

export const getAdminAuditLogs = (
  params: {
    target_type?: string;
    aksi?: string;
    q?: string;
    page?: number;
    per_page?: number;
  } = {},
) =>
  getApiData<PaginatedList<AdminAuditLog> | AdminAuditLog[]>(
    ADMIN_BASE,
    "/audit-logs",
    params,
  );

// --- 3.4 Master Data Admin (Categories, SOP, Price Guidelines, Shipping Rates) ---

export const getAdminCategories = () =>
  getApiData<PaginatedList<AdminCategory> | AdminCategory[]>(
    ADMIN_BASE,
    "/categories",
  );

export const createAdminCategory = (payload: {
  kode: string;
  nama: string;
  aktif: boolean;
  terlarang: boolean;
  aturan?: { pickup_only?: boolean };
  urutan?: number;
}) => postApiData<AdminCategory>(ADMIN_BASE, "/categories", payload);

export const updateAdminCategory = (
  uuid: string,
  payload: Partial<{
    kode: string;
    nama: string;
    aktif: boolean;
    terlarang: boolean;
    aturan: { pickup_only?: boolean };
    urutan: number;
  }>,
) =>
  patchApiData<AdminCategory>(
    ADMIN_BASE,
    `/categories/${encodeURIComponent(uuid)}`,
    payload,
  );

export const deleteAdminCategory = (uuid: string) =>
  deleteApiData<unknown>(ADMIN_BASE, `/categories/${encodeURIComponent(uuid)}`);

export const getAdminSopTemplates = () =>
  getApiData<PaginatedList<AdminSopTemplate> | AdminSopTemplate[]>(
    ADMIN_BASE,
    "/sop-templates",
  );

export const createAdminSopCheck = (
  templateId: string | number,
  payload: {
    kode: string;
    teks: string;
    tipe: "bool" | "text" | "number";
    wajib: boolean;
    butuh_bukti: "none" | "foto" | "video";
    on_fail: "fix" | "reject";
    urutan?: number;
  },
) =>
  postApiData<AdminSopCheck>(
    ADMIN_BASE,
    `/sop-templates/${encodeURIComponent(String(templateId))}/checks`,
    payload,
  );

export const updateAdminSopCheck = (
  checkId: string | number,
  payload: Partial<{
    kode: string;
    teks: string;
    tipe: "bool" | "text" | "number";
    wajib: boolean;
    butuh_bukti: "none" | "foto" | "video";
    on_fail: "fix" | "reject";
    urutan: number;
  }>,
) =>
  patchApiData<AdminSopCheck>(
    ADMIN_BASE,
    `/sop-checks/${encodeURIComponent(String(checkId))}`,
    payload,
  );

export const deleteAdminSopCheck = (checkId: string | number) =>
  deleteApiData<unknown>(
    ADMIN_BASE,
    `/sop-checks/${encodeURIComponent(String(checkId))}`,
  );

export const getAdminPriceGuidelines = () =>
  getApiData<PaginatedList<AdminPriceGuideline> | AdminPriceGuideline[]>(
    ADMIN_BASE,
    "/price-guidelines",
  );

export const upsertAdminPriceGuideline = (payload: {
  category_id: number | null;
  grade: ItemGrade;
  min_pct: number;
  max_pct: number;
}) => postApiData<AdminPriceGuideline>(ADMIN_BASE, "/price-guidelines", payload);

export const deleteAdminPriceGuideline = (id: string | number) =>
  deleteApiData<unknown>(
    ADMIN_BASE,
    `/price-guidelines/${encodeURIComponent(String(id))}`,
  );

export const getAdminShippingRates = () =>
  getApiData<PaginatedList<AdminShippingRate> | AdminShippingRate[]>(
    ADMIN_BASE,
    "/shipping-rates",
  );

export const createAdminShippingRate = (payload: {
  origin_region_id: number | null;
  zona: "dalam_kota" | "jawa_barat" | "luar_jawa_barat";
  berat_min_g: number;
  berat_max_g: number;
  tarif_idr: number;
  aktif: boolean;
}) => postApiData<AdminShippingRate>(ADMIN_BASE, "/shipping-rates", payload);

export const updateAdminShippingRate = (
  id: string | number,
  payload: Partial<{
    origin_region_id: number | null;
    zona: "dalam_kota" | "jawa_barat" | "luar_jawa_barat";
    berat_min_g: number;
    berat_max_g: number;
    tarif_idr: number;
    aktif: boolean;
  }>,
) =>
  patchApiData<AdminShippingRate>(
    ADMIN_BASE,
    `/shipping-rates/${encodeURIComponent(String(id))}`,
    payload,
  );

export const deleteAdminShippingRate = (id: string | number) =>
  deleteApiData<unknown>(
    ADMIN_BASE,
    `/shipping-rates/${encodeURIComponent(String(id))}`,
  );
