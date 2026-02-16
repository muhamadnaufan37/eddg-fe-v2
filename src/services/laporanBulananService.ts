import { axiosServices } from "@/services/axios";

export interface StatusLaporan {
  bulan: number;
  nama_bulan: string;
  status: "belum_submit" | "submitted" | "approved" | "rejected";
  submitted_at: string | null;
  is_late: boolean;
  laporan_id: number | null;
}

export interface UserInfo {
  id: number;
  nama_lengkap: string;
  warning_level: number;
  last_warning_at: string | null;
}

export interface LaporanDetail {
  id: number;
  user: { id: number };
  periode: {
    bulan: number;
    nama_bulan: string;
    tahun: number;
    periode_text: string;
  };
  status: "belum_submit" | "submitted" | "approved" | "rejected";
  is_late: boolean;
  data_laporan: {
    total_peserta: number;
    peserta_baru_bulan_ini: number;
    total_laki_laki: number;
    total_perempuan: number;
    total_caberawit: number;
    total_praremaja: number;
    total_remaja: number;
    total_mumi: number;
    lokasi: {
      daerah: string | null;
      desa: string | null;
      kelompok: string | null;
    };
  };
  catatan: string | null;
  keterangan_reject: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get status laporan bulanan for current year
 */
export const getLaporanStatus = async (tahun?: number) => {
  const axios = axiosServices();
  const params = tahun ? { tahun } : {};

  const response = await axios.get("/api/v1/laporan-bulanan/status", {
    params,
  });
  return response.data;
};

export interface LaporanHistoryFilters {
  page?: number;
  tahun?: number;
  status?: "belum_submit" | "submitted" | "approved" | "rejected" | "";
  per_page?: number;
}

/**
 * Get history of submitted laporan
 */
export const getLaporanHistory = async (
  filters: LaporanHistoryFilters = {},
) => {
  const axios = axiosServices();

  // Build query params, only include defined values
  const params: any = {};
  if (filters.page) params.page = filters.page;
  if (filters.tahun) params.tahun = filters.tahun;
  if (filters.status) params.status = filters.status;
  if (filters.per_page) params.per_page = filters.per_page;

  const response = await axios.get("/api/v1/laporan-bulanan/history", {
    params,
  });
  return response.data;
};

/**
 * Submit laporan bulanan for a specific month
 */
export const submitLaporan = async (
  bulan: number,
  tahun: number,
  catatan?: string,
) => {
  const axios = axiosServices();

  const response = await axios.post("/api/v1/laporan-bulanan/submit", {
    bulan,
    tahun,
    catatan: catatan || null,
  });
  return response.data;
};

/**
 * Approve a laporan
 */
export const approveLaporan = async (id: number) => {
  const axios = axiosServices();

  const response = await axios.post(`/api/v1/laporan-bulanan/${id}/approve`);
  return response.data;
};

/**
 * Reject a laporan with reason
 */
export const rejectLaporan = async (id: number, keterangan_reject: string) => {
  const axios = axiosServices();

  const response = await axios.post(`/api/v1/laporan-bulanan/${id}/reject`, {
    keterangan_reject,
  });
  return response.data;
};

export interface CheckUsersFilters {
  tahun?: number;
  search?: string;
  daerah_id?: number | string;
  desa_id?: number | string;
  kelompok_id?: number | string;
  performa?: string | string[];
  bulan?: number;
  status_bulan?: string;
  laporan_status?: string;
  is_late?: 0 | 1;
  min_kepatuhan?: number;
  max_kepatuhan?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

/**
 * Get monitoring laporan - check users compliance
 */
export const checkUsers = async (filters: CheckUsersFilters = {}) => {
  const axios = axiosServices();

  // Build query params, only include defined values
  const params: any = {};
  if (filters.tahun) params.tahun = filters.tahun;
  if (filters.search) params.search = filters.search;
  if (filters.daerah_id) params.daerah_id = filters.daerah_id;
  if (filters.desa_id) params.desa_id = filters.desa_id;
  if (filters.kelompok_id) params.kelompok_id = filters.kelompok_id;
  if (filters.performa) params.performa = filters.performa;
  if (filters.bulan) params.bulan = filters.bulan;
  if (filters.status_bulan) params.status_bulan = filters.status_bulan;
  if (filters.laporan_status) params.laporan_status = filters.laporan_status;
  if (filters.is_late !== undefined) params.is_late = filters.is_late;
  if (filters.min_kepatuhan !== undefined)
    params.min_kepatuhan = filters.min_kepatuhan;
  if (filters.max_kepatuhan !== undefined)
    params.max_kepatuhan = filters.max_kepatuhan;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_dir) params.sort_dir = filters.sort_dir;
  if (filters.per_page) params.per_page = filters.per_page;
  if (filters.page) params.page = filters.page;

  const response = await axios.get("/api/v1/laporan-bulanan/check-users", {
    params,
  });
  return response.data;
};
