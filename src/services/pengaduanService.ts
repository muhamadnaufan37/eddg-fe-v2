import { axiosServices } from "@/services/axios";

export interface PengaduanListRoot {
  data: PengaduanItem[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface PengaduanItem {
  id: number;
  uuid: string;
  nama_lengkap: string;
  kontak: string;
  jenis_pengaduan: string;
  subjek: string;
  isi_pengaduan: string;
  lampiran: any;
  lampiran_url: any;
  ip_address: string;
  user_agent: string;
  nama_kelompok: string;
  status_pengaduan: string;
  balasan_admin: string;
  tanggal_dibalas: string;
  dibalas_oleh: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: any;
  next: string;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: PaginationMetaLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface PaginationMetaLink {
  url?: string;
  label: string;
  page?: number;
  active: boolean;
}

export interface PengaduanDetailRoot {
  success: boolean;
  message: string;
  data: PengaduanDetail;
}

export interface PengaduanDetail {
  id: number;
  uuid: string;
  nama_lengkap: string;
  kontak: string;
  jenis_pengaduan: string;
  subjek: string;
  isi_pengaduan: string;
  lampiran: any;
  lampiran_url: any;
  ip_address: string;
  user_agent: string;
  nama_kelompok: string;
  status_pengaduan: string;
  balasan_admin: string;
  tanggal_dibalas: string;
  dibalas_oleh: number;
  dibalas_oleh_user: DibalasOlehUser;
  created_at: string;
  updated_at: string;
}

export interface DibalasOlehUser {
  id: number;
  uuid: string;
  nama_lengkap: string;
  email: string;
  username: string;
  email_verified_at: string;
  role_id: number;
  kd_daerah: any;
  kd_desa: any;
  kd_kelompok: any;
  status: string;
  reason_ban: any;
  login_terakhir: any;
  created_at: string;
  updated_at: string;
}

interface FetchPengaduanParams {
  page: number;
  rows: number;
  filterInput: string;
}

export const fetchPengaduanData = async (params: FetchPengaduanParams) => {
  const response = await axiosServices().get<PengaduanListRoot>(
    "/api/v1/pengaduan",
    {
      params: {
        page: params.page,
        per_page: params.rows,
        "filter[search]": params.filterInput,
      },
    },
  );

  return response.data;
};

export const fetchDetailPengaduan = async (uuid: string) => {
  const response = await axiosServices().get<PengaduanDetailRoot>(
    `/api/v1/pengaduan/${uuid}`,
  );
  return response.data;
};

export const createPengaduan = async (payload: FormData) => {
  const response = await axiosServices().post("/api/v1/pengaduan", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updatePengaduan = async (uuid: string, payload: FormData) => {
  const response = await axiosServices().put(
    `/api/v1/pengaduan/${uuid}`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const deletePengaduan = async (uuid: string) => {
  const response = await axiosServices().delete(`/api/v1/pengaduan/${uuid}`);
  return response.data;
};

export const replyPengaduan = async (
  uuid: string,
  payload: { balasan_admin: string; status_pengaduan: string },
) => {
  const response = await axiosServices().post(
    `/api/v1/pengaduan/${uuid}`,
    payload,
  );
  return response.data;
};
