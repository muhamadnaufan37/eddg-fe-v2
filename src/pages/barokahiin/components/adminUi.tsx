import type { ComponentType, ReactNode } from "react";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AdminPagination } from "@/services/barokahiinAdminService";

const stateColors: Record<string, string> = {
  aktif:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  terbit:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  selesai:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  dibayar:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  dikonfirmasi:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  diajukan:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  dikurasi:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  ditolak:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  batal:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  kedaluwarsa:
    "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  terjual:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300",
};

export function StatusBadge({ value }: { value?: string | null }) {
  const label = value?.replaceAll("_", " ") || "—";
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap px-2.5 py-1 text-xs font-semibold capitalize",
        stateColors[value?.toLowerCase() ?? ""] ??
          "border-border bg-muted text-muted-foreground",
      )}
    >
      {label}
    </Badge>
  );
}

export function SectionHeading({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-5 py-5 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          <CardDescription className="mt-1 leading-5">
            {description}
          </CardDescription>
        </div>
      </div>
      {action}
    </CardHeader>
  );
}

export function Panel({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden rounded-3xl border-border/70 shadow-sm", className)}>
      <SectionHeading
        icon={icon}
        title={title}
        description={description}
        action={action}
      />
      {children}
    </Card>
  );
}

export function LoadingState({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        {message}
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-lg"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" />
          Coba lagi
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <AlertCircle className="size-5" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function Pager({
  pagination,
  onChange,
}: {
  pagination?: AdminPagination;
  onChange: (page: number) => void;
}) {
  if (!pagination || pagination.last_page <= 1) return null;
  return (
    <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">
        {pagination.total} data · halaman {pagination.current_page} dari{" "}
        {pagination.last_page}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagination.current_page <= 1}
          onClick={() => onChange(pagination.current_page - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagination.current_page >= pagination.last_page}
          onClick={() => onChange(pagination.current_page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <CardContent className="px-5 pb-5 pt-0 sm:px-6">{children}</CardContent>;
}
