import { axiosServices } from "@/services/axios";

interface FetchDataParams {
  page: number;
  rows: number;
  filterInput: string;
  status: string;
  role_daerah: string;
  role_desa: string;
  role_kelompok: string;
}

/**
 * Determine endpoint and jenis_data based on role
 */
const getEndpointByRole = () => {
  let endpoint = "/api/v1/users";

  return { endpoint };
};

/**
 * Fetch activities data list
 */
export const fetchUsersData = async (params: FetchDataParams) => {
  const { endpoint } = getEndpointByRole();

  const rawParams = {
    page: params.page,
    per_page: params.rows,
    "filter[search]": params.filterInput,
    "filter[status]": params.status,
    "filter[role_daerah]": params.role_daerah,
    "filter[role_desa]": params.role_desa,
    "filter[role_kelompok]": params.role_kelompok,
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

export const fetchDetailUsers = async (uuid: string) => {
  const response = await axiosServices().get(`/api/v1/users/${uuid}`);
  return response.data;
};

export const fetchResetPassUsers = async (uuid: string) => {
  const response = await axiosServices().post(
    `/api/v1/users/${uuid}/reset-password`,
  );
  return response.data;
};

export const fetchUnbanUsers = async (uuid: string) => {
  const response = await axiosServices().post(`/api/v1/users/${uuid}/unban`);
  return response.data;
};
