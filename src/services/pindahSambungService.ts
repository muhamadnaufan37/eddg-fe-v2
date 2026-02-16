import { axiosServices } from "@/services/axios";

export interface PindahSambungFilters {
  status?: "pending" | "approved" | "rejected" | "reverted" | "";
  kode_cari_data?: string;
  page?: number;
}

export interface PindahSambungItem {
  id: number;
  peserta: {
    id: number;
    kode_cari_data: string;
    nama_lengkap: string;
    status_sambung: number;
  };
  requested_by: {
    id: number;
    nama_lengkap: string;
    username: string;
  };
  lokasi_asal: {
    daerah_id: number;
    daerah_nama: string;
    desa_id: number;
    desa_nama: string;
    kelompok_id: number;
    kelompok_nama: string;
    formatted: string;
  };
  lokasi_tujuan: {
    daerah_id: number;
    daerah_nama: string;
    desa_id: number;
    desa_nama: string;
    kelompok_id: number;
    kelompok_nama: string;
    formatted: string;
    is_new_location: boolean;
  };
  status: "pending" | "approved" | "rejected" | "reverted";
  alasan_pindah: string;
  keterangan_reject: string | null;
  approved_at: string | null;
  approved_by: {
    id: number | null;
    nama_lengkap?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PindahSambungHistory {
  peserta: {
    id: number;
    kode_cari_data: string;
    nama_lengkap: string;
    status_sambung: number;
    lokasi_sekarang: {
      daerah: string;
      desa: string;
      kelompok: string;
    };
  };
  total_pindah: number;
  pending_requests: number;
  history: PindahSambungItem[];
}

/**
 * Get list of pindah sambung requests
 */
export const getPindahSambungList = async (
  filters: PindahSambungFilters = {},
) => {
  const axios = axiosServices();

  const params: any = {};
  if (filters.status) params.status = filters.status;
  if (filters.kode_cari_data) params.kode_cari_data = filters.kode_cari_data;
  if (filters.page) params.page = filters.page;

  const response = await axios.get("/api/v1/pindah-sambung", { params });
  return response.data;
};

/**
 * Get history pindah sambung by kode_cari_data
 */
export const getPindahSambungHistory = async (kodeCariData: string) => {
  const axios = axiosServices();
  const response = await axios.get(
    `/api/v1/pindah-sambung/${kodeCariData}/history`,
  );
  return response.data;
};

/**
 * Request pindah sambung
 */
export const requestPindahSambung = async (data: {
  kode_cari_data: string;
  ke_daerah_id: number;
  ke_desa_id: number;
  ke_kelompok_id: number;
  alasan_pindah: string;
}) => {
  const axios = axiosServices();
  const response = await axios.post("/api/v1/pindah-sambung/request", data);
  return response.data;
};

/**
 * Approve pindah sambung request
 */
export const approvePindahSambung = async (id: number) => {
  const axios = axiosServices();
  const response = await axios.post(`/api/v1/pindah-sambung/${id}/approve`);
  return response.data;
};

/**
 * Reject pindah sambung request
 */
export const rejectPindahSambung = async (
  id: number,
  keterangan_reject: string,
) => {
  const axios = axiosServices();
  const response = await axios.post(`/api/v1/pindah-sambung/${id}/reject`, {
    keterangan_reject,
  });
  return response.data;
};

/**
 * Revert approved pindah sambung
 */
export const revertPindahSambung = async (
  id: number,
  alasan_revert: string,
) => {
  const axios = axiosServices();
  const response = await axios.post(`/api/v1/pindah-sambung/${id}/revert`, {
    alasan_revert,
  });
  return response.data;
};
