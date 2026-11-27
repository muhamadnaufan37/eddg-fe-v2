export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedList<T> {
  items: T[];
  pagination?: PaginationMeta;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[]>;
  };
}

export interface ParsedApiError {
  status?: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// --- Coordinator & Store ---

export type CoordinatorStatus =
  | "diajukan"
  | "dalam_verifikasi"
  | "perlu_perbaikan"
  | "disetujui"
  | "aktif"
  | "dibatasi"
  | "ditangguhkan"
  | "ditolak";

export type StoreStatus =
  | "belum_verifikasi"
  | "aktif"
  | "dijeda"
  | "dibatasi"
  | "ditangguhkan"
  | "ditutup";

export type StoreAddressStatus =
  | "belum_diajukan"
  | "diajukan"
  | "dalam_verifikasi"
  | "perlu_perbaikan"
  | "terverifikasi"
  | "ditolak";

export type AddressCheckCode =
  | "V1"
  | "V2"
  | "V3"
  | "V4"
  | "V5"
  | "V6"
  | "V7"
  | "V8";

export interface StoreAddressCheck {
  kode: AddressCheckCode;
  lulus: boolean;
  catatan?: string | null;
  checked_at?: string | null;
}

export interface StoreAddress {
  uuid: string;
  status: StoreAddressStatus;
  jalan_nomor: string;
  rt_rw: string;
  region_id: number | string;
  region_name?: string | null;
  kode_pos: string;
  patokan: string;
  lat: number | null;
  lng: number | null;
  jenis_tempat: "rumah" | "ruko" | "gudang";
  status_penguasaan: "milik" | "sewa" | "pinjam";
  kontak_toko: string;
  bukti_ref?: string | null;
  foto_media_ids?: Array<number | string>;
  media?: BarokahiinMedia[];
  checks?: StoreAddressCheck[];
  alasan_tolak?: string | null;
  jadwal_verifikasi?: string | null;
  verified_at?: string | null;
  reverify_due_at?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface StoreScoreComponents {
  sla: number;
  komplain: number;
  rating: number;
  audit: number;
  kelengkapan: number;
}

export interface StoreScore {
  score: number | null;
  completed_orders_90d?: number;
  level: 1 | 2 | 3;
  components?: StoreScoreComponents;
  next_level_requirements?: string[];
  warnings?: string[];
}

export interface CoordinatorStore {
  uuid: string;
  nama: string;
  slug?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  deskripsi?: string | null;
  kebijakan_tambahan?: string | null;
  jam_operasional?: string | Record<string, string> | null;
  status: StoreStatus;
  moderation_status?: string | null;
  moderation_note?: string | null;
  paused_until?: string | null;
  store_score?: number | null;
  rating?: number | null;
  review_count?: number;
  region_name?: string | null;
  active_items_count?: number;
  active_items_limit?: number;
  charity_items_count?: number;
  address_verified?: boolean;
  active_address?: StoreAddress | null;
  pending_address?: StoreAddress | null;
  addresses?: StoreAddress[];
  coordinator?: {
    uuid: string;
    nama?: string;
    level?: 1 | 2 | 3;
    status?: CoordinatorStatus;
  } | null;
}

export interface CoordinatorSummary {
  uuid: string;
  nama?: string;
  email?: string;
  kontak?: string;
  status: CoordinatorStatus;
  level: 1 | 2 | 3;
  is_primary?: boolean;
  regions?: Array<{ id: number | string; nama: string }>;
  store?: CoordinatorStore | null;
  sanctions?: CoordinatorSanction[];
  created_at?: string;
}

export interface CoordinatorSanction {
  uuid?: string;
  tingkat: "ringan" | "sedang" | "berat";
  jenis: string;
  alasan: string;
  mulai?: string;
  selesai?: string | null;
  created_at?: string;
}

export interface ConsoleWalletSummary {
  pending_idr: number;
  available_idr: number;
  payout_hold_idr: number;
  shipping_reimbursed_idr?: number;
  charity_share_pct: number;
  charity_program_id?: number | string | null;
  charity_program_judul?: string | null;
  min_payout_idr?: number;
  bank_account_masked?: string | null;
}

export interface ConsoleDashboardData {
  coordinator: {
    uuid?: string;
    status: CoordinatorStatus;
    level: 1 | 2 | 3;
    regions?: Array<{ id: number | string; nama: string }>;
  };
  store: {
    uuid?: string;
    nama?: string;
    status: StoreStatus;
    address_verified?: boolean;
    address_status?: StoreAddressStatus;
    store_score?: number | null;
    paused_until?: string | null;
  };
  items_by_status: Record<string, number>;
  orders_to_fulfill: ConsoleOrder[] | number | { items?: ConsoleOrder[]; count?: number };
  revision_items?: ConsoleItem[];
  price_suggestions?: PriceSuggestion[];
  wallet: ConsoleWalletSummary;
  active_sanctions?: CoordinatorSanction[];
}

// --- Donors ---

export interface DonorConsent {
  id?: number | string;
  jenis: "jual" | "publikasi_media";
  bukti_ref?: string | null;
  diberikan_pada?: string | null;
  aktif?: boolean;
}

export interface ConsoleDonor {
  uuid: string;
  region_id?: number | string;
  region_name?: string | null;
  nama: string;
  kontak?: string | null;
  anonim?: boolean;
  catatan?: string | null;
  dianonimkan_pada?: string | null;
  has_jual_consent?: boolean;
  has_media_consent?: boolean;
  consents?: DonorConsent[];
  duplicate_warning?: string | null;
  items_count?: number;
  items?: Array<{
    uuid: string;
    kode_barang: string;
    judul: string;
    status: string;
    price_idr?: number | null;
    created_at?: string;
  }>;
  created_at?: string;
}

// --- Media & Items & SOP ---

export type MediaOwnerType =
  | "item"
  | "store"
  | "store_address"
  | "program"
  | "fulfillment";

export interface BarokahiinMedia {
  id?: number | string;
  uuid: string;
  tipe: "foto" | "video";
  url: string;
  thumbnail_url?: string | null;
  alt?: string | null;
  urutan?: number;
  check_id?: string | null;
  check_code?: string | null;
  durasi_dtk?: number | null;
  is_cover?: boolean;
  exif_dihapus?: boolean;
  status_proses?: string;
}

export type ItemStatus =
  | "draft"
  | "menunggu_review"
  | "perlu_revisi"
  | "ditolak"
  | "terbit"
  | "ditahan"
  | "terjual"
  | "ditarik"
  | "disalurkan";

export type ItemGrade = "A" | "B" | "C";
export type ItemJalur = "jual" | "charity" | "salurkan";

export interface PriceSuggestion {
  uuid: string;
  item_uuid?: string;
  item_kode?: string;
  item_judul?: string;
  current_price_idr: number;
  suggested_price_idr: number;
  discount_pct?: number;
  age_days?: number;
  reason?: string;
  status?: string;
}

export interface ConsoleItem {
  uuid: string;
  kode_barang: string;
  version?: number;
  donor_uuid?: string;
  donor?: { uuid: string; nama: string } | null;
  category_id: number | string;
  category_code?: string;
  category_name?: string;
  jalur: ItemJalur;
  charity_program_id?: number | string | null;
  charity_program?: { id?: number | string; uuid?: string; judul: string } | null;
  grade: ItemGrade;
  judul: string;
  keterangan: string;
  kekurangan: string;
  weight_g: number;
  dim_l_cm: number;
  dim_w_cm: number;
  dim_h_cm: number;
  pickup_only?: boolean;
  ref_new_price_idr: number;
  price_idr: number;
  guideline_min_idr?: number | null;
  guideline_max_idr?: number | null;
  lokasi_penyimpanan?: string | null;
  serial_imei?: string | null;
  status: ItemStatus;
  sop_version?: string | number | null;
  alasan_tolak?: string | null;
  revision_notes?: Record<string, string> | null;
  cover_url?: string | null;
  media?: BarokahiinMedia[];
  check_results?: SopCheckItem[];
  checkResults?: SopCheckItem[];
  price_suggestions?: PriceSuggestion[];
  store?: { uuid?: string; nama?: string; region_name?: string } | null;
  coordinator?: { uuid?: string; nama?: string; level?: number } | null;
  review?: {
    rating?: number | null;
    rating_barang?: number | null;
    rating_layanan?: number | null;
    komentar?: string | null;
    teks?: string | null;
    created_at?: string | null;
  } | null;
  order?: {
    uuid?: string;
    kode_pesanan?: string;
    status?: string;
    review?: {
      rating?: number | null;
      rating_barang?: number | null;
      rating_layanan?: number | null;
      komentar?: string | null;
      teks?: string | null;
      created_at?: string | null;
    } | null;
  } | null;
  submitted_at?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SopCheckItem {
  id?: number | string;
  code: string;
  kode?: string;
  pertanyaan: string;
  tipe_bukti?: "centang" | "foto" | "video" | "teks" | "angka" | "sistem" | string;
  wajib?: boolean;
  tindakan_gagal?: "perbaiki" | "tolak" | "keterbukaan" | string;
  nilai?: boolean | string | number | null;
  lulus?: boolean | null;
  media_id?: number | string | null;
  media_url?: string | null;
  teks_keterbukaan?: string | null;
  catatan_reviewer?: string | null;
  panduan_sudut?: string | null;
}

export interface ItemSopResponse {
  item_uuid?: string;
  sop_version?: string | number;
  checks: SopCheckItem[];
  gate_errors: string[];
  passed_count?: number;
  total_required?: number;
  submittable?: boolean;
}

// --- Orders & Disputes ---

export type OrderStatus =
  | "menunggu_bayar"
  | "dibayar"
  | "disiapkan"
  | "siap_diambil"
  | "dikirim"
  | "diterima"
  | "selesai"
  | "komplain"
  | "refund"
  | "dibatalkan"
  | "dibatalkan_refund"
  | "kedaluwarsa";

export interface ConsoleOrder {
  uuid: string;
  kode_pesanan: string;
  status: OrderStatus;
  serah?: "ambil" | "kirim";
  metode_serah?: "ambil" | "kirim";
  sla_deadline?: string | null;
  sla_remaining_hours?: number | null;
  buyer_name_masked?: string | null;
  buyer_phone_masked?: string | null;
  shipping_address_summary?: string | null;
  alamat_snapshot_enc?: string | null;
  pickup_code?: string | null;
  kurir?: string | null;
  resi?: string | null;
  bukti_kemas_url?: string | null;
  fulfillment?: {
    kurir?: string | null;
    resi?: string | null;
    pickup_code?: string | null;
    ambil_deadline?: string | null;
    bukti_kemas_url?: string | null;
  } | null;
  subtotal_idr: number;
  shipping_idr: number;
  packaging_idr: number;
  rounding_charity_idr?: number;
  total_idr: number;
  items?: Array<{
    uuid: string;
    kode_barang: string;
    judul: string;
    price_idr: number;
    grade?: ItemGrade;
    cover_url?: string | null;
  }>;
  review?: {
    rating?: number | null;
    rating_barang?: number | null;
    rating_layanan?: number | null;
    komentar?: string | null;
    teks?: string | null;
    created_at?: string | null;
  } | null;
  penerima?: {
    nama?: string | null;
    kontak?: string | null;
    telepon?: string | null;
    no_hp?: string | null;
  } | null;
  alamat?: {
    jalan_nomor?: string | null;
    alamat_lengkap?: string | null;
    rt_rw?: string | null;
    kelurahan?: string | null;
    kecamatan?: string | null;
    kabupaten?: string | null;
    provinsi?: string | null;
    kode_pos?: string | null;
    patokan?: string | null;
    ringkas?: string | null;
  } | null;
  payments?: Array<{
    uuid?: string;
    status?: string;
    metode?: string | null;
    channel?: string | null;
    amount_idr?: number | null;
    paid_at?: string | null;
    created_at?: string | null;
  }>;
  disputes?: ConsoleDispute[];
  timeline?: Array<{
    status?: string;
    label?: string;
    keterangan?: string | null;
    timestamp?: string | null;
    waktu?: string | null;
    at?: string | null;
  }>;
  paid_at?: string | null;
  prepared_at?: string | null;
  shipped_at?: string | null;
  received_at?: string | null;
  created_at?: string;
}

export interface DisputeMessage {
  id?: number | string;
  sender_role: "pembeli" | "koordinator" | "admin" | string;
  sender_name?: string;
  pesan: string;
  media?: BarokahiinMedia[];
  created_at: string;
}

export interface ConsoleDispute {
  uuid: string;
  order_uuid?: string;
  order_code?: string;
  status: "terbuka" | "ditanggapi" | "diputus" | "selesai" | string;
  alasan: string;
  keterangan?: string | null;
  response_deadline?: string | null;
  putusan?: "tolak" | "refund_sebagian" | "refund_penuh" | null;
  nominal_refund_idr?: number | null;
  kelalaian_koordinator?: boolean;
  biaya_retur_idr?: number | null;
  catatan_putusan?: string | null;
  messages?: DisputeMessage[];
  media?: BarokahiinMedia[];
  created_at?: string;
}

// --- Wallet & Payouts ---

export interface WalletLedgerEntry {
  id?: number | string;
  uuid?: string;
  jenis: string;
  keterangan?: string | null;
  order_code?: string | null;
  amount_idr: number;
  bucket?: "PENDING" | "AVAILABLE" | "PAYOUT_HOLD" | string;
  created_at: string;
}

export interface PayoutRecord {
  uuid: string;
  coordinator_uuid?: string;
  coordinator_name?: string;
  bank_name?: string;
  account_number_masked?: string;
  account_holder?: string;
  jumlah_idr: number;
  status: "diajukan" | "diproses" | "selesai" | "ditolak" | string;
  bukti_ref?: string | null;
  alasan_tolak?: string | null;
  created_at: string;
  processed_at?: string | null;
}

// --- Charity Programs ---

export type ProgramStatus =
  | "diajukan"
  | "disetujui"
  | "berjalan"
  | "selesai"
  | "dilaporkan"
  | "ditolak";

export interface CharityDisbursement {
  uuid: string;
  program_uuid?: string;
  program_judul?: string;
  jumlah_idr: number;
  keperluan: string;
  status: "diajukan" | "disetujui" | "dicairkan" | "ditolak" | string;
  bukti_ref?: string | null;
  created_at?: string;
}

export interface CharityProgram {
  id?: number | string;
  uuid: string;
  judul: string;
  tujuan: string;
  penerima_manfaat: string;
  region_id?: number | string;
  region_name?: string | null;
  coordinator_name?: string | null;
  periode_mulai?: string | null;
  periode_selesai?: string | null;
  target_idr: number;
  terkumpul_idr: number;
  wallet_balance_idr?: number;
  rencana_anggaran?: string | null;
  status: ProgramStatus;
  report_due_at?: string | null;
  report_overdue?: boolean;
  disbursements?: CharityDisbursement[];
  reports?: Array<{
    uuid?: string;
    ringkasan?: string;
    total_terpakai_idr?: number;
    status?: string;
    created_at?: string;
  }>;
  created_at?: string;
}

// --- Admin Specific ---

export interface AdminDashboardData {
  items_by_status: Record<string, number>;
  review_queue_count: number;
  pending_address_verifications: number;
  open_disputes: number;
  pending_payouts: number;
  ledger?: {
    balanced: boolean;
    total_entries_sum?: number;
    checked_at?: string;
  };
}

export interface LedgerReconciliation {
  balanced: boolean;
  total_entries_sum: number;
  accounts?: Array<{
    account: string;
    balance_idr: number;
  }>;
  checked_at?: string;
}

export interface SplitScheme {
  uuid?: string;
  versi?: number | string;
  nama?: string;
  cakupan?: string;
  koordinator_pct: number;
  kegiatan_pct: number;
  operasional_pct: number;
  jaminan_pct: number;
  donatur_pct: number;
  status?: "draft" | "diumumkan" | "aktif" | "arsip" | string;
  mulai_berlaku?: string | null;
  diumumkan_pada?: string | null;
  created_at?: string;
}

export interface StaticPageRecord {
  kunci: string;
  judul: string;
  isi: string;
  diterbitkan?: boolean;
  updated_at?: string;
}

export type VoucherType = "fixed" | "percent" | "free_shipping";

export interface AdminVoucher {
  uuid: string;
  code: string;
  nama: string;
  deskripsi?: string | null;
  tipe: VoucherType;
  nilai: number;
  max_discount_idr?: number | null;
  min_subtotal_idr: number;
  quota_total?: number | null;
  quota_used?: number | null;
  per_user_limit: number;
  store_id?: number | string | null;
  category_id?: number | string | null;
  is_public: boolean;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
}

export interface AdminAuditLog {
  id: number | string;
  aktor_id?: number | string | null;
  actor?: { id?: number; nama_lengkap?: string; username?: string } | null;
  aksi: string;
  target_type?: string | null;
  target_id?: string | number | null;
  sebelum?: Record<string, unknown> | null;
  sesudah?: Record<string, unknown> | null;
  alasan?: string | null;
  waktu: string;
}

// --- Master Data Admin (Section 3.4) ---

export interface AdminCategory {
  id: number | string;
  uuid: string;
  kode: string;
  nama: string;
  slug?: string | null;
  aktif?: boolean;
  terlarang?: boolean;
  aturan?: {
    pickup_only?: boolean;
    [key: string]: unknown;
  } | null;
  urutan?: number;
  created_at?: string;
}

export type SopCheckTipe = "bool" | "text" | "number";
export type SopCheckButuhBukti = "none" | "foto" | "video";
export type SopCheckOnFail = "fix" | "reject";

export interface AdminSopCheck {
  id: number | string;
  template_id?: number | string;
  kode: string;
  teks: string;
  tipe: SopCheckTipe | string;
  wajib: boolean;
  butuh_bukti: SopCheckButuhBukti | string;
  on_fail: SopCheckOnFail | string;
  urutan?: number;
}

export interface AdminSopTemplate {
  id: number | string;
  uuid?: string;
  category_id?: number | string | null;
  category_code?: string | null;
  category_name?: string | null;
  nama?: string;
  versi?: number | string;
  checks?: AdminSopCheck[];
}

export interface AdminPriceGuideline {
  id: number | string;
  category_id: number | string | null;
  category_code?: string | null;
  category_name?: string | null;
  grade: ItemGrade;
  min_pct: number;
  max_pct: number;
}

export type ShippingZona = "dalam_kota" | "jawa_barat" | "luar_jawa_barat";

export interface AdminShippingRate {
  id: number | string;
  origin_region_id?: number | string | null;
  zona: ShippingZona | string;
  berat_min_g: number;
  berat_max_g: number;
  tarif_idr: number;
  aktif?: boolean;
}

// --- 2FA TOTP (Section 4) ---

export interface TwoFactorStatus {
  enabled: boolean;
  enabled_at?: string | null;
  last_verified_at?: string | null;
  recovery_codes_remaining?: number;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpauth_uri: string;
  recovery_codes: string[];
}
