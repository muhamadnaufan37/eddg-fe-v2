import { toast } from "sonner";

export const handleApiError = (error: any, logoutFn: () => void) => {
  if (error.response) {
    const { status, data } = error.response;

    // Daftar status code yang ditangani secara umum
    const errorStatuses = [
      400, 402, 403, 404, 405, 422, 500, 501, 502, 503, 504,
    ];

    if (errorStatuses.includes(status)) {
      toast.error("Error!", {
        description: data.message || "Terjadi kesalahan pada server",
        duration: 3000,
      });
    }

    if (status === 401) {
      logoutFn();
      window.location.href = "/";
    }
  } else {
    toast.error("Error!", {
      description: "Gagal terhubung ke server.",
      duration: 3000,
    });
  }
};
