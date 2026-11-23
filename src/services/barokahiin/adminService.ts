import {
  ADMIN_BASE,
  createIdempotencyKey,
  getApiData,
  patchApiData,
  postApiData,
  putApiData,
} from "./apiClient";
import type {
  AddressCheckCode,
  AdminAuditLog,
  AdminDashboardData,
  CharityDisbursement,
  CharityProgram,
  ConsoleDispute,
  ConsoleItem,
  CoordinatorSanction,
  CoordinatorStore,
  CoordinatorSummary,
  LedgerReconciliation,
  PaginatedList,
  PayoutRecord,
  SplitScheme,
  StaticPageRecord,
  StoreAddress,
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
    region_ids: Array<number | string>;
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

// --- 3.3 Disputes, Payouts, Ledger, Charity, & Config ---

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

export const approveAdminProgram = (uuid: string) =>
  postApiData<CharityProgram>(
    ADMIN_BASE,
    `/programs/${encodeURIComponent(uuid)}/approve`,
  );

export const allocateAdminPool = (
  payload: {
    region_id: number | string;
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
