import axios from "axios";

const baseURL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API;

// Public client without auth headers (BAROKAHIIN_WILAYAH_FLOW.md Section 2)
const publicApi = axios.create({
  baseURL,
  headers: { Accept: "application/json" },
});

export interface WilayahOption {
  code: string;
  name: string;
}

export interface OrganisasiOption {
  id: number | string;
  name: string;
}

export interface WilayahFiltersResponse {
  administratif: {
    provinces: WilayahOption[];
    regencies: WilayahOption[];
    districts: WilayahOption[];
    villages: WilayahOption[];
  };
  organisasi: {
    daerah: OrganisasiOption[];
    desa: OrganisasiOption[];
    kelompok: OrganisasiOption[];
  };
}

export interface WilayahValue {
  province_code: string;
  regency_code: string;
  district_code: string;
  village_code: string;
}

export const EMPTY_WILAYAH: WilayahValue = {
  province_code: "",
  regency_code: "",
  district_code: "",
  village_code: "",
};

function normalizeWilayahList(raw: unknown): WilayahOption[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? ((raw as Record<string, unknown>).data ??
          (raw as Record<string, unknown>).items ??
          [])
      : [];

  if (!Array.isArray(arr)) return [];

  return arr
    .map((item) => {
      const r = item as Record<string, unknown>;
      const code = String(r.code ?? r.kode ?? "").trim();
      const name = String(r.name ?? r.nama ?? r.label ?? code).trim();
      if (!code) return null;
      return { code, name } as WilayahOption;
    })
    .filter((x): x is WilayahOption => Boolean(x));
}

function normalizeOrganisasiList(raw: unknown): OrganisasiOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const r = item as Record<string, unknown>;
      const id = r.id ?? r.uuid ?? r.code;
      const name = String(
        r.name ??
          r.nama ??
          r.nama_daerah ??
          r.nama_desa ??
          r.nama_kelompok ??
          id ??
          "",
      ).trim();
      if (id === undefined || id === null || id === "") return null;
      return { id: id as number | string, name };
    })
    .filter((x): x is OrganisasiOption => Boolean(x));
}

export async function getWilayahProvinces(): Promise<WilayahOption[]> {
  const res = await publicApi.get("/api/v1/public/wilayah/provinces");
  return normalizeWilayahList(res.data?.data ?? res.data);
}

export async function getWilayahRegencies(
  provinceCode: string,
): Promise<WilayahOption[]> {
  if (!provinceCode) return [];
  const res = await publicApi.get(
    `/api/v1/public/wilayah/regencies/${encodeURIComponent(provinceCode)}`,
  );
  return normalizeWilayahList(res.data?.data ?? res.data);
}

export async function getWilayahDistricts(
  regencyCode: string,
): Promise<WilayahOption[]> {
  if (!regencyCode) return [];
  const res = await publicApi.get(
    `/api/v1/public/wilayah/districts/${encodeURIComponent(regencyCode)}`,
  );
  return normalizeWilayahList(res.data?.data ?? res.data);
}

export async function getWilayahVillages(
  districtCode: string,
): Promise<WilayahOption[]> {
  if (!districtCode) return [];
  const res = await publicApi.get(
    `/api/v1/public/wilayah/villages/${encodeURIComponent(districtCode)}`,
  );
  return normalizeWilayahList(res.data?.data ?? res.data);
}

export async function getWilayahFilters(
  params: {
    province_code?: string;
    regency_code?: string;
    district_code?: string;
    village_code?: string;
    daerah_id?: number | string;
    desa_id?: number | string;
  } = {},
): Promise<WilayahFiltersResponse> {
  const clean = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== "",
    ),
  );
  const res = await publicApi.get("/api/v1/public/wilayah/filters", {
    params: clean,
  });
  const data = (res.data?.data ?? res.data ?? {}) as Record<string, unknown>;
  const admin = (data.administratif ?? {}) as Record<string, unknown>;
  const org = (data.organisasi ?? {}) as Record<string, unknown>;

  return {
    administratif: {
      provinces: normalizeWilayahList(admin.provinces),
      regencies: normalizeWilayahList(admin.regencies),
      districts: normalizeWilayahList(admin.districts),
      villages: normalizeWilayahList(admin.villages),
    },
    organisasi: {
      daerah: normalizeOrganisasiList(org.daerah),
      desa: normalizeOrganisasiList(org.desa),
      kelompok: normalizeOrganisasiList(org.kelompok),
    },
  };
}
