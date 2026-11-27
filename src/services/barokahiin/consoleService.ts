import {
  CONSOLE_BASE,
  createIdempotencyKey,
  getApiData,
  patchApiData,
  postApiData,
  putApiData,
  uploadApiForm,
} from "./apiClient";
import type {
  BarokahiinMedia,
  CharityDisbursement,
  CharityProgram,
  ConsoleDashboardData,
  ConsoleDispute,
  ConsoleDonor,
  ConsoleItem,
  ConsoleOrder,
  ConsoleWalletSummary,
  CoordinatorStore,
  ItemGrade,
  ItemJalur,
  ItemSopResponse,
  MediaOwnerType,
  PaginatedList,
  PayoutRecord,
  StoreAddress,
  StoreScore,
  WalletLedgerEntry,
} from "./types";

// --- 2.1 Dashboard, Store, & Verified Address ---

export const getConsoleDashboard = () =>
  getApiData<ConsoleDashboardData>(CONSOLE_BASE, "/dashboard");

export const getConsoleStore = () =>
  getApiData<CoordinatorStore>(CONSOLE_BASE, "/store");

export const updateConsoleStore = (payload: {
  nama?: string;
  deskripsi?: string;
  kebijakan_tambahan?: string;
  jam_operasional?: string | Record<string, string>;
}) => patchApiData<CoordinatorStore>(CONSOLE_BASE, "/store", payload);

export const submitStoreAddress = (payload: {
  jalan_nomor: string;
  rt_rw: string;
  province_code?: string;
  regency_code?: string;
  district_code?: string;
  village_code: string;
  wilayah_code?: string;
  kode_pos: string;
  patokan: string;
  lat: number;
  lng: number;
  jenis_tempat: "rumah" | "ruko" | "gudang";
  status_penguasaan: "milik" | "sewa" | "pinjam";
  foto_media_ids?: Array<number | string>;
  bukti_ref: string;
  kontak_toko: string;
}) =>
  postApiData<StoreAddress>(CONSOLE_BASE, "/store/address/submit", payload);

export const pauseConsoleStore = (days: number) =>
  postApiData<CoordinatorStore>(CONSOLE_BASE, "/store/pause", { days });

export const resumeConsoleStore = () =>
  postApiData<CoordinatorStore>(CONSOLE_BASE, "/store/resume");

export const getConsoleStoreScore = () =>
  getApiData<StoreScore>(CONSOLE_BASE, "/store/score");

// --- 2.2 Donors & Consents ---

export const getConsoleDonors = (
  params: { q?: string; page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<ConsoleDonor> | ConsoleDonor[]>(
    CONSOLE_BASE,
    "/donors",
    params,
  );

export const getConsoleDonor = (uuid: string) =>
  getApiData<ConsoleDonor>(
    CONSOLE_BASE,
    `/donors/${encodeURIComponent(uuid)}`,
  );

export const createConsoleDonor = (payload: {
  province_code?: string;
  regency_code?: string;
  district_code?: string;
  village_code: string;
  wilayah_code?: string;
  nama: string;
  kontak: string;
  anonim: boolean;
  catatan?: string;
}) => postApiData<ConsoleDonor>(CONSOLE_BASE, "/donors", payload);

export const addConsoleDonorConsent = (
  uuid: string,
  payload: {
    jenis: "jual" | "publikasi_media";
    bukti_ref: string;
  },
) =>
  postApiData<ConsoleDonor>(
    CONSOLE_BASE,
    `/donors/${encodeURIComponent(uuid)}/consents`,
    payload,
  );

export const anonymizeConsoleDonor = (uuid: string) =>
  postApiData<ConsoleDonor>(
    CONSOLE_BASE,
    `/donors/${encodeURIComponent(uuid)}/anonymize`,
  );

// --- 2.3 Items, Media, & Dynamic SOP ---

export const getConsoleItems = (
  params: {
    status?: string;
    q?: string;
    page?: number;
    per_page?: number;
  } = {},
) =>
  getApiData<PaginatedList<ConsoleItem> | ConsoleItem[]>(
    CONSOLE_BASE,
    "/items",
    params,
  );

export const getConsoleItem = (uuid: string) =>
  getApiData<ConsoleItem>(CONSOLE_BASE, `/items/${encodeURIComponent(uuid)}`);

export interface CreateConsoleItemPayload {
  donor_uuid: string;
  category_id: number | string;
  jalur: ItemJalur;
  charity_program_id?: number | string | null;
  province_code?: string;
  regency_code?: string;
  district_code?: string;
  village_code?: string;
  wilayah_code?: string;
  daerah_id?: number | string | null;
  desa_id?: number | string | null;
  kelompok_id?: number | string | null;
  grade: ItemGrade;
  judul: string;
  keterangan: string;
  kekurangan: string;
  weight_g: number;
  dim_l_cm: number;
  dim_w_cm: number;
  dim_h_cm: number;
  ref_new_price_idr: number;
  price_idr: number;
  lokasi_penyimpanan: string;
  serial_imei?: string;
}

export const createConsoleItem = (payload: CreateConsoleItemPayload) =>
  postApiData<ConsoleItem>(CONSOLE_BASE, "/items", payload);

export const updateConsoleItem = (
  uuid: string,
  payload: Partial<CreateConsoleItemPayload> & { version: number },
) =>
  patchApiData<ConsoleItem>(
    CONSOLE_BASE,
    `/items/${encodeURIComponent(uuid)}`,
    payload,
  );

export const uploadConsoleMedia = (
  params: {
    owner_type: MediaOwnerType;
    owner_uuid: string;
    tipe: "foto" | "video";
    file: File;
    alt?: string;
    urutan?: number;
    check_id?: string | number;
    durasi_dtk?: number;
    is_cover?: boolean;
  },
  onProgress?: (percent: number) => void,
) => {
  const formData = new FormData();
  formData.append("owner_type", params.owner_type);
  formData.append("owner_uuid", params.owner_uuid);
  formData.append("tipe", params.tipe);
  formData.append("file", params.file);
  if (params.alt) formData.append("alt", params.alt);
  if (params.urutan !== undefined) formData.append("urutan", String(params.urutan));
  if (params.check_id !== undefined) {
    formData.append("check_id", String(params.check_id));
  }
  if (params.durasi_dtk !== undefined) {
    formData.append("durasi_dtk", String(params.durasi_dtk));
  }
  if (params.is_cover !== undefined) {
    formData.append("is_cover", params.is_cover ? "1" : "0");
  }
  return uploadApiForm<BarokahiinMedia>(
    CONSOLE_BASE,
    "/media/uploads",
    formData,
    onProgress,
  );
};

export const getConsoleItemSop = (uuid: string) =>
  getApiData<ItemSopResponse>(
    CONSOLE_BASE,
    `/items/${encodeURIComponent(uuid)}/sop`,
  );

export const updateConsoleItemSopCheck = (
  uuid: string,
  checkCode: string,
  payload: {
    nilai: boolean | string | number;
    media_id?: number | string | null;
    teks_keterbukaan?: string | null;
  },
) =>
  putApiData<ItemSopResponse>(
    CONSOLE_BASE,
    `/items/${encodeURIComponent(uuid)}/sop/${encodeURIComponent(checkCode)}`,
    payload,
  );

export const submitConsoleItem = (uuid: string) =>
  postApiData<ConsoleItem>(
    CONSOLE_BASE,
    `/items/${encodeURIComponent(uuid)}/submit`,
  );

export const withdrawConsoleItem = (uuid: string, alasan?: string) =>
  postApiData<ConsoleItem>(
    CONSOLE_BASE,
    `/items/${encodeURIComponent(uuid)}/withdraw`,
    alasan ? { alasan } : {},
  );

export const republishConsoleItem = (uuid: string) =>
  postApiData<ConsoleItem>(
    CONSOLE_BASE,
    `/items/${encodeURIComponent(uuid)}/republish`,
  );

export const acceptPriceSuggestion = (
  itemUuid: string,
  suggestionUuid: string,
) =>
  postApiData<ConsoleItem>(
    CONSOLE_BASE,
    `/items/${encodeURIComponent(itemUuid)}/price-suggestions/${encodeURIComponent(suggestionUuid)}/accept`,
  );

// --- 2.4 Orders & Disputes ---

export const getConsoleOrders = (
  params: { status?: string; page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<ConsoleOrder> | ConsoleOrder[]>(
    CONSOLE_BASE,
    "/orders",
    params,
  );

export const prepareConsoleOrder = (uuid: string) =>
  postApiData<ConsoleOrder>(
    CONSOLE_BASE,
    `/orders/${encodeURIComponent(uuid)}/prepare`,
  );

export const readyForPickupConsoleOrder = (uuid: string) =>
  postApiData<ConsoleOrder>(
    CONSOLE_BASE,
    `/orders/${encodeURIComponent(uuid)}/ready-for-pickup`,
  );

export const verifyPickupConsoleOrder = (uuid: string, kode_ambil: string) =>
  postApiData<ConsoleOrder>(
    CONSOLE_BASE,
    `/orders/${encodeURIComponent(uuid)}/verify-pickup`,
    { kode_ambil },
  );

export const shipConsoleOrder = (
  uuid: string,
  payload: {
    kurir: string;
    resi: string;
    bukti_kemas_media_id: number | string;
  },
) =>
  postApiData<ConsoleOrder>(
    CONSOLE_BASE,
    `/orders/${encodeURIComponent(uuid)}/ship`,
    payload,
  );

export const replyConsoleDispute = (uuid: string, pesan: string) =>
  postApiData<ConsoleDispute>(
    CONSOLE_BASE,
    `/disputes/${encodeURIComponent(uuid)}/messages`,
    { pesan },
  );

// --- 2.5 Wallet, Payouts, & Charity ---

export const getConsoleWallet = () =>
  getApiData<ConsoleWalletSummary>(CONSOLE_BASE, "/wallet");

export const getConsoleWalletEntries = (
  params: { page?: number; per_page?: number } = {},
) =>
  getApiData<PaginatedList<WalletLedgerEntry> | WalletLedgerEntry[]>(
    CONSOLE_BASE,
    "/wallet/entries",
    params,
  );

export const updateWalletCharityShare = (payload: {
  charity_share_pct: number;
  charity_program_id?: number | string | null;
}) =>
  patchApiData<ConsoleWalletSummary>(
    CONSOLE_BASE,
    "/wallet/charity-share",
    payload,
  );

export const requestConsolePayout = (
  jumlah_idr: number,
  idempotencyKey = createIdempotencyKey("payout"),
) =>
  postApiData<PayoutRecord>(
    CONSOLE_BASE,
    "/payouts",
    { jumlah_idr },
    { idempotencyKey },
  );

export const createConsoleProgram = (payload: {
  judul: string;
  tujuan: string;
  penerima_manfaat?: string;
  penerima_manfaat_desc: string;
  province_code?: string;
  regency_code: string;
  district_code?: string;
  village_code?: string;
  wilayah_code?: string;
  periode_mulai: string;
  periode_selesai: string;
  target_idr: number;
  rencana_anggaran: string;
}) => postApiData<CharityProgram>(CONSOLE_BASE, "/programs", payload);

export const requestProgramDisbursement = (
  programUuid: string,
  payload: { jumlah_idr: number; keperluan: string },
) =>
  postApiData<CharityDisbursement>(
    CONSOLE_BASE,
    `/programs/${encodeURIComponent(programUuid)}/disbursements`,
    payload,
  );

export const submitProgramReport = (
  programUuid: string,
  payload: {
    ringkasan: string;
    total_terpakai_idr: number;
    bukti_media_ids?: Array<number | string>;
    bukti_ref?: string;
  },
) =>
  postApiData<CharityProgram>(
    CONSOLE_BASE,
    `/programs/${encodeURIComponent(programUuid)}/reports`,
    payload,
  );
