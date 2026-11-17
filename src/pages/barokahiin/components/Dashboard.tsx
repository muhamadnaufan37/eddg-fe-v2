import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Banknote,
  ClipboardCheck,
  PackageOpen,
  RefreshCw,
  ShoppingBasket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getBarokahiinDashboard,
  type BarokahiinDashboard,
} from "@/services/barokahiinAdminService";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "./adminUi";
import { formatMoney } from "./adminUtils";

export default function Dashboard() {
  const [data, setData] = useState<BarokahiinDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getBarokahiinDashboard());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal memuat ringkasan dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) return <LoadingState label="Memuat ringkasan..." />;
  if (error && !data) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <EmptyState title="Data belum tersedia" description="Ringkasan Barokahiin belum dapat ditampilkan." />;

  const metrics = [
    {
      title: "Antrean permintaan baru",
      value: data.antrean_permintaan_baru,
      icon: ShoppingBasket,
      style: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      title: "Menunggu pembayaran",
      value: data.menunggu_pembayaran,
      icon: ClipboardCheck,
      style: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    },
    {
      title: "Dana bulan ini",
      value: formatMoney(data.dana_bulan_ini_rupiah),
      icon: Banknote,
      style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    },
  ];

  const statusItems = Object.entries(data.barang_per_status).sort(
    ([first], [second]) => first.localeCompare(second),
  );
  const maxStatusCount = Math.max(1, ...statusItems.map(([, count]) => count));

  return (
    <div className="space-y-5">
      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ title, value, icon: Icon, style }) => (
          <Card
            key={title}
            className="rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="flex min-h-32 items-start justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {title}
                </p>
                <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
              </div>
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${style}`}
              >
                <Icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <PackageOpen className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base sm:text-lg">
                Status barang
              </CardTitle>
              <CardDescription className="mt-1">
                Distribusi barang pada seluruh tahap pengelolaan.
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            aria-label="Muat ulang dashboard"
            onClick={() => void load()}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0 sm:px-6">
          {statusItems.length === 0 ? (
            <EmptyState
              title="Belum ada data barang"
              description="Status barang akan muncul setelah data tersedia."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {statusItems.map(([status, count]) => (
                <div
                  key={status}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge value={status} />
                    <span className="text-xl font-bold tabular-nums">
                      {count.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{
                        width: `${Math.min(100, (count / maxStatusCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpRight className="size-3.5" />
            Periksa antrean terbaru di menu Permintaan & Keuangan.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
