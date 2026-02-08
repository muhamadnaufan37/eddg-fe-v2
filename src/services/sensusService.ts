import { axiosServices } from "@/services/axios";

interface FetchDataParams {
  page: number;
  rows: number;
  resultJenisData: string | number | null;
  filterInput: string;
  statusSambung: string | number | null;
  statusPernikahan: string | number | null;
  statusAtletAsad: string | number | null;
  statusGender: string | number | null;
  rangeUmurMin: string;
  rangeUmurMax: string;
  filterDaerah: string;
  filterDesa: string;
  filterKelompok: string;
}

interface ReportParams {
  filterDaerah: string;
  filterDesa: string;
  filterKelompok: string;
  statusSambung: string | number | null;
  statusPernikahan: string | number | null;
  statusAtletAsad: string | number | null;
  statusGender: string | number | null;
  rangeUmurMin: string;
  rangeUmurMax: string;
  resultJenisData: string | number | null;
}

/**
 * Determine endpoint and jenis_data based on role
 */
const getEndpointByRole = () => {
  let endpoint = "/api/v1/data_peserta";

  return { endpoint };
};

/**
 * Fetch sensus data list
 */
export const fetchSensusData = async (params: FetchDataParams) => {
  const { endpoint } = getEndpointByRole();

  const rawParams = {
    page: params.page,
    per_page: params.rows,
    "filter[jenis_data]": params.resultJenisData,
    "filter[search]": params.filterInput,
    "filter[status_sambung]": params.statusSambung,
    "filter[status_pernikahan]": params.statusPernikahan,
    "filter[status_atlet_asad]": params.statusAtletAsad,
    "filter[jenis_kelamin]": params.statusGender,
    "filter[umur_min]": params.rangeUmurMin,
    "filter[umur_max]": params.rangeUmurMax,
    "filter[tmpt_daerah]": params.filterDaerah,
    "filter[tmpt_desa]": params.filterDesa,
    "filter[tmpt_kelompok]": params.filterKelompok,
  };

  const cleanParams = Object.fromEntries(
    Object.entries(rawParams).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

  const response = await axiosServices().get(endpoint, {
    params: cleanParams,
  });
  return response.data;
};

/**
 * Fetch report data for PDF
 */
export const fetchReportData = async (params: ReportParams) => {
  let endpoint = "/api/v1/data_peserta/report";

  const body = {
    filter_daerah: params.filterDaerah,
    filter_desa: params.filterDesa,
    filter_kelompok: params.filterKelompok,
    status_sambung: params.statusSambung,
    status_pernikahan: params.statusPernikahan,
    status_atlet_asad: params.statusAtletAsad,
    jenis_kelamin: params.statusGender,
    umur_min: params.rangeUmurMin,
    umur_max: params.rangeUmurMax,
    jenis_data: params.resultJenisData,
  };

  const response = await axiosServices().get(endpoint, { params: body });
  return response.data;
};

/**
 * Fetch statistik data
 */
export const fetchStatistikData = async (params: ReportParams) => {
  let endpoint = "/api/v1/data_peserta/dashboard";

  const queryParams = {
    "filter[jenis_data]": params.resultJenisData,
    "filter[status_sambung]": params.statusSambung,
    "filter[status_pernikahan]": params.statusPernikahan,
    "filter[status_atlet_asad]": params.statusAtletAsad,
    "filter[jenis_kelamin]": params.statusGender,
    "filter[umur_min]": params.rangeUmurMin,
    "filter[umur_max]": params.rangeUmurMax,
    "filter[tmpt_daerah]": params.filterDaerah,
    "filter[tmpt_desa]": params.filterDesa,
    "filter[tmpt_kelompok]": params.filterKelompok,
  };

  const cleanParams = Object.fromEntries(
    Object.entries(queryParams).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

  const response = await axiosServices().get(endpoint, {
    params: cleanParams,
  });
  return response.data;
};

/**
 * Fetch detail data peserta
 */
export const fetchDetailPeserta = async (kode: string) => {
  const response = await axiosServices().get(`/api/v1/data_peserta/${kode}`);
  return response.data;
};

/**
 * Fetch desa by daerah
 */
export const fetchDesaByDaerah = async (daerahId: string) => {
  const response = await axiosServices().get(
    `/api/v1/desa/check?daerah_id=${daerahId}`,
  );
  return response.data;
};

/**
 * Fetch kelompok by desa
 */
export const fetchKelompokByDesa = async (desaId: string) => {
  const response = await axiosServices().get(
    `/api/v1/kelompok/check?desa_id=${desaId}`,
  );
  return response.data;
};
