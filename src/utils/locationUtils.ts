import { axiosServices } from "@/services/axios";
import { handleApiError } from "@/utils/errorUtils";

export const fetchDesa = async (daerahId: any, setBalikanDataDesa: any) => {
  try {
    const response = await axiosServices().get(
      `/api/v1/desa/check?daerah_id=${daerahId}`,
    );

    if (
      response.data &&
      response.data.data_tempat_sambung &&
      Array.isArray(response.data.data_tempat_sambung)
    ) {
      const formattedData = response.data.data_tempat_sambung.map(
        (item: any) => ({
          value: item.id,
          label: item.nama_desa,
        }),
      );

      // Pastikan setState dipanggil
      setBalikanDataDesa(formattedData);
      return formattedData;
    }

    setBalikanDataDesa([]);
    return [];
  } catch (error: any) {
    handleApiError(error, { showToast: true });
    setBalikanDataDesa([]);
    return [];
  }
};

export const fetchKelompok = async (
  desaId: any,
  setBalikanDataKelompok: any,
) => {
  try {
    const response = await axiosServices().get(
      `/api/v1/kelompok/check?desa_id=${desaId}`,
    );

    if (
      response.data &&
      response.data.data_tempat_sambung &&
      Array.isArray(response.data.data_tempat_sambung)
    ) {
      const formattedData = response.data.data_tempat_sambung.map(
        (item: any) => ({
          value: item.id,
          label: item.nama_kelompok,
        }),
      );

      // Pastikan setState dipanggil
      setBalikanDataKelompok(formattedData);
      return formattedData;
    }

    setBalikanDataKelompok([]);
    return [];
  } catch (error: any) {
    handleApiError(error, { showToast: true });
    setBalikanDataKelompok([]);
    return [];
  }
};
