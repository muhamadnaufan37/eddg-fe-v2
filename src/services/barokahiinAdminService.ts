import { axiosServices } from "@/services/axios";

const adminPath = "/api/v1/barokahiin/admin";

export interface AdminPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminList<T> {
  items: T[];
  pagination?: AdminPagination;
}

export interface BarokahiinDashboard {
  barang_per_status: Record<string, number>;
  antrean_permintaan_baru: number;
  menunggu_pembayaran: number;
  dana_bulan_ini_rupiah: number;
}

export interface AuditLog {
  id: number;
  aktor_id: number | null;
  aksi: string;
  target_type: string | null;
  target_id: string | number | null;
  sebelum: Record<string, unknown> | null;
  sesudah: Record<string, unknown> | null;
  waktu: string;
  actor?: { id: number; nama_lengkap: string; username: string } | null;
}

export interface BarokahiinDonor {
  uuid: string;
  nama: string;
  kontak?: string | null;
  wilayah?: string | null;
  preferensi_anonim?: boolean;
  catatan?: string | null;
  dianonimkan_pada?: string | null;
  has_jual_consent?: boolean;
  has_media_consent?: boolean;
  duplicate_warning?: string;
  created_at?: string;
  items?: Array<{
    uuid: string;
    kode_barang: string;
    nama_internal: string;
    status: string;
    harga_rupiah: number | null;
    created_at: string;
  }>;
}

export interface BarokahiinCategory {
  id?: number;
  uuid: string;
  nama: string;
  slug: string;
  urutan: number;
  aktif: boolean;
}

export interface BarokahiinMedia {
  uuid: string;
  tipe: "foto" | "video";
  url: string;
  urutan: number;
  alt?: string | null;
  status_proses?: string;
  ukuran?: number | null;
  exif_stripped?: boolean;
  is_cover?: boolean;
  thumbnail_url?: string | null;
}

export interface BarokahiinItem {
  uuid: string;
  kode_barang: string;
  slug?: string | null;
  nama_internal: string;
  judul_publik?: string | null;
  keterangan_publik?: string | null;
  kekurangan?: string | null;
  catatan_internal?: string | null;
  kondisi_grade?: "sangat_baik" | "baik" | "cukup" | null;
  spesifikasi?: string | null;
  harga_rupiah?: number | null;
  jumlah?: number;
  stok_tersedia?: number;
  cara_terima?: "diantar" | "dijemput";
  lokasi_penyimpanan?: string | null;
  checklist_kurasi?: {
    kebersihan?: boolean;
    fungsi?: boolean;
    kelengkapan?: boolean;
    foto_memadai?: boolean;
  } | null;
  status: string;
  alasan_tolak?: string | null;
  cover_media_id?: number | null;
  cover_url?: string | null;
  diterbitkan_pada?: string | null;
  donor?: { uuid: string; nama: string } | null;
  kategori?: { uuid: string; nama: string } | null;
  kegiatan?: { uuid: string; judul: string } | null;
  created_at: string;
  media?: BarokahiinMedia[];
  status_histories?: Array<{
    dari: string | null;
    ke: string;
    oleh: string | null;
    alasan: string | null;
    waktu: string;
  }>;
  publish_readiness_errors?: string[];
}

export interface PurchaseRequest {
  uuid: string;
  status: string;
  nama_pembeli: string;
  kontak_pembeli: string;
  jumlah: number;
  harga_terkunci_rupiah?: number | null;
  catatan?: string | null;
  catatan_internal?: string | null;
  alasan_tolak_batal?: string | null;
  batas_bayar_pada?: string | null;
  dikonfirmasi_pada?: string | null;
  dibayar_pada?: string | null;
  selesai_pada?: string | null;
  item?: {
    uuid: string;
    kode_barang: string;
    judul_publik: string | null;
    status: string;
  } | null;
  created_at: string;
}

export interface SaleRecord {
  uuid: string;
  request_id?: string | null;
  item_id?: number | null;
  nominal_rupiah: number;
  metode?: string | null;
  dibayar_pada?: string | null;
  bukti_ref?: string | null;
  jenis: "penjualan" | "koreksi";
  alasan_koreksi?: string | null;
}

export interface SalesReport {
  total_nominal_rupiah: number;
  total_transaksi_penjualan: number;
  total_catatan_koreksi: number;
  per_kategori: Array<{
    kategori: string;
    jumlah_catatan: number;
    total_nominal: number;
  }>;
}

export interface BarokahiinActivity {
  id?: number;
  uuid: string;
  judul: string;
  slug: string;
  deskripsi: string;
  target_dana: number;
  periode?: string | null;
  status: "draft" | "aktif" | "selesai" | "ditarik";
  diterbitkan_pada?: string | null;
  media?: BarokahiinActivityMedia[];
}

export interface BarokahiinActivityMedia {
  uuid: string;
  tipe: "foto" | "video";
  url: string;
  keterangan?: string | null;
  alt?: string | null;
  urutan?: number;
  has_person_consent?: boolean;
  is_child_safe?: boolean;
  thumbnail_url?: string | null;
}

export interface BarokahiinPage {
  kunci: string;
  judul: string;
  isi: string;
  diterbitkan?: boolean;
}

export interface BarokahiinSettings {
  rekening_resmi_bank: string;
  rekening_resmi_nomor: string;
  rekening_resmi_atas_nama: string;
  whatsapp_resmi: string;
  label_anonim: string;
  batas_bayar_jam: number;
  lokasi_pengambilan: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

async function getData<T>(path: string, params?: Record<string, unknown>) {
  const query = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => {
      return (
        value !== undefined &&
        value !== null &&
        (typeof value !== "string" || value.trim() !== "")
      );
    }),
  );
  const response = await axiosServices().get<ApiEnvelope<T>>(
    `${adminPath}${path}`,
    { params: query },
  );
  return response.data.data;
}

async function postData<T>(path: string, payload?: unknown) {
  const response = await axiosServices().post<ApiEnvelope<T>>(
    `${adminPath}${path}`,
    payload,
  );
  return response.data.data;
}

async function patchData<T>(path: string, payload: unknown) {
  const response = await axiosServices().patch<ApiEnvelope<T>>(
    `${adminPath}${path}`,
    payload,
  );
  return response.data.data;
}

export const getBarokahiinDashboard = () =>
  getData<BarokahiinDashboard>("/dashboard");

export const getAuditLogs = (params: { page?: number; per_page?: number } = {}) =>
  getData<AdminList<AuditLog>>("/audit-logs", params);

export const getDonors = (params: {
  q?: string;
  wilayah?: string;
  page?: number;
  per_page?: number;
} = {}) => getData<AdminList<BarokahiinDonor>>("/donors", params);

export const createDonor = (payload: Partial<BarokahiinDonor>) =>
  postData<BarokahiinDonor>("/donors", payload);

export const getDonor = (uuid: string) =>
  getData<BarokahiinDonor & { items: NonNullable<BarokahiinDonor["items"]> }>(
    `/donors/${encodeURIComponent(uuid)}`,
  );

export const updateDonor = (
  uuid: string,
  payload: Partial<BarokahiinDonor>,
) => patchData<BarokahiinDonor>(`/donors/${encodeURIComponent(uuid)}`, payload);

export const addDonorConsent = (
  uuid: string,
  payload: {
    jenis: "jual" | "publikasi_media";
    bentuk_bukti: "tertulis" | "digital" | "lisan_terekam";
    diberikan_pada?: string;
    catatan?: string;
  },
) =>
  postData<BarokahiinDonor>(
    `/donors/${encodeURIComponent(uuid)}/consents`,
    payload,
  );

export const anonymizeDonor = (uuid: string) =>
  postData<BarokahiinDonor>(
    `/donors/${encodeURIComponent(uuid)}/anonymize`,
  );

export const getCategories = () =>
  getData<BarokahiinCategory[]>("/categories");

export const createCategory = (payload: {
  nama: string;
  urutan?: number;
  aktif?: boolean;
}) => postData<BarokahiinCategory>("/categories", payload);

export const updateCategory = (
  uuid: string,
  payload: Partial<BarokahiinCategory>,
) =>
  patchData<BarokahiinCategory>(
    `/categories/${encodeURIComponent(uuid)}`,
    payload,
  );

export const getItems = (params: {
  status?: string;
  kategori_uuid?: string;
  donor_uuid?: string;
  q?: string;
  page?: number;
  per_page?: number;
} = {}) => getData<AdminList<BarokahiinItem>>("/items", params);

export const createItem = (payload: Partial<BarokahiinItem> & {
  donor_uuid?: string;
  kategori_uuid?: string;
}) => postData<BarokahiinItem>("/items", payload);

export const getItem = (uuid: string) =>
  getData<BarokahiinItem>(`/items/${encodeURIComponent(uuid)}`);

export const updateItem = (
  uuid: string,
  payload: Partial<BarokahiinItem> & {
    donor_uuid?: string | null;
    kategori_uuid?: string | null;
  },
) =>
  patchData<BarokahiinItem>(`/items/${encodeURIComponent(uuid)}`, payload);

export const transitionItem = (
  uuid: string,
  status: string,
  alasan?: string,
) =>
  postData<BarokahiinItem>(
    `/items/${encodeURIComponent(uuid)}/transition`,
    { status, ...(alasan ? { alasan } : {}) },
  );

export const publishItem = (uuid: string) =>
  postData<BarokahiinItem>(`/items/${encodeURIComponent(uuid)}/publish`);

export const unpublishItem = (uuid: string, alasan?: string) =>
  postData<BarokahiinItem>(
    `/items/${encodeURIComponent(uuid)}/unpublish`,
    alasan ? { alasan } : {},
  );

export const uploadItemMedia = async (
  uuid: string,
  payload: FormData,
) => {
  const response = await axiosServices().post<ApiEnvelope<BarokahiinMedia>>(
    `${adminPath}/items/${encodeURIComponent(uuid)}/media`,
    payload,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data.data;
};

export const updateItemMedia = (
  mediaUuid: string,
  payload: { urutan?: number; alt?: string; is_cover?: boolean },
) =>
  patchData<BarokahiinMedia>(
    `/media/${encodeURIComponent(mediaUuid)}`,
    payload,
  );

export const deleteItemMedia = async (mediaUuid: string) => {
  const response = await axiosServices().delete(
    `${adminPath}/media/${encodeURIComponent(mediaUuid)}`,
  );
  return response.data;
};

export const getPurchaseRequests = (params: {
  status?: string;
  item_uuid?: string;
  page?: number;
  per_page?: number;
} = {}) => getData<AdminList<PurchaseRequest> & { new_requests_count?: number }>(
  "/purchase-requests",
  params,
);

export const getPurchaseRequest = (uuid: string) =>
  getData<PurchaseRequest>(`/purchase-requests/${encodeURIComponent(uuid)}`);

export const updatePurchaseNotes = (uuid: string, catatan_internal: string) =>
  patchData<PurchaseRequest>(
    `/purchase-requests/${encodeURIComponent(uuid)}/notes`,
    { catatan_internal },
  );

export const confirmPurchaseRequest = (uuid: string) =>
  postData<PurchaseRequest>(
    `/purchase-requests/${encodeURIComponent(uuid)}/confirm`,
  );

export const recordPurchasePayment = (
  uuid: string,
  payload: {
    metode: "transfer" | "qris_manual" | "tunai";
    nominal_rupiah: number;
    bukti_ref?: string;
    alasan_selisih?: string;
  },
) =>
  postData<PurchaseRequest>(
    `/purchase-requests/${encodeURIComponent(uuid)}/payment`,
    payload,
  );

export const fulfillPurchaseRequest = (uuid: string) =>
  postData<PurchaseRequest>(
    `/purchase-requests/${encodeURIComponent(uuid)}/fulfill`,
  );

export const cancelPurchaseRequest = (uuid: string, alasan: string) =>
  postData<PurchaseRequest>(
    `/purchase-requests/${encodeURIComponent(uuid)}/cancel`,
    { alasan },
  );

export const rejectPurchaseRequest = (uuid: string, alasan: string) =>
  postData<PurchaseRequest>(
    `/purchase-requests/${encodeURIComponent(uuid)}/reject`,
    { alasan },
  );

export const getSales = (params: {
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
} = {}) => getData<AdminList<SaleRecord>>("/sales", params);

export const createSalesCorrection = (payload: {
  item_uuid: string;
  request_uuid?: string;
  nominal_rupiah: number;
  alasan_koreksi: string;
  bukti_ref?: string;
}) => postData<SaleRecord>("/sales/corrections", payload);

export const getSalesReport = (params: {
  start_date?: string;
  end_date?: string;
} = {}) => getData<SalesReport>("/reports/sales", params);

export const getActivities = () =>
  getData<BarokahiinActivity[]>("/activities");

export const createActivity = (
  payload: Pick<
    BarokahiinActivity,
    "judul" | "deskripsi" | "target_dana" | "status"
  > & { periode?: string | null },
) => postData<BarokahiinActivity>("/activities", payload);

export const updateActivity = (
  uuid: string,
  payload: Partial<BarokahiinActivity>,
) =>
  patchData<BarokahiinActivity>(
    `/activities/${encodeURIComponent(uuid)}`,
    payload,
  );

export const uploadActivityMedia = async (
  uuid: string,
  payload: FormData,
) => {
  const response = await axiosServices().post<
    ApiEnvelope<BarokahiinActivityMedia>
  >(
    `${adminPath}/activities/${encodeURIComponent(uuid)}/media`,
    payload,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data.data;
};

export const deleteActivityMedia = async (mediaUuid: string) => {
  const response = await axiosServices().delete(
    `${adminPath}/activity-media/${encodeURIComponent(mediaUuid)}`,
  );
  return response.data;
};

export const addActivityExpense = (
  uuid: string,
  payload: {
    pos: string;
    nominal_rupiah: number;
    tanggal: string;
    keterangan?: string;
    bukti_ref?: string;
    disetujui_publik?: boolean;
  },
) =>
  postData<unknown>(
    `/activities/${encodeURIComponent(uuid)}/expenses`,
    payload,
  );

export const getStaticPages = () =>
  getData<BarokahiinPage[]>("/pages");

export const saveStaticPage = (payload: {
  kunci: string;
  judul: string;
  isi: string;
  diterbitkan?: boolean;
}) => {
  return axiosServices()
    .put<ApiEnvelope<BarokahiinPage>>(`${adminPath}/pages`, payload)
    .then((response) => response.data.data);
};

export const getBarokahiinSettings = () =>
  getData<BarokahiinSettings>("/settings");

export const updateBarokahiinSettings = (
  payload: Partial<BarokahiinSettings>,
) => patchData<BarokahiinSettings>("/settings", payload);
