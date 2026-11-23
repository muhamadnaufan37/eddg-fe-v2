import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Ban,
  CheckCircle2,
  Clock,
  FileEdit,
  Hourglass,
  Info,
  Package,
  PauseCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getWilayahDistricts,
  getWilayahProvinces,
  getWilayahRegencies,
  getWilayahVillages,
  type ItemGrade,
  type PaginationMeta,
} from "@/services/barokahiin";
import { GRADE_GUIDELINES, PILOT_REGIONS, formatRupiah } from "./utils";

interface BadgeStyle {
  bg: string;
  text: string;
  border: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const STATUS_MAP: Record<string, BadgeStyle> = {
  aktif: {
    bg: "var(--daun-muda)",
    text: "var(--daun-tua)",
    border: "var(--daun)",
    label: "Aktif",
    icon: CheckCircle2,
  },
  terverifikasi: {
    bg: "var(--daun-muda)",
    text: "var(--daun-tua)",
    border: "var(--daun)",
    label: "Terverifikasi",
    icon: ShieldCheck,
  },
  terbit: {
    bg: "var(--daun-muda)",
    text: "var(--daun-tua)",
    border: "var(--daun)",
    label: "Terbit",
    icon: CheckCircle2,
  },
  selesai: {
    bg: "var(--daun-muda)",
    text: "var(--daun-tua)",
    border: "var(--daun)",
    label: "Selesai",
    icon: CheckCircle2,
  },
  dilaporkan: {
    bg: "var(--daun-muda)",
    text: "var(--daun-tua)",
    border: "var(--daun)",
    label: "Dilaporkan",
    icon: CheckCircle2,
  },
  disetujui: {
    bg: "var(--daun-muda)",
    text: "var(--daun-tua)",
    border: "var(--daun)",
    label: "Disetujui",
    icon: CheckCircle2,
  },
  berjalan: {
    bg: "var(--indigo-muda)",
    text: "var(--indigo)",
    border: "var(--indigo)",
    label: "Berjalan",
    icon: Clock,
  },
  dibayar: {
    bg: "var(--indigo-muda)",
    text: "var(--indigo)",
    border: "var(--indigo)",
    label: "Dibayar",
    icon: CheckCircle2,
  },
  disiapkan: {
    bg: "var(--indigo-muda)",
    text: "var(--indigo)",
    border: "var(--indigo)",
    label: "Disiapkan",
    icon: Package,
  },
  siap_diambil: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Siap diambil",
    icon: Package,
  },
  dikirim: {
    bg: "var(--indigo-muda)",
    text: "var(--indigo)",
    border: "var(--indigo)",
    label: "Dikirim",
    icon: Truck,
  },
  diterima: {
    bg: "var(--daun-muda)",
    text: "var(--daun-tua)",
    border: "var(--daun)",
    label: "Diterima",
    icon: CheckCircle2,
  },
  menunggu_review: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Menunggu review",
    icon: Hourglass,
  },
  diajukan: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Diajukan",
    icon: Hourglass,
  },
  dalam_verifikasi: {
    bg: "var(--indigo-muda)",
    text: "var(--indigo)",
    border: "var(--indigo)",
    label: "Dalam verifikasi",
    icon: Clock,
  },
  perlu_revisi: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Perlu revisi",
    icon: AlertTriangle,
  },
  perlu_perbaikan: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Perlu perbaikan",
    icon: AlertTriangle,
  },
  draft: {
    bg: "var(--kertas)",
    text: "var(--muted-brk)",
    border: "var(--garis-kuat)",
    label: "Draf",
    icon: FileEdit,
  },
  dijeda: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Dijeda",
    icon: PauseCircle,
  },
  ditahan: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Ditahan",
    icon: Clock,
  },
  terjual: {
    bg: "var(--indigo-muda)",
    text: "var(--indigo)",
    border: "var(--indigo)",
    label: "Terjual",
    icon: CheckCircle2,
  },
  ditarik: {
    bg: "var(--kertas)",
    text: "var(--muted-brk)",
    border: "var(--garis-kuat)",
    label: "Ditarik",
    icon: Ban,
  },
  disalurkan: {
    bg: "var(--daun-muda)",
    text: "var(--daun-tua)",
    border: "var(--daun)",
    label: "Disalurkan",
    icon: CheckCircle2,
  },
  ditolak: {
    bg: "var(--bahaya-muda)",
    text: "var(--bahaya)",
    border: "var(--bahaya)",
    label: "Ditolak",
    icon: Ban,
  },
  dibatasi: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Dibatasi",
    icon: ShieldAlert,
  },
  ditangguhkan: {
    bg: "var(--bahaya-muda)",
    text: "var(--bahaya)",
    border: "var(--bahaya)",
    label: "Ditangguhkan",
    icon: ShieldAlert,
  },
  ditutup: {
    bg: "var(--bahaya-muda)",
    text: "var(--bahaya)",
    border: "var(--bahaya)",
    label: "Ditutup",
    icon: Ban,
  },
  komplain: {
    bg: "var(--bahaya-muda)",
    text: "var(--bahaya)",
    border: "var(--bahaya)",
    label: "Komplain",
    icon: AlertCircle,
  },
  refund: {
    bg: "var(--bahaya-muda)",
    text: "var(--bahaya)",
    border: "var(--bahaya)",
    label: "Refund",
    icon: AlertCircle,
  },
  dibatalkan_refund: {
    bg: "var(--bahaya-muda)",
    text: "var(--bahaya)",
    border: "var(--bahaya)",
    label: "Batal dan refund",
    icon: Ban,
  },
  ringan: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Sanksi ringan",
    icon: AlertTriangle,
  },
  sedang: {
    bg: "var(--kunyit-muda)",
    text: "var(--peringatan-teks)",
    border: "var(--kunyit)",
    label: "Sanksi sedang",
    icon: ShieldAlert,
  },
  berat: {
    bg: "var(--bahaya-muda)",
    text: "var(--bahaya)",
    border: "var(--bahaya)",
    label: "Sanksi berat",
    icon: Ban,
  },
};

export function StatusBadge({ value }: { value?: string | null }) {
  const key = (value ?? "").toLowerCase();
  const cfg = STATUS_MAP[key] ?? {
    bg: "var(--kertas)",
    text: "var(--muted-brk)",
    border: "var(--garis-kuat)",
    label: value ? value.replaceAll("_", " ") : "Belum diatur",
    icon: Info,
  };
  const Icon = cfg.icon;

  return (
    <Badge
      variant="outline"
      className="gap-1.5 whitespace-nowrap px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        borderColor: cfg.border,
      }}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{cfg.label}</span>
    </Badge>
  );
}

export function GradeBadge({ grade }: { grade?: ItemGrade | string | null }) {
  if (!grade || !(grade in GRADE_GUIDELINES)) return null;
  const g = grade as ItemGrade;
  return (
    <Badge
      variant="outline"
      className="gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: "var(--indigo-muda)",
        color: "var(--indigo)",
        borderColor: "var(--garis)",
      }}
    >
      <Award className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{GRADE_GUIDELINES[g].label}</span>
    </Badge>
  );
}

export function LevelBadge({ level }: { level?: number | null }) {
  const lvl = level === 3 ? 3 : level === 2 ? 2 : 1;
  const labels: Record<1 | 2 | 3, string> = {
    1: "Level 1, Baru",
    2: "Level 2, Terpercaya",
    3: "Level 3, Utama",
  };
  return (
    <Badge
      variant="outline"
      className="gap-1.5 whitespace-nowrap px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: lvl === 3 ? "var(--daun-muda)" : "var(--indigo-muda)",
        color: lvl === 3 ? "var(--daun-tua)" : "var(--indigo)",
        borderColor: lvl === 3 ? "var(--daun)" : "var(--indigo)",
      }}
    >
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{labels[lvl]}</span>
    </Badge>
  );
}

export function SlaBadge({ hoursRemaining }: { hoursRemaining?: number | null }) {
  if (hoursRemaining === null || hoursRemaining === undefined) return null;
  const overdue = hoursRemaining <= 0;
  const urgent = hoursRemaining > 0 && hoursRemaining <= 12;

  return (
    <Badge
      variant="outline"
      className="brk-num gap-1.5 whitespace-nowrap px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: overdue
          ? "var(--bahaya-muda)"
          : urgent
            ? "var(--kunyit-muda)"
            : "var(--daun-muda)",
        color: overdue
          ? "var(--bahaya)"
          : urgent
            ? "var(--peringatan-teks)"
            : "var(--daun-tua)",
        borderColor: overdue
          ? "var(--bahaya)"
          : urgent
            ? "var(--kunyit)"
            : "var(--daun)",
      }}
    >
      <Clock className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        {overdue
          ? `Lewat SLA ${Math.abs(hoursRemaining)} jam`
          : `Sisa ${hoursRemaining} jam`}
      </span>
    </Badge>
  );
}

export function ConsolePanel({
  title,
  description,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`brk-card overflow-hidden shadow-none ${className}`}>
      <CardHeader
        className="flex flex-col gap-3 space-y-0 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6"
        style={{ borderColor: "var(--garis)" }}
      >
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "var(--indigo-muda)",
                color: "var(--indigo)",
              }}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <CardTitle
              className="brk-display text-lg font-bold leading-snug"
              style={{ color: "var(--tinta)" }}
            >
              {title}
            </CardTitle>
            {description && (
              <CardDescription
                className="mt-1 max-w-[68ch] text-sm"
                style={{ color: "var(--muted-brk)" }}
              >
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  );
}

export function FieldWrapper({
  id,
  label,
  required,
  helper,
  error,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="block text-sm font-semibold"
        style={{ color: "var(--tinta)" }}
      >
        {label}
        {required && (
          <span className="ml-1" style={{ color: "var(--bahaya)" }}>
            *
          </span>
        )}
      </Label>
      {children}
      {helper && !error && (
        <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
          {helper}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium"
          style={{ color: "var(--bahaya)" }}
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
      style={{
        backgroundColor: "var(--bahaya-muda)",
        borderColor: "var(--bahaya)",
        color: "var(--bahaya)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="brk-btn brk-btn-secondary shrink-0"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          <span>Muat ulang</span>
        </Button>
      )}
    </div>
  );
}

export function InfoBanner({
  tone = "warning",
  title,
  message,
  action,
}: {
  tone?: "warning" | "info" | "success" | "danger";
  title: string;
  message: string;
  action?: ReactNode;
}) {
  const palette = {
    warning: {
      bg: "var(--kunyit-muda)",
      border: "var(--kunyit)",
      text: "var(--peringatan-teks)",
      icon: AlertTriangle,
    },
    info: {
      bg: "var(--indigo-muda)",
      border: "var(--indigo)",
      text: "var(--indigo)",
      icon: Info,
    },
    success: {
      bg: "var(--daun-muda)",
      border: "var(--daun)",
      text: "var(--daun-tua)",
      icon: CheckCircle2,
    },
    danger: {
      bg: "var(--bahaya-muda)",
      border: "var(--bahaya)",
      text: "var(--bahaya)",
      icon: ShieldAlert,
    },
  }[tone];
  const Icon = palette.icon;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        color: palette.text,
      }}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-0.5 text-sm">{message}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center" style={{ borderColor: "var(--garis-kuat)" }}>
      <span
        className="flex size-12 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "var(--indigo-muda)",
          color: "var(--indigo)",
        }}
      >
        <Package className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-bold" style={{ color: "var(--tinta)" }}>
        {title}
      </h3>
      <p
        className="mt-1 max-w-md text-sm"
        style={{ color: "var(--muted-brk)" }}
      >
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-20 animate-pulse rounded-xl border"
          style={{
            backgroundColor: "var(--kertas)",
            borderColor: "var(--garis)",
          }}
        />
      ))}
    </div>
  );
}

export function Pager({
  pagination,
  onChange,
}: {
  pagination?: PaginationMeta;
  onChange: (page: number) => void;
}) {
  if (!pagination || pagination.last_page <= 1) return null;
  return (
    <div
      className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: "var(--garis)" }}
    >
      <span className="brk-num" style={{ color: "var(--muted-brk)" }}>
        Menampilkan halaman {pagination.current_page} dari {pagination.last_page} ({pagination.total} data)
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="brk-btn brk-btn-secondary"
          disabled={pagination.current_page <= 1}
          onClick={() => onChange(pagination.current_page - 1)}
        >
          Sebelumnya
        </button>
        <button
          type="button"
          className="brk-btn brk-btn-secondary"
          disabled={pagination.current_page >= pagination.last_page}
          onClick={() => onChange(pagination.current_page + 1)}
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  consequences,
  confirmLabel,
  tone = "primary",
  loading = false,
  onCancel,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  consequences?: string;
  confirmLabel: string;
  tone?: "primary" | "danger" | "daun";
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const btnClass =
    tone === "danger"
      ? "brk-btn brk-btn-danger"
      : tone === "daun"
        ? "brk-btn brk-btn-daun"
        : "brk-btn brk-btn-primary";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brk-confirm-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4"
    >
      <div
        className="brk-float brk-safe-bottom max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-4xl border p-5 sm:p-6"
        style={{
          backgroundColor: "var(--putih)",
          borderColor: "var(--garis)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            id="brk-confirm-title"
            className="text-lg font-bold"
            style={{ color: "var(--tinta)" }}
          >
            {title}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={loading}
            aria-label="Tutup dialog"
            className="size-11 shrink-0 rounded-lg"
            style={{ color: "var(--muted-brk)" }}
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <p className="mt-2 text-sm" style={{ color: "var(--muted-brk)" }}>
          {description}
        </p>

        {consequences && (
          <div
            className="mt-3 rounded-lg border p-3 text-sm"
            style={{
              backgroundColor:
                tone === "danger" ? "var(--bahaya-muda)" : "var(--kunyit-muda)",
              borderColor: tone === "danger" ? "var(--bahaya)" : "var(--kunyit)",
              color:
                tone === "danger" ? "var(--bahaya)" : "var(--peringatan-teks)",
            }}
          >
            {consequences}
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="brk-btn brk-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="button"
            className={btnClass}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_SELECT_SENTINEL = "__EMPTY__";

export interface ConsoleSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function ConsoleSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  disabled,
  className = "",
}: {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: ConsoleSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const mappedValue = value === "" ? EMPTY_SELECT_SENTINEL : value;
  return (
    <Select
      value={mappedValue}
      onValueChange={(v) => onChange(v === EMPTY_SELECT_SENTINEL ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={`min-h-11 w-full rounded-md border-[1.5px] bg-[var(--putih)] text-sm text-[var(--tinta)] ${className}`}
        style={{ borderColor: "var(--garis-kuat)" }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-[70] max-h-72 border bg-white text-gray-900 dark:border-gray-700 dark:bg-[#2a2a2a] dark:text-white">
        {options.map((opt) => (
          <SelectItem
            key={opt.value === "" ? EMPTY_SELECT_SENTINEL : opt.value}
            value={opt.value === "" ? EMPTY_SELECT_SENTINEL : opt.value}
            disabled={opt.disabled}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RegionSelect({
  id,
  value,
  onChange,
  options,
  showCascadingAddress = false,
}: {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options?: Array<{ id: number | string; nama: string }>;
  required?: boolean;
  showCascadingAddress?: boolean;
}) {
  const [provinceCode, setProvinceCode] = useState("32"); // Default Jawa Barat (pilot)
  const [regencyCode, setRegencyCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [villageCode, setVillageCode] = useState("");

  const provincesQuery = useQuery({
    queryKey: ["barokahiin", "public-wilayah", "provinces"],
    queryFn: getWilayahProvinces,
    staleTime: 1000 * 60 * 30,
    enabled: !options || options.length === 0,
  });

  const regenciesQuery = useQuery({
    queryKey: ["barokahiin", "public-wilayah", "regencies", provinceCode],
    queryFn: () => getWilayahRegencies(provinceCode),
    staleTime: 1000 * 60 * 30,
    enabled: Boolean(provinceCode) && (!options || options.length === 0),
  });

  const districtsQuery = useQuery({
    queryKey: ["barokahiin", "public-wilayah", "districts", regencyCode],
    queryFn: () => getWilayahDistricts(regencyCode),
    staleTime: 1000 * 60 * 30,
    enabled: showCascadingAddress && Boolean(regencyCode),
  });

  const villagesQuery = useQuery({
    queryKey: ["barokahiin", "public-wilayah", "villages", districtCode],
    queryFn: () => getWilayahVillages(districtCode),
    staleTime: 1000 * 60 * 30,
    enabled: showCascadingAddress && Boolean(districtCode),
  });

  const provinces = provincesQuery.data ?? [];
  const regencies = regenciesQuery.data ?? [];
  const districts = districtsQuery.data ?? [];
  const villages = villagesQuery.data ?? [];

  if (options && options.length > 0) {
    return (
      <ConsoleSelect
        id={id}
        value={value}
        onChange={onChange}
        placeholder="Pilih wilayah"
        options={options.map((o) => ({ value: String(o.id), label: o.nama }))}
      />
    );
  }

  const regencyOptions: ConsoleSelectOption[] =
    regencies.length > 0
      ? regencies.map((r) => ({
          value: String(r.id ?? r.code),
          label: r.name,
        }))
      : PILOT_REGIONS.map((r) => ({
          value: String(r.id),
          label: `${r.nama} (${r.provinsi})`,
        }));

  if (
    value &&
    !regencyOptions.some((o) => o.value === String(value))
  ) {
    regencyOptions.push({ value: String(value), label: `Wilayah #${value}` });
  }

  return (
    <div className="space-y-2.5">
      {provinces.length > 0 && (
        <div>
          <span
            className="mb-1 block text-xs font-medium"
            style={{ color: "var(--muted-brk)" }}
          >
            Provinsi
          </span>
          <ConsoleSelect
            value={provinceCode}
            onChange={(nextProv) => {
              setProvinceCode(nextProv);
              setRegencyCode("");
              setDistrictCode("");
              setVillageCode("");
            }}
            placeholder="Pilih provinsi"
            options={provinces.map((p) => ({ value: p.code, label: p.name }))}
          />
        </div>
      )}

      <div>
        {provinces.length > 0 && (
          <span
            className="mb-1 block text-xs font-medium"
            style={{ color: "var(--muted-brk)" }}
          >
            Kabupaten / Kota
          </span>
        )}
        <ConsoleSelect
          id={id}
          value={value}
          onChange={(nextVal) => {
            onChange(nextVal);
            const matched = regencies.find(
              (r) => String(r.id ?? r.code) === nextVal || r.code === nextVal,
            );
            setRegencyCode(matched?.code ?? nextVal);
            setDistrictCode("");
            setVillageCode("");
          }}
          placeholder={
            regenciesQuery.isLoading
              ? "Memuat Kabupaten/Kota..."
              : "Pilih Kabupaten/Kota"
          }
          options={regencyOptions}
        />
      </div>

      {showCascadingAddress && districts.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <span
              className="mb-1 block text-xs font-medium"
              style={{ color: "var(--muted-brk)" }}
            >
              Kecamatan
            </span>
            <ConsoleSelect
              value={districtCode}
              onChange={(nextDist) => {
                setDistrictCode(nextDist);
                setVillageCode("");
              }}
              placeholder="Pilih kecamatan"
              options={districts.map((d) => ({ value: d.code, label: d.name }))}
            />
          </div>

          {villages.length > 0 && (
            <div>
              <span
                className="mb-1 block text-xs font-medium"
                style={{ color: "var(--muted-brk)" }}
              >
                Kelurahan / Desa
              </span>
              <ConsoleSelect
                value={villageCode}
                onChange={(nextVil) => {
                  setVillageCode(nextVil);
                  const matched = villages.find((v) => v.code === nextVil);
                  if (matched?.id) onChange(String(matched.id));
                }}
                placeholder="Pilih kelurahan/desa"
                options={villages.map((v) => ({
                  value: v.code,
                  label: v.name,
                }))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RupiahInput({
  id,
  value,
  onChange,
  min,
  step = 500,
  placeholder = "0",
  required,
}: {
  id?: string;
  value: string;
  onChange: (rawDigits: string) => void;
  min?: number;
  step?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const numeric = Number(value) || 0;
  return (
    <div className="space-y-1">
      <div className="relative flex items-center">
        <span
          className="pointer-events-none absolute left-3 text-sm font-bold"
          style={{ color: "var(--muted-brk)" }}
        >
          Rp
        </span>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          step={step}
          className="brk-input brk-num pl-10"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
          placeholder={placeholder}
          required={required}
        />
      </div>
      {numeric > 0 && (
        <p className="brk-num text-xs font-semibold" style={{ color: "var(--indigo)" }}>
          Terbaca: {formatRupiah(numeric)}
        </p>
      )}
    </div>
  );
}

export function KuitansiPreview({
  itemPrice = 100000,
  gatewayFee = 1000,
  koordinatorPct = 40,
  kegiatanPct = 30,
  operasionalPct = 25,
  jaminanPct = 5,
  donaturPct = 0,
}: {
  itemPrice?: number;
  gatewayFee?: number;
  koordinatorPct?: number;
  kegiatanPct?: number;
  operasionalPct?: number;
  jaminanPct?: number;
  donaturPct?: number;
}) {
  const net = Math.max(0, itemPrice - gatewayFee);
  const koor = Math.floor((net * koordinatorPct) / 100);
  const ops = Math.floor((net * operasionalPct) / 100);
  const jam = Math.floor((net * jaminanPct) / 100);
  const don = Math.floor((net * donaturPct) / 100);
  // Sisa pembulatan masuk Dana Kegiatan (PRD 8.5)
  const keg = net - koor - ops - jam - don;

  const rows = [
    { label: `Koordinator wilayah (${koordinatorPct}%)`, value: koor },
    { label: `Dana kegiatan (${kegiatanPct}%)`, value: keg },
    { label: `Operasional (${operasionalPct}%)`, value: ops },
    { label: `Dana jaminan pembeli (${jaminanPct}%)`, value: jam },
    ...(donaturPct > 0
      ? [{ label: `Program donatur (${donaturPct}%)`, value: don }]
      : []),
  ];

  return (
    <div className="brk-receipt p-4 text-sm">
      <p className="brk-display text-base font-bold" style={{ color: "var(--indigo)" }}>
        Pratinjau Kuitansi Kebaikan
      </p>
      <p className="mt-0.5 text-xs" style={{ color: "var(--muted-brk)" }}>
        Simulasi pembagian otomatis per transaksi (sisa pembulatan ke Dana Kegiatan)
      </p>
      <div
        className="my-3 border-t border-dashed"
        style={{ borderColor: "var(--garis-kuat)" }}
      />
      <dl className="space-y-1.5">
        <div className="flex justify-between gap-2">
          <dt style={{ color: "var(--muted-brk)" }}>Harga barang</dt>
          <dd className="brk-num font-semibold">{formatRupiah(itemPrice)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt style={{ color: "var(--muted-brk)" }}>Biaya transaksi</dt>
          <dd className="brk-num">{formatRupiah(-gatewayFee)}</dd>
        </div>
        <div className="flex justify-between gap-2 font-bold">
          <dt>Keuntungan bersih</dt>
          <dd className="brk-num">{formatRupiah(net)}</dd>
        </div>
      </dl>
      <div
        className="my-3 border-t border-dashed"
        style={{ borderColor: "var(--garis-kuat)" }}
      />
      <dl className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-2">
            <dt style={{ color: "var(--muted-brk)" }}>{r.label}</dt>
            <dd className="brk-num font-semibold">{formatRupiah(r.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
