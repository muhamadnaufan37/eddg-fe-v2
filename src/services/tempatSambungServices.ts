import { axiosServices } from "@/services/axios";

interface FetchDataParams {
  page: number;
  rows: number;
  filterInput: string;
  status: boolean | null;
}

/**
 * Determine endpoint and jenis_data based on role
 */
const getEndpointDaerah = () => {
  let endpoint = "/api/v1/daerah";

  return { endpoint };
};
const getEndpointDesa = () => {
  let endpoint = "/api/v1/desa";

  return { endpoint };
};
const getEndpointKelompok = () => {
  let endpoint = "/api/v1/kelompok";

  return { endpoint };
};

/**
 * Fetch activities data list
 */
export const fetchDaerahData = async (params: FetchDataParams) => {
  const { endpoint } = getEndpointDaerah();

  const rawParams = {
    page: params.page,
    per_page: params.rows,
    "filter[search]": params.filterInput,
    "filter[is_active]": params.status,
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

export const fetchDesaData = async (params: FetchDataParams) => {
  const { endpoint } = getEndpointDesa();

  const rawParams = {
    page: params.page,
    per_page: params.rows,
    "filter[search]": params.filterInput,
    "filter[is_active]": params.status,
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

export const fetchDesaKelompok = async (params: FetchDataParams) => {
  const { endpoint } = getEndpointKelompok();

  const rawParams = {
    page: params.page,
    per_page: params.rows,
    "filter[search]": params.filterInput,
    "filter[is_active]": params.status,
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

export const fetchDetailDaerah = async (id: string) => {
  const response = await axiosServices().get(`/api/v1/daerah/${id}`);
  return response.data;
};

export const fetchDetailDesa = async (id: string) => {
  const response = await axiosServices().get(`/api/v1/desa/${id}`);
  return response.data;
};

export const fetchDetailKelompok = async (id: string) => {
  const response = await axiosServices().get(`/api/v1/kelompok/${id}`);
  return response.data;
};
