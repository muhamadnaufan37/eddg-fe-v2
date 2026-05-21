const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;
const ABSOLUTE_URL = /^(https?:)?\/\//i;

const getApiBaseUrl = () =>
  (import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API || "").replace(/\/$/, "");

export const resolvePreviewUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return "";

  const trimmed = String(rawUrl).trim();
  if (!trimmed) return "";

  if (
    ABSOLUTE_URL.test(trimmed) ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const baseUrl = getApiBaseUrl();

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
};

export const isImagePreviewUrl = (rawUrl?: string | null) => {
  const resolved = resolvePreviewUrl(rawUrl);
  return IMAGE_EXTENSIONS.test(resolved) || resolved.startsWith("data:image/");
};

export const openPreviewInNewTab = (rawUrl?: string | null) => {
  const resolved = resolvePreviewUrl(rawUrl);
  if (!resolved) return false;

  const opened = window.open(resolved, "_blank", "noopener,noreferrer");
  return Boolean(opened);
};

export const openPreviewModal = (
  rawUrl?: string | null,
  title?: string,
  jenisKelamin?: string,
) => {
  const resolved =
    resolvePreviewUrl(rawUrl) ||
    (jenisKelamin
      ? jenisKelamin === "LAKI-LAKI"
        ? "/assets/empty-img-sensus-male.svg"
        : "/assets/empty-img-sensus-female.svg"
      : "");

  if (!resolved) return false;

  const ev = new CustomEvent("global-image-preview", {
    detail: { src: resolved, title: title || "Preview Foto" },
  });

  window.dispatchEvent(ev);
  return true;
};

export const createObjectPreviewUrl = (file?: File | null) => {
  if (!(file instanceof File)) return "";
  return URL.createObjectURL(file);
};

export const revokeObjectPreviewUrl = (objectUrl?: string | null) => {
  if (!objectUrl || !objectUrl.startsWith("blob:")) return;
  URL.revokeObjectURL(objectUrl);
};
