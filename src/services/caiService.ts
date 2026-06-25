import { axiosServices } from "@/services/axios";

export interface CaiListParams {
  page: number;
  perPage: number;
  search: string;
  tmptDaerah: string;
  tmptDesa: string;
  tmptKelompok: string;
  activeUtusan: string;
  activeJenisKelamin: string;
  activeIsActive: string;
  activeIsPeriode: string;
  sizeTshirt: string;
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
  size_tshirt?: string;
  tahun: string;
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
  size_tshirt?: string;
  tahun: string;
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
  is_active: string;
  size_tshirt: string;
  tahun: string;
  img: File | null;
}

export interface CaiReportPdfResponse {
  blob: Blob;
  filename: string;
  contentDisposition: any;
}

const extractFilenameFromContentDisposition = (
  contentDisposition?: string,
): string | null => {
  if (!contentDisposition) return null;

  const normalizedDisposition = contentDisposition.trim();

  const filenameStarMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  );
  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1].replace(/"/g, ""));
    } catch {
      return filenameStarMatch[1].replace(/"/g, "");
    }
  }

  const filenameMatch = normalizedDisposition.match(
    /filename=\"?([^\";]+)\"?/i,
  );
  return filenameMatch?.[1] ?? null;
};

const getResponseContentDisposition = (response: any): string | undefined => {
  const headers = response?.headers;

  if (typeof headers?.get === "function") {
    return headers.get("content-disposition") ?? undefined;
  }

  const headerValue =
    headers?.["content-disposition"] ??
    headers?.["Content-Disposition"] ??
    headers?.["Content-disposition"];

  if (headerValue) return headerValue;

  const requestHeader = response?.request?.getResponseHeader?.(
    "content-disposition",
  );

  return requestHeader ?? undefined;
};

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
      "filter[utusan]": params.activeUtusan,
      "filter[jenis_kelamin]": params.activeJenisKelamin,
      "filter[is_active]": params.activeIsActive,
      "filter[tahun]": params.activeIsPeriode,
      "filter[size_tshirt]": params.sizeTshirt,
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
  const response = await axiosServices().patch(
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

export const fetchCaiReportPdf = async (
  params: CaiListParams,
): Promise<CaiReportPdfResponse> => {
  const response = await axiosServices().get(
    `/api/v1/data_cai/report/download`,
    {
      params: {
        page: params.page,
        per_page: params.perPage,
        "filter[search]": params.search,
        "filter[tmpt_daerah]": params.tmptDaerah,
        "filter[tmpt_desa]": params.tmptDesa,
        "filter[tmpt_kelompok]": params.tmptKelompok,
        "filter[size_tshirt]": params.sizeTshirt,
      },
      responseType: "blob",
      headers: {
        Accept: "application/pdf",
      },
    },
  );

  const contentDisposition = getResponseContentDisposition(response);

  const filename =
    extractFilenameFromContentDisposition(contentDisposition) ||
    `peserta-cai-${new Date().toISOString().split("T")[0]}.pdf`;

  return {
    blob: response.data,
    filename,
    contentDisposition,
  };
};

export const fetchPeriodeOptions = async (): Promise<CaiOption[]> => {
  const response = await axiosServices().get(`/api/v1/data_cai/list-periode`);

  // Menggunakan optional chaining dan memberikan default array kosong langsung
  const rawData = response?.data?.data_periode;

  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData.map((item) => ({
    // Menghindari bug jika 'tahun' dari API bertipe number
    value: item.tahun?.toString() || "",
    label: item.tahun?.toString() || "Tanpa Tahun",
  }));
};
