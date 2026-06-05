import { axiosServices } from "@/services/axios";

export interface CaiListParams {
  page: number;
  perPage: number;
  search: string;
  tmptDaerah: string;
  tmptDesa: string;
  tmptKelompok: string;
}

export interface CaiOption {
  value: string | number;
  label: string;
}

export interface CaiListItem {
  id: number;
  uuid: string;
  id_card: string;
  kode_cari_data: string;
  nama_lengkap: string;
  tgl_lahir: string;
  jenis_kelamin: string;
  is_active: boolean;
  kd_daerah: string;
  nm_daerah: string;
  kd_desa?: string;
  nm_desa?: string;
  kd_kelompok?: string;
  nm_kelompok?: string;
  utusan: string;
  tahun: number;
  img: any;
  img_url: any;
  created_at: string;
  updated_at: string;
}

export interface CaiListResponse {
  data: CaiListItem[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
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

export interface CaiDetailResponse {
  success: boolean;
  message: string;
  data: CaiDetailData;
}

export interface CaiDetailData {
  id: number;
  uuid: string;
  id_card: string;
  kode_cari_data: string;
  nama_lengkap: string;
  tgl_lahir: string;
  umur: number;
  jenis_kelamin: string;
  is_active: boolean;
  kd_daerah: string;
  nm_daerah: string;
  kd_desa: string;
  nm_desa: string;
  kd_kelompok: string;
  nm_kelompok: string;
  utusan: string;
  tahun: number;
  img: any;
  img_url: any;
  created_at: string;
  updated_at: string;
}

export interface CaiFormValues {
  id_card: string;
  nama_lengkap: string;
  tgl_lahir: string;
  jenis_kelamin: string;
  tmpt_daerah: string;
  tmpt_desa: string;
  tmpt_kelompok: string;
  utusan: string;
  img: File | null;
}

const cleanParams = (params: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

const mapOptions = (
  rawData: any[],
  labelField: string,
  valueField = "id",
): CaiOption[] =>
  rawData.map((item: any) => ({
    value: item[valueField],
    label: item[labelField],
  }));

export const fetchCaiData = async (params: CaiListParams) => {
  const response = await axiosServices().get("/api/v1/data_cai", {
    params: cleanParams({
      page: params.page,
      per_page: params.perPage,
      "filter[search]": params.search,
      "filter[tmpt_daerah]": params.tmptDaerah,
      "filter[tmpt_desa]": params.tmptDesa,
      "filter[tmpt_kelompok]": params.tmptKelompok,
    }),
  });

  return response.data as CaiListResponse;
};

export const fetchCaiDetail = async (uuid: string) => {
  const response = await axiosServices().get(`/api/v1/data_cai/${uuid}`);
  return response.data as CaiDetailResponse;
};

export const createCaiData = async (formData: FormData) => {
  const response = await axiosServices().post("/api/v1/data_cai", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateCaiData = async (uuid: string, formData: FormData) => {
  const response = await axiosServices().post(
    `/api/v1/data_cai/${uuid}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const deleteCaiData = async (uuid: string) => {
  const response = await axiosServices().delete(`/api/v1/data_cai/${uuid}`);
  return response.data;
};

export const bulkDeleteCaiData = async (uuids: string[]) => {
  const response = await axiosServices().delete("/api/v1/data_cai", {
    data: {
      uuid: uuids,
    },
  });

  return response.data;
};

export const fetchDaerahOptions = async (): Promise<CaiOption[]> => {
  const response = await axiosServices().get("/api/v1/daerah/all");
  const rawData =
    response?.data?.data_tempat_sambung || response?.data?.data || [];
  return mapOptions(rawData, "nama_daerah");
};

export const fetchDesaOptionsByDaerah = async (
  daerahId: string,
): Promise<CaiOption[]> => {
  if (!daerahId) return [];

  const response = await axiosServices().get(
    `/api/v1/desa/check?daerah_id=${daerahId}`,
  );

  const rawData = response?.data?.data_tempat_sambung || [];
  return mapOptions(rawData, "nama_desa");
};

export const fetchKelompokOptionsByDesa = async (
  desaId: string,
): Promise<CaiOption[]> => {
  if (!desaId) return [];

  const response = await axiosServices().get(
    `/api/v1/kelompok/check?desa_id=${desaId}`,
  );

  const rawData = response?.data?.data_tempat_sambung || [];
  return mapOptions(rawData, "nama_kelompok");
};
