import type { AddressCheckCode, PaginatedList } from "@/services/barokahiin";

export function formatRupiah(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "Rp 0";
  }
  const rounded = Math.trunc(Number(value));
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));
  return rounded < 0 ? `- Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatDateId(value?: string | null, withTime = true): string {
  if (!value) return "Belum ada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum ada";
  const datePart = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  if (!withTime) return datePart;

  const timePart = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
  return `${datePart}, ${timePart} WIB`;
}

export function normalizePhoneId(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+62")) return digits;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  return digits;
}

export function maskSensitive(value?: string | null, visibleEnd = 4): string {
  if (!value) return "Disamarkan";
  const clean = String(value).trim();
  if (clean.length <= visibleEnd) return clean;
  return `${"•".repeat(Math.min(6, clean.length - visibleEnd))}${clean.slice(-visibleEnd)}`;
}

function extractPagination(
  obj: Record<string, unknown>,
): PaginatedList<unknown>["pagination"] {
  const nested = (obj.pagination ?? obj.meta) as
    | Record<string, unknown>
    | undefined;
  const src = nested && typeof nested === "object" ? nested : obj;

  if (
    typeof src.current_page === "number" &&
    typeof src.last_page === "number"
  ) {
    return {
      current_page: src.current_page,
      last_page: src.last_page,
      per_page: typeof src.per_page === "number" ? src.per_page : 15,
      total: typeof src.total === "number" ? src.total : 0,
    };
  }
  return undefined;
}

export function unwrapList<T>(
  data: PaginatedList<T> | T[] | Record<string, unknown> | undefined | null,
): { items: T[]; pagination?: PaginatedList<T>["pagination"] } {
  if (!data) return { items: [] };
  if (Array.isArray(data)) return { items: data };

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const candidateKeys = [
      "items",
      "data",
      "queue",
      "records",
      "rows",
      "entries",
      "orders",
      "donors",
      "stores",
      "coordinators",
      "payouts",
      "logs",
      "audit_logs",
    ];

    for (const key of candidateKeys) {
      if (Array.isArray(obj[key])) {
        return {
          items: obj[key] as T[],
          pagination: extractPagination(obj),
        };
      }
    }

    // Fallback: pick first array value if backend uses another wrapper key
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        return {
          items: value as T[],
          pagination: extractPagination(obj),
        };
      }
    }
  }

  return { items: [] };
}

export function computeHoursRemaining(deadline?: string | null): number | null {
  if (!deadline) return null;
  const ts = Date.parse(deadline);
  if (!Number.isFinite(ts)) return null;
  return Math.round((ts - Date.now()) / 3600000);
}

export function daysBetweenNowAnd(dateStr: string): number {
  const target = Date.parse(dateStr);
  if (!Number.isFinite(target)) return 0;
  return Math.ceil((target - Date.now()) / 86400000);
}

export const PILOT_REGIONS: Array<{
  id: number;
  nama: string;
  provinsi: string;
  kodePosPrefix: string;
}> = [
  { id: 1, nama: "Kota Bandung", provinsi: "Jawa Barat", kodePosPrefix: "401" },
  { id: 2, nama: "Kabupaten Bandung", provinsi: "Jawa Barat", kodePosPrefix: "403" },
  {
    id: 3,
    nama: "Kabupaten Bandung Barat",
    provinsi: "Jawa Barat",
    kodePosPrefix: "405",
  },
  { id: 4, nama: "Kota Cimahi", provinsi: "Jawa Barat", kodePosPrefix: "405" },
  { id: 5, nama: "Kabupaten Sumedang", provinsi: "Jawa Barat", kodePosPrefix: "453" },
];

export function getRegionLabel(id?: number | string | null): string {
  if (id === null || id === undefined || id === "") return "Belum dipilih";
  const found = PILOT_REGIONS.find((r) => String(r.id) === String(id));
  return found ? `${found.nama}, ${found.provinsi}` : `Wilayah #${id}`;
}

export const ADDRESS_CHECKS_SPEC: Array<{
  kode: AddressCheckCode;
  judul: string;
  deskripsi: string;
  wajibLevel1Only?: boolean;
}> = [
  {
    kode: "V1",
    judul: "Kelengkapan dan konsistensi alamat",
    deskripsi:
      "Semua kolom alamat lengkap dan konsisten, tidak ada bagian kosong atau mengada-ada.",
  },
  {
    kode: "V2",
    judul: "Berada dalam wilayah penugasan",
    deskripsi: "Alamat berada di dalam Kabupaten/Kota penugasan koordinator.",
  },
  {
    kode: "V3",
    judul: "Kecocokan titik peta (pin)",
    deskripsi: "Titik koordinat peta cocok dengan nama jalan dan patokan.",
  },
  {
    kode: "V4",
    judul: "Kesesuaian foto lokasi dan penyimpanan",
    deskripsi:
      "Foto tampak depan (minimal 2 sudut) dan ruang penyimpanan menunjukkan tempat yang bersih, kering, dan aman.",
  },
  {
    kode: "V5",
    judul: "Keabsahan bukti alamat",
    deskripsi:
      "Surat domisili, tagihan listrik/air, bukti sewa, atau surat izin pemilik/RT sah dan sesuai.",
  },
  {
    kode: "V6",
    judul: "Nomor kontak toko aktif",
    deskripsi: "Nomor kontak toko telah dihubungi dan menjawab.",
  },
  {
    kode: "V7",
    judul: "Tur video langsung ruang penyimpanan",
    deskripsi: "Tur video daring langsung ke ruang penyimpanan telah selesai.",
  },
  {
    kode: "V8",
    judul: "Kunjungan lapangan (wajib Level 1)",
    deskripsi:
      "Kunjungan lapangan oleh Admin atau Koordinator Utama wilayah telah dilakukan.",
    wajibLevel1Only: true,
  },
];

export const ITEM_CATEGORIES_SEED = [
  { id: 1, code: "PK", nama: "Pakaian dan tekstil", forbidden: false },
  { id: 2, code: "EL", nama: "Elektronik dan gawai", forbidden: false },
  { id: 3, code: "PR", nama: "Perabot dan rumah tangga", forbidden: false },
  { id: 4, code: "BK", nama: "Buku dan bahan bacaan", forbidden: false },
  { id: 5, code: "BA", nama: "Perlengkapan bayi dan anak", forbidden: false },
  { id: 6, code: "SK", nama: "Perlengkapan sekolah dan kuliah", forbidden: false },
  { id: 7, code: "AL", nama: "Alat dan perkakas", forbidden: false },
  {
    id: 8,
    code: "KS",
    nama: "Alat bantu kesehatan non-obat",
    forbidden: false,
  },
  { id: 9, code: "IB", nama: "Perlengkapan ibadah", forbidden: false },
  { id: 10, code: "TN", nama: "Tanaman dan bibit (ambil di tempat)", forbidden: false },
  { id: 11, code: "LN", nama: "Lainnya (butuh persetujuan Reviewer)", forbidden: false },
  { id: 12, code: "MK", nama: "Makanan dan minuman (dilarang Fase 1)", forbidden: true },
];

export const GRADE_GUIDELINES: Record<
  "A" | "B" | "C",
  { label: string; minPct: number; maxPct: number; desc: string }
> = {
  A: {
    label: "Grade A, sangat baik",
    minPct: 0.5,
    maxPct: 0.7,
    desc: "Tampak seperti baru atau sedikit bekas pakai, fungsi penuh, tanpa cacat berarti.",
  },
  B: {
    label: "Grade B, baik",
    minPct: 0.35,
    maxPct: 0.55,
    desc: "Bekas pakai wajar, cacat kosmetik ringan, fungsi penuh.",
  },
  C: {
    label: "Grade C, cukup",
    minPct: 0.2,
    maxPct: 0.4,
    desc: "Keausan atau cacat kosmetik jelas, tetap layak pakai dan fungsi penuh. Semua cacat wajib difoto.",
  },
};

export const PHOTO_ANGLE_GUIDES = [
  "Tampak depan",
  "Tampak belakang",
  "Tampak samping atau detail",
  "Label atau merek",
  "Close-up setiap cacat",
  "Foto berskala dengan penggaris atau benda pembanding",
];

export const FORBIDDEN_KEYWORDS = [
  "makanan",
  "minuman",
  "kue",
  "susu",
  "obat",
  "parfum bekas",
  "kosmetik bekas",
  "pakaian dalam",
  "kaus kaki",
  "kasur bekas",
  "bantal bekas",
  "alkohol",
  "senjata",
  "car seat",
  "dot bayi",
  "botol susu",
  "pompa asi",
];

export function detectForbiddenKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return FORBIDDEN_KEYWORDS.filter((kw) => lower.includes(kw));
}

export const CODE_OF_ETHICS_10 = [
  "Saya jujur pada pembeli, donatur, dan Barokahiin.",
  "Saya menulis kekurangan barang apa adanya.",
  "Saya menjaga data orang lain seperti data saya sendiri.",
  "Saya tidak bertransaksi di luar Barokahiin.",
  "Saya memperlakukan semua orang dengan hormat dan adil.",
  "Saya memakai uang kebaikan hanya untuk kebaikan dan melaporkannya.",
  "Saya tidak mengambil keuntungan pribadi di luar komisi yang ditetapkan.",
  "Saya menjaga keselamatan dan tidak menjual barang berbahaya.",
  "Saya melindungi anak-anak dan penerima manfaat.",
  "Saya bersedia diaudit dan memperbaiki kesalahan.",
];
