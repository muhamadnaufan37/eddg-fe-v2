import { useState } from "react";
import { handleApiError } from "@/utils/errorHandler";
import { axiosServices } from "@/services/axios";
import { toast } from "sonner";

interface Option {
  value: string | number;
  label: string;
}

export const useFetchOptions = () => {
  const [loading, setLoading] = useState(false);

  const logoutAndRedirect = () => {
    try {
      // Ganti dengan fungsi deleteUserInfo Anda
      localStorage.clear();
      window.location.href = "/";
    } catch {
      toast.error("Error!", {
        description: "Gagal memproses logout otomatis.",
        duration: 3000,
      });
    }
  };

  const fetchOptions = async (
    url: string,
    dataKey: string, // Key JSON dari API (contoh: 'data_daerah')
    labelField: string, // Field yang dijadikan label (contoh: 'nama_daerah')
    valueField: string = "id", // Default id
  ): Promise<Option[]> => {
    setLoading(true);
    try {
      const response = await axiosServices().get(url);
      const rawData = response?.data?.[dataKey] || response?.data?.data || [];

      return rawData.map((item: any) => ({
        value: item[valueField],
        label: item[labelField],
      }));
    } catch (error) {
      handleApiError(error, logoutAndRedirect);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { fetchOptions, loading };
};
