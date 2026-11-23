import { axiosServices } from "@/services/axios";
import type { ApiEnvelope, ParsedApiError } from "./types";

export const CONSOLE_BASE = "/api/v1/barokahiin/console";
export const ADMIN_BASE = "/api/v1/barokahiin/admin";

function cleanParams(params?: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => {
      return (
        value !== undefined &&
        value !== null &&
        (typeof value !== "string" || value.trim() !== "")
      );
    }),
  );
}

export function createIdempotencyKey(prefix = "brk"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getApiData<T>(
  base: string,
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const response = await axiosServices().get<ApiEnvelope<T>>(`${base}${path}`, {
    params: cleanParams(params),
  });
  return response.data.data;
}

export async function postApiData<T>(
  base: string,
  path: string,
  payload?: unknown,
  options?: { idempotencyKey?: string },
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }
  const response = await axiosServices().post<ApiEnvelope<T>>(
    `${base}${path}`,
    payload,
    Object.keys(headers).length > 0 ? { headers } : undefined,
  );
  return response.data.data;
}

export async function patchApiData<T>(
  base: string,
  path: string,
  payload: unknown,
): Promise<T> {
  const response = await axiosServices().patch<ApiEnvelope<T>>(
    `${base}${path}`,
    payload,
  );
  return response.data.data;
}

export async function putApiData<T>(
  base: string,
  path: string,
  payload: unknown,
): Promise<T> {
  const response = await axiosServices().put<ApiEnvelope<T>>(
    `${base}${path}`,
    payload,
  );
  return response.data.data;
}

export async function uploadApiForm<T>(
  base: string,
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  const response = await axiosServices().post<ApiEnvelope<T>>(
    `${base}${path}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total && evt.total > 0) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    },
  );
  return response.data.data;
}

const CODE_HINTS: Record<string, string> = {
  OUT_OF_SCOPE:
    "Data ini berada di luar wilayah penugasan Anda atau tidak ditemukan.",
  NOT_FOUND:
    "Data tidak ditemukan atau berada di luar cakupan wilayah Anda.",
  VERSION_CONFLICT:
    "Data barang ini baru saja diubah di tempat lain. Muat ulang data terbaru sebelum menyimpan lagi.",
  ACTIVE_ORDERS_EXIST:
    "Alamat toko tidak dapat diubah karena masih ada pesanan aktif. Selesaikan pesanan aktif terlebih dahulu.",
  OVERDUE_REPORT:
    "Pencairan program ditahan karena ada laporan program sebelumnya yang belum disetujui.",
  FORBIDDEN_CATEGORY:
    "Kategori ini termasuk barang terlarang (seperti makanan atau minuman) dan tidak diizinkan pada Fase 1.",
  ITEM_NOT_SUBMITTABLE:
    "Barang belum memenuhi seluruh syarat SOP, verifikasi alamat toko, atau batas level.",
  ADDRESS_CHECKS_INCOMPLETE:
    "Seluruh butir verifikasi alamat (V1 sampai V7, serta V8 untuk Level 1) harus lulus sebelum verifikasi disetujui.",
};

export function parseBarokahiinError(
  error: unknown,
  fallback = "Terjadi kesalahan saat memproses permintaan.",
): ParsedApiError {
  if (typeof error === "object" && error !== null && "response" in error) {
    const resp = (
      error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            error?: {
              code?: string;
              message?: string;
              details?: Record<string, string[]>;
            };
            errors?: Record<string, string[]>;
          };
        };
      }
    ).response;

    const status = resp?.status;
    const code = resp?.data?.error?.code;
    const serverMessage =
      resp?.data?.error?.message || resp?.data?.message || "";
    const fieldErrors = resp?.data?.error?.details || resp?.data?.errors;

    if (status === 403) {
      return {
        status,
        code: code || "FORBIDDEN",
        message:
          serverMessage ||
          "Akses ditolak. Periksa peran akun Anda (Koordinator atau Admin).",
        fieldErrors,
      };
    }

    if (code && CODE_HINTS[code]) {
      return {
        status,
        code,
        message: serverMessage ? `${serverMessage}` : CODE_HINTS[code],
        fieldErrors,
      };
    }

    if (serverMessage) {
      return { status, code, message: serverMessage, fieldErrors };
    }
  }

  if (error instanceof Error && error.message) {
    return { message: error.message };
  }

  return { message: fallback };
}
