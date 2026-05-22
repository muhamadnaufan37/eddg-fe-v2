import { axiosServices } from "@/services/axios";

// ===================== Interfaces untuk Report Presensi =====================
export interface ListDataPresensiPeserta {
  current_page: number;
  data: PresensiPesertaData[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface PresensiPesertaData {
  id: number;
  nama_lengkap: string;
  kode_cari_data: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  status_sambung: number;
  status_pernikahan: boolean;
  presensi_id: number | null;
  status_presensi: string | null;
  keterangan: string | null;
  nama_daerah: string;
  nama_desa: string;
  nama_kelompok: string;
  waktu_presensi: string | null;
}

export interface DataPresensiPeserum {
  id_peserta: number;
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  status_presensi: string;
  status_sambung: number;
  status_pernikahan: boolean;
  nama_daerah: string;
  nama_desa: string;
  nama_kelompok: string;
  keterangan: string | null;
  waktu_presensi: string | null;
}

export interface Statistics {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alfa: number;
}

export interface PresensiReportResponse {
  message: string;
  category: string;
  list_data_presensi_peserta: ListDataPresensiPeserta;
  data_presensi_peserta: DataPresensiPeserum[];
  statistics: Statistics;
  success: boolean;
}

// ===================== Interfaces untuk List Presensi =====================
export interface PaginationLink {
  url?: string;
  label: string;
  page?: number;
  active: boolean;
}

export interface PresensiMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: PaginationLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface PresensiLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PresensiListItem {
  id: number;
  kd_kegiatan: number;
  nm_kegiatan: string;
  tgl_kegiatan: string;
  kd_peserta: string;
  nm_peserta: string;
  kd_petugas_input: number;
  nm_petugas_input: string;
  waktu_presensi: string;
  status_presensi: string;
  keterangan: string;
  created_at: string;
  updated_at: string;
}

export interface PresensiListResponse {
  data: PresensiListItem[];
  links: PresensiLinks;
  meta: PresensiMeta;
}

// ===================== Interfaces untuk Detail Presensi =====================
export interface PresensiDetailData {
  id: number;
  kd_kegiatan: number;
  nm_kegiatan: string;
  tgl_kegiatan: string;
  kd_peserta: string;
  nm_peserta: string;
  kd_petugas_input: number;
  nm_petugas_input: string;
  waktu_presensi: string;
  status_presensi: string;
  keterangan: string;
  created_at: string;
  updated_at: string;
}

export interface PresensiDetailResponse {
  success: boolean;
  message: string;
  data: PresensiDetailData;
}

// ===================== Interfaces untuk Create Presensi =====================
export interface CreatePresensiPayload {
  kode_kegiatan: string;
  id_peserta: string;
  add_by_petugas: string;
  category: string;
  status_presensi?: string;
  keterangan?: string;
}

export interface CreatePresensiResponse {
  success: boolean;
  message: string;
  data?: PresensiDetailData;
}

// ===================== Interfaces untuk Store by Coordinate =====================
export interface StorePresensiByCoordinatePayload {
  kode_kegiatan: string;
  id_peserta: string;
  add_by_petugas: string;
  latitude: string;
  longitude: string;
  radius_meter: number;
  category: string;
}

// ===================== Interfaces untuk Check Presensi =====================
export interface CheckPresensiPayload {
  kode_kegiatan: string;
  id_peserta: string;
  category: string;
}

export interface CheckPresensiResponse {
  success: boolean;
  message: string;
  data?: {
    already_presensi: boolean;
  };
}

// ===================== API Functions =====================

/**
 * GET /api/v1/presensi/report?id_kegiatan=21
 * Fetch presensi report untuk sebuah kegiatan dengan pagination
 * Report ini digunakan untuk menampilkan list peserta dan statistik
 */
export const fetchPresensiReport = async (
  idKegiatan: string | number,
  page: number = 1,
  perPage: number = 10,
  search: any,
): Promise<PresensiReportResponse> => {
  const response = await axiosServices().get(`/api/v1/presensi/report`, {
    params: {
      id_kegiatan: idKegiatan,
      page,
      "per-page": perPage,
      keyword: search && search.trim() ? search : undefined, // Hanya sertakan search jika ada dan tidak kosong
    },
  });
  return response.data;
};

/**
 * GET /api/v1/presensi
 * Fetch list presensi dengan filter[id_kegiatan] dan filter[search]
 * @param idKegiatan ID kegiatan (required filter pertama)
 * @param page Page number
 * @param perPage Items per page
 * @param search Search term (optional filter kedua)
 */
export const fetchPresensiList = async (
  idKegiatan: string | number,
  page: number = 1,
  perPage: number = 10,
  search?: string,
): Promise<PresensiListResponse> => {
  const params: any = {
    page,
    per_page: perPage,
    "filter[id_kegiatan]": idKegiatan, // Filter pertama: id_kegiatan (required)
  };

  if (search && search.trim()) {
    params["filter[search]"] = search; // Filter kedua: search (optional)
  }

  const response = await axiosServices().get(`/api/v1/presensi`, {
    params,
  });
  return response.data;
};

/**
 * GET /api/v1/presensi/report?id_kegiatan={idKegiatan}
 * Fetch detail presensi peserta dari report endpoint
 * Menggantikan fetchPresensiDetail karena detail hanya tersedia di report
 */
export const fetchPresensiDetailByReport = async (
  idKegiatan: string | number,
  page: number = 1,
  perPage: number = 10,
): Promise<PresensiReportResponse> => {
  const response = await axiosServices().get(`/api/v1/presensi/report`, {
    params: {
      id_kegiatan: idKegiatan,
      page,
      "per-page": perPage,
    },
  });
  return response.data;
};

/**
 * POST /api/v1/presensi
 * Create presensi baru
 */
export const createPresensi = async (
  payload: CreatePresensiPayload,
): Promise<CreatePresensiResponse> => {
  const response = await axiosServices().post(`/api/v1/presensi`, payload);
  return response.data;
};

/**
 * POST /api/v1/presensi/store-by-coordinate
 * Create presensi dengan koordinat dan radius check
 */
export const storePresensiByCoordinate = async (
  payload: StorePresensiByCoordinatePayload,
): Promise<CreatePresensiResponse> => {
  const response = await axiosServices().post(
    `/api/v1/presensi/store-by-coordinate`,
    payload,
  );
  return response.data;
};

/**
 * POST /api/v1/presensi/check
 * Check apakah peserta sudah melakukan presensi
 */
export const checkPresensi = async (
  payload: CheckPresensiPayload,
): Promise<CheckPresensiResponse> => {
  const response = await axiosServices().post(
    `/api/v1/presensi/check`,
    payload,
  );
  return response.data;
};
