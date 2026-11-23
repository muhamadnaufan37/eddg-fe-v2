import axios from "axios";

const baseURL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API;

// Public client without auth headers (BAROKAHIIN_FRONTEND_CONSOLE.md Section 1.1)
const publicApi = axios.create({
  baseURL,
  headers: { Accept: "application/json" },
});

export interface WilayahOption {
  code: string;
  id?: number | string;
  name: string;
}

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
      const code = String(r.code ?? r.kode ?? r.id ?? "").trim();
      const name = String(r.name ?? r.nama ?? r.label ?? code).trim();
      if (!code) return null;
      return {
        code,
        id: (r.id as number | string | undefined) ?? code,
        name,
      } as WilayahOption;
    })
    .filter((x): x is WilayahOption => Boolean(x));
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
