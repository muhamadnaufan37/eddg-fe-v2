import { useCallback, useEffect, useState } from "react";
import { FileClock, RefreshCw } from "lucide-react";
import { Modal } from "@/components/global/Modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAuditLogs,
  type AdminPagination,
  type AuditLog,
} from "@/services/barokahiinAdminService";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pager,
} from "./adminUi";
import { formatDate } from "./adminUtils";

export default function AuditLogs() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAuditLogs({ page, per_page: 20 });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal memuat audit log.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            <FileClock className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base sm:text-lg">Audit log</CardTitle>
            <CardDescription className="mt-1">
              Riwayat aktivitas dan perubahan data admin.
            </CardDescription>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-xl"
          aria-label="Muat ulang audit log"
          onClick={() => void load()}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      {error && (
        <CardContent className="pt-0">
          <ErrorState message={error} onRetry={() => void load()} />
        </CardContent>
      )}
      {loading && items.length === 0 ? (
        <LoadingState label="Memuat audit log..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada aktivitas"
          description="Aktivitas admin akan tampil setelah perubahan dilakukan."
        />
      ) : (
        <>
          <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:px-5">
            {items.map((log) => (
              <article
                key={log.id}
                className="rounded-2xl border border-border/70 bg-card p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="wrap-break-word font-semibold">{log.aksi}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {log.actor?.nama_lengkap ??
                        (log.aktor_id ? `Admin #${log.aktor_id}` : "Sistem")}
                      {log.actor?.username ? ` · @${log.actor.username}` : ""}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(log.waktu)}
                  </time>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {log.target_type && (
                    <span className="rounded-lg bg-muted px-2.5 py-1.5 text-muted-foreground">
                      {log.target_type}
                    </span>
                  )}
                  {log.target_id !== null && log.target_id !== undefined && (
                    <span className="rounded-lg bg-muted px-2.5 py-1.5 font-mono text-muted-foreground">
                      ID {log.target_id}
                    </span>
                  )}
                </div>
                {(log.sebelum || log.sesudah) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-lg"
                    onClick={() => setSelectedLog(log)}
                  >
                    Lihat perubahan
                  </Button>
                )}
              </article>
            ))}
          </CardContent>
          <Pager pagination={pagination} onChange={setPage} />
        </>
      )}
    </Card>
    {selectedLog && (
      <Modal
        isOpen
        onClose={() => setSelectedLog(null)}
        title="Detail perubahan audit"
        size="xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="wrap-break-word font-semibold">{selectedLog.aksi}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedLog.actor?.nama_lengkap ??
                (selectedLog.aktor_id ? `Admin #${selectedLog.aktor_id}` : "Sistem")}
              {selectedLog.actor?.username
                ? ` · @${selectedLog.actor.username}`
                : ""}
              {" · "}
              {formatDate(selectedLog.waktu)}
            </p>
            {(selectedLog.target_type ||
              (selectedLog.target_id !== null &&
                selectedLog.target_id !== undefined)) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedLog.target_type ?? "Target"}
                {selectedLog.target_id !== null &&
                selectedLog.target_id !== undefined
                  ? ` · ID ${selectedLog.target_id}`
                  : ""}
              </p>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {selectedLog.sebelum && (
              <JsonValue title="Sebelum" value={selectedLog.sebelum} />
            )}
            {selectedLog.sesudah && (
              <JsonValue title="Sesudah" value={selectedLog.sesudah} />
            )}
          </div>
        </div>
      </Modal>
    )}
    </>
  );
}

function JsonValue({
  title,
  value,
}: {
  title: string;
  value: Record<string, unknown>;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word rounded-lg bg-background p-3 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
