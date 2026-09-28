import { axiosServices } from "@/services/axios";

export type MetodePresensi = "tapping" | "manual" | "both";

export interface PresensiKegiatanItem {
  id: any;
  id_kegiatan: string;
  kode_kegiatan: string;
  nama_kegiatan: string;
  tmpt_kegiatan: string;
  type_kegiatan: string;
  tgl_kegiatan: string;
  jam_kegiatan: string;
  expired_date_time: string;
  category: string;
  metode_presensi: MetodePresensi;
  usia_mode: string;
  usia_operator: string;
  usia_min: number;
  usia_max: number;
  kd_daerah: number;
  nm_daerah: string;
  kd_desa: any;
  nm_desa: any;
  kd_kelompok: any;
  daerah_ids?: number[];
  desa_ids?: number[];
  kelompok_ids?: number[];
  nm_kelompok: any;
  add_by_petugas: number;
  petugas: string;
  presensi: any[];
  total_presensi: number;
  count_hadir: number;
  count_terlambat: number;
  count_izin: number;
  count_sakit: number;
  nm_petugas: string;
  created_at: string;
  updated_at: string;
}

export interface PresensiKegiatanListResponse {
  data: PresensiKegiatanItem[];
  links: {
    first: string;
    last: string;
    prev: any;
    next: any;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url?: string;
      label: string;
      page?: number;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface PresensiKegiatanDetailResponse {
  success: boolean;
  message: string;
  data: PresensiKegiatanItem;
}

export interface FetchPresensiKegiatanParams {
  page: number;
  rows: number;
  search?: string;
}

export interface UpsertPresensiKegiatanPayload {
  nama_kegiatan: string;
  tmpt_kegiatan: string;
  type_kegiatan: string;
  tgl_kegiatan: string;
  jam_kegiatan: string;
  expired_date_time: string;
  category: string;
  metode_presensi: MetodePresensi;
  usia_mode: "single" | "range";
  usia_operator?: string;
  usia_min: number;
  usia_max?: number;
  tmpt_daerah: number;
  tmpt_desa?: number;
  tmpt_kelompok?: number;
  daerah_ids?: number[];
  desa_ids?: number[];
  kelompok_ids?: number[];
  add_by_petugas: number;
}

export const fetchPresensiKegiatanData = async (
  params: FetchPresensiKegiatanParams,
): Promise<PresensiKegiatanListResponse> => {
  const rawParams = {
    page: params.page,
    per_page: params.rows,
    "filter[search]": params.search,
  };

  const cleanParams = Object.fromEntries(
    Object.entries(rawParams).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

  const response = await axiosServices().get("/api/v1/presensi-kegiatan", {
    params: cleanParams,
  });

  return response.data;
};

export const fetchDetailPresensiKegiatan = async (
  id: string | number,
): Promise<PresensiKegiatanDetailResponse> => {
  const response = await axiosServices().get(`/api/v1/presensi-kegiatan/${id}`);
  return response.data;
};

export const createPresensiKegiatan = async (
  payload: UpsertPresensiKegiatanPayload,
) => {
  const response = await axiosServices().post(
    "/api/v1/presensi-kegiatan",
    payload,
  );
  return response.data;
};

export const updatePresensiKegiatan = async (
  id: string | number,
  payload: UpsertPresensiKegiatanPayload,
) => {
  const response = await axiosServices().put(
    `/api/v1/presensi-kegiatan/${id}`,
    payload,
  );
  return response.data;
};

export const deletePresensiKegiatan = async (id: string | number) => {
  const response = await axiosServices().delete(
    `/api/v1/presensi-kegiatan/${id}`,
  );
  return response.data;
};
