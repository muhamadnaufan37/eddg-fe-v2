import { axiosServices } from "./axios";

export interface WarningUser {
  id: number;
  nama_lengkap: string;
  username: string;
  lokasi: {
    daerah: string;
    desa: string;
    kelompok: string;
  };
}

export interface WarningItem {
  user: WarningUser;
  missing_months: string[];
  total_missing: number;
  consecutive_missing: number;
  warning_level: number;
  warning_label: string;
  current_warning_level: number;
}

export interface WarningData {
  tahun: number;
  checked_at: string;
  total_operators: number;
  total_warnings: number;
  warnings: WarningItem[];
}

export interface WarningResponse {
  success: boolean;
  message: string;
  data: WarningData;
}

export const getWarnings = async (): Promise<WarningResponse> => {
  const response = await axiosServices().get(
    "/api/v1/laporan-bulanan/check-warnings",
  );
  return response.data;
};
