import { axiosServices } from "@/services/axios";

interface FetchDataParams {
  page: number;
  rows: number;
  filterInput: string;
}

/**
 * Determine endpoint and jenis_data based on role
 */
const getEndpointByRole = () => {
  let endpoint = "/api/v1/roles";

  return { endpoint };
};

/**
 * Fetch activities data list
 */
export const fetchRolesData = async (params: FetchDataParams) => {
  const { endpoint } = getEndpointByRole();

  const rawParams = {
    page: params.page,
    per_page: params.rows,
    "filter[search]": params.filterInput,
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

export const fetchDetailRoles = async (uuid: string) => {
  const response = await axiosServices().get(`/api/v1/roles/${uuid}`);
  return response.data;
};
