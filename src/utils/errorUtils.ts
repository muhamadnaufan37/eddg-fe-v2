import { removeLocalStorage } from "@/services/localStorageService";
import { toast } from "sonner";

interface ErrorHandlerOptions {
  showToast?: boolean; // Optional: skip toast if needed
}

const ERROR_STATUS_CODES = [
  400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415,
  416, 417, 418, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502,
  503, 504, 505, 506, 507, 508, 510, 511,
];

/**
 * Centralized API error handler
 * Automatically handles 401 (unauthorized) by clearing session and redirecting to login
 */
export const handleApiError = (
  error: any,
  { showToast = true }: ErrorHandlerOptions,
) => {
  if (!error.response) {
    if (showToast) {
      toast.error("Error!", {
        description: "Terjadi kesalahan jaringan",
        duration: 3000,
      });
    }
    return;
  }

  const { status, data } = error.response;

  // Handle specific error codes
  if (ERROR_STATUS_CODES.includes(status)) {
    if (showToast) {
      toast.error("Error!", {
        description: data.message || "Terjadi kesalahan",
        duration: 3000,
      });
    }
  }

  // Handle unauthorized - auto logout and redirect
  if (status === 401) {
    if (showToast) {
      toast.warning("Sesi Berakhir", {
        description: "Sesi Anda telah berakhir. Silakan login kembali",
        duration: 3000,
      });
    }

    // Clear user data and redirect after a short delay
    setTimeout(() => {
      removeLocalStorage("userData");
      window.location.href = "/";
    }, 1000);
  }
};

export const handleApiResponse = (
  response: any,
  onSuccess?: (data?: any) => void,
  onError?: (message: string) => void,
) => {
  // Check HTTP status code first (200-299 is success)
  if (response.success === true) {
    // For 204 No Content, there might be no data
    const responseData = response.data || {};

    // Check if response has explicit success flag
    if (responseData.success === false) {
      const errorMessage = responseData.message || "Terjadi kesalahan";
      toast.error("Error!", {
        description: errorMessage,
        duration: 3000,
      });
      if (onError) {
        onError(errorMessage);
      }
      return false;
    }

    // Success case
    if (onSuccess) {
      onSuccess(responseData);
    }
    return true;
  } else {
    // Non-2xx status code
    const errorMessage = response.data?.message || "Terjadi kesalahan";
    toast.error("Error!", {
      description: errorMessage,
      duration: 3000,
    });
    if (onError) {
      onError(errorMessage);
    }
    return false;
  }
};
