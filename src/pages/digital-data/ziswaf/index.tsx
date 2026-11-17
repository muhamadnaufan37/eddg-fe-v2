import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  HandCoins,
  Heart,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getRoleName } from "@/constants/roles";
import useAuth from "@/hooks/useAuth";
import {
  createDonation,
  createWithdrawal,
  getAdminDonations,
  getDonation,
  getMyDonations,
  getWithdrawal,
  getWithdrawals,
  type DonationStatus,
  type DonationType,
  type ZiswafDonation,
  type ZiswafPagination,
  type ZiswafWithdrawal,
} from "@/services/ziswafService";

type View = "mine" | "admin" | "withdrawals";
type PageResult<T> = { items: T[]; pagination: ZiswafPagination };

const donationTypes: { value: DonationType; label: string }[] = [
  { value: "zakat", label: "Zakat" },
  { value: "infaq", label: "Infaq" },
  { value: "sedekah", label: "Sedekah" },
  { value: "wakaf", label: "Wakaf" },
];

const statusLabels: Record<DonationStatus, string> = {
  processing: "Diproses",
  pending: "Menunggu pembayaran",
  success: "Berhasil",
  expired: "Kedaluwarsa",
  failed: "Gagal",
};

const statusStyles: Record<DonationStatus, string> = {
  processing:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  pending:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  expired:
    "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  failed:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
};

const initialPagination: ZiswafPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
};

function formatRupiah(amount?: number | null) {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) {
    return "—";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function errorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as {
      response?: { data?: { message?: string } };
    }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

function DonationStatusBadge({ status }: { status: DonationStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("px-2.5 py-1 text-xs font-semibold", statusStyles[status])}
    >
      {statusLabels[status]}
    </Badge>
  );
}

function Pager({
  pagination,
  onChange,
}: {
  pagination: ZiswafPagination;
  onChange: (page: number, perPage: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-100 px-4 py-4 text-sm dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
        <span>Tampilkan</span>
        <Select
          value={String(pagination.per_page)}
          onValueChange={(value) => onChange(1, Number(value))}
        >
          <SelectTrigger
            className="h-9 w-[4.5rem] bg-background"
            aria-label="Jumlah transaksi per halaman"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 15, 25, 50, 100].map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>
          dari <strong>{pagination.total}</strong> transaksi
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="whitespace-nowrap text-muted-foreground">
          Halaman {pagination.current_page} dari {pagination.last_page}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagination.current_page <= 1}
            onClick={() =>
              onChange(pagination.current_page - 1, pagination.per_page)
            }
          >
            Sebelumnya
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagination.current_page >= pagination.last_page}
            onClick={() =>
              onChange(pagination.current_page + 1, pagination.per_page)
            }
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ZiswafPage() {
  const { user } = useAuth();
  const isAdmin = ["admin", "bendahara"].includes(getRoleName(user?.role_id));
  const [view, setView] = useState<View>("mine");
  const [amount, setAmount] = useState("");
  const [donationType, setDonationType] = useState<DonationType>("infaq");
  const [creatingDonation, setCreatingDonation] = useState(false);
  const [currentDonation, setCurrentDonation] = useState<ZiswafDonation | null>(
    null,
  );
  const requestId = useRef<string | null>(null);

  const [donations, setDonations] = useState<ZiswafDonation[]>([]);
  const [withdrawals, setWithdrawals] = useState<ZiswafWithdrawal[]>([]);
  const [pagination, setPagination] =
    useState<ZiswafPagination>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [checkingId, setCheckingId] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [creatingWithdrawal, setCreatingWithdrawal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<ZiswafWithdrawal | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      let result: PageResult<ZiswafDonation | ZiswafWithdrawal>;
      if (view === "withdrawals") {
        result = await getWithdrawals(page, perPage);
        setWithdrawals(result.items as ZiswafWithdrawal[]);
      } else if (view === "admin" && isAdmin) {
        result = await getAdminDonations(page, perPage, {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(typeFilter ? { donation_type: typeFilter } : {}),
        });
        setDonations(result.items as ZiswafDonation[]);
      } else {
        result = await getMyDonations(page, perPage);
        setDonations(result.items as ZiswafDonation[]);
      }
      setPagination(result.pagination);
    } catch (error) {
      const message = errorMessage(error, "Gagal memuat data ZISWAF.");
      setListError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, perPage, statusFilter, typeFilter, view]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const changeView = (nextView: View) => {
    setView(nextView);
    setPage(1);
    setSelectedWithdrawal(null);
  };

  const handlePageChange = (nextPage: number, nextPerPage: number) => {
    setPage(nextPage);
    setPerPage(nextPerPage);
  };

  const handleCreateDonation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount < 1000 || parsedAmount > 5000000) {
      toast.error("Masukkan nominal antara Rp1.000 dan Rp5.000.000.");
      return;
    }
    if (!requestId.current) {
      if (!globalThis.crypto?.randomUUID) {
        toast.error("Browser ini belum mendukung pembuatan ID transaksi yang aman.");
        return;
      }
      requestId.current = globalThis.crypto.randomUUID();
    }

    setCreatingDonation(true);
    try {
      const donation = await createDonation({
        request_id: requestId.current,
        donation_type: donationType,
        amount: parsedAmount,
      });
      requestId.current = null;
      setCurrentDonation(donation);
      setAmount("");
      setPage(1);
      await loadList();
      toast.success(
        donation.status === "processing"
          ? "Permintaan donasi sedang diproses."
          : "QRIS donasi berhasil dibuat.",
      );
    } catch (error) {
      const responseStatus =
        typeof error === "object" &&
        error !== null &&
        "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      if (responseStatus === 422 || responseStatus === 403) {
        requestId.current = null;
      }
      toast.error(errorMessage(error, "QRIS gagal dibuat. Silakan coba lagi."));
    } finally {
      setCreatingDonation(false);
    }
  };

  const handleCheckStatus = async (donation: ZiswafDonation) => {
    setCheckingId(donation.uuid);
    try {
      const latest = await getDonation(donation.uuid);
      setDonations((current) =>
        current.map((item) => (item.uuid === latest.uuid ? latest : item)),
      );
      setCurrentDonation(latest);
      toast.success(`Status donasi: ${statusLabels[latest.status]}.`);
    } catch (error) {
      const retryAfter =
        typeof error === "object" &&
        error !== null &&
        "response" in error
          ? (error as { response?: { headers?: Record<string, string> } }).response
              ?.headers?.["retry-after"]
          : undefined;
      const suffix = retryAfter
        ? ` Coba kembali dalam ${retryAfter} detik.`
        : "";
      toast.error(`${errorMessage(error, "Gagal memeriksa status.")}${suffix}`);
    } finally {
      setCheckingId("");
    }
  };

  const handleCreateWithdrawal = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const parsedAmount = Number(withdrawalAmount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      toast.error("Masukkan nominal penarikan yang valid.");
      return;
    }
    setCreatingWithdrawal(true);
    try {
      const withdrawal = await createWithdrawal(parsedAmount);
      setWithdrawalAmount("");
      setSelectedWithdrawal(withdrawal);
      setPage(1);
      await loadList();
      toast.success("Permintaan penarikan berhasil diajukan.");
    } catch (error) {
      toast.error(errorMessage(error, "Gagal mengajukan penarikan."));
    } finally {
      setCreatingWithdrawal(false);
    }
  };

  const handleWithdrawalDetail = async (withdrawal: ZiswafWithdrawal) => {
    setSelectedWithdrawal(withdrawal);
    try {
      const latest = await getWithdrawal(withdrawal.uuid);
      setSelectedWithdrawal(latest);
      setWithdrawals((current) =>
        current.map((item) => (item.uuid === latest.uuid ? latest : item)),
      );
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memuat detail penarikan."));
    }
  };

  const tabs: { value: View; label: string }[] = [
    { value: "mine", label: "Donasi Saya" },
    ...(isAdmin
      ? [
          { value: "admin" as const, label: "Semua Donasi" },
          { value: "withdrawals" as const, label: "Penarikan" },
        ]
      : []),
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-3 py-4 text-foreground sm:px-5 sm:py-6 lg:px-8">
      <header className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-5 py-6 text-white shadow-lg shadow-emerald-950/10 sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[28px] border-white/[0.06]"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-36 right-28 h-64 w-64 rounded-full border border-white/10"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-4 gap-1.5 border-white/25 bg-white/10 px-3 py-1 text-emerald-50"
            >
              <ShieldCheck className="size-3.5" />
              Pembayaran QRIS aman
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              ZISWAF Digital
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/90 sm:text-base">
              Salurkan zakat, infaq, sedekah, dan wakaf dengan mudah. Buat
              transaksi QRIS dan pantau statusnya dari satu tempat.
            </p>
          </div>
          <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 pr-5 backdrop-blur-sm">
            <span className="flex size-12 items-center justify-center rounded-xl bg-white/10">
              <HandCoins className="size-6 text-emerald-100" />
            </span>
            <div>
              <p className="text-sm font-semibold">Berbagi kebaikan</p>
              <p className="text-xs text-emerald-100/80">
                Mudah, tercatat, transparan
              </p>
            </div>
          </div>
        </div>
      </header>

      <nav
        aria-label="Menu ZISWAF"
        className="flex gap-1.5 overflow-x-auto rounded-2xl border border-border/70 bg-card p-1.5 shadow-sm"
      >
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            variant={view === tab.value ? "default" : "ghost"}
            onClick={() => changeView(tab.value)}
            aria-pressed={view === tab.value}
            className={`h-10 shrink-0 rounded-xl px-4 text-sm ${
              view === tab.value
                ? "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </nav>

      {view === "mine" && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="h-fit overflow-hidden rounded-3xl border-border/70 shadow-sm">
            <CardHeader className="space-y-1.5 border-b border-border/60 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Heart className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-lg">Buat donasi</CardTitle>
                  <CardDescription className="mt-1 leading-5">
                    Pilih jenis dan nominal donasi untuk membuat QRIS.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-5 pt-5 sm:px-6">
              <form className="space-y-4" onSubmit={handleCreateDonation}>
                <div className="space-y-2">
                  <Label htmlFor="donation-type">Jenis donasi</Label>
                  <Select
                    value={donationType}
                    onValueChange={(value) =>
                      setDonationType(value as DonationType)
                    }
                  >
                    <SelectTrigger
                      id="donation-type"
                      className="h-11 w-full rounded-xl bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {donationTypes.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donation-amount">Nominal donasi</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="donation-amount"
                      type="number"
                      min={1000}
                      max={5000000}
                      step={1}
                      required
                      inputMode="numeric"
                      placeholder="Contoh: 10000"
                      className="h-11 rounded-xl pl-10 text-base"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimal Rp1.000 dan maksimal Rp5.000.000.
                  </p>
                </div>
                <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs leading-5 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  <p>
                    Total bayar dapat mencakup kode unik dari penyedia QRIS.
                    Nilai final akan ditampilkan setelah QR dibuat.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={creatingDonation}
                  className="h-11 w-full rounded-xl bg-emerald-700 font-semibold text-white shadow-sm hover:bg-emerald-800"
                >
                  {creatingDonation ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <HandCoins className="size-4" />
                  )}
                  {creatingDonation ? "Membuat QRIS..." : "Buat QRIS donasi"}
                </Button>
              </form>
            </CardContent>

            {currentDonation && (
              <Card className="mx-5 mb-5 overflow-hidden rounded-2xl border-emerald-200 bg-emerald-50/60 shadow-none dark:border-emerald-900 dark:bg-emerald-950/20 sm:mx-6 sm:mb-6">
                <CardHeader className="space-y-1 px-4 pb-3 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">QRIS donasi</CardTitle>
                    <DonationStatusBadge status={currentDonation.status} />
                  </div>
                  <CardDescription>
                    {donationTypes.find(
                      (item) => item.value === currentDonation.donation_type,
                    )?.label ?? currentDonation.donation_type}{" "}
                    · {formatRupiah(currentDonation.amount)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4">
                  {currentDonation.qris_image || currentDonation.qr_url ? (
                    <div className="flex flex-col items-center rounded-xl border border-emerald-100 bg-white p-4 dark:border-emerald-900 dark:bg-background">
                      <img
                        src={
                          currentDonation.qris_image ??
                          currentDonation.qr_url ??
                          ""
                        }
                        alt="QRIS pembayaran donasi"
                        className="aspect-square max-h-56 w-full max-w-56 object-contain"
                      />
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        Pindai QRIS ini menggunakan aplikasi pembayaran Anda.
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">
                      QR sedang disiapkan. Periksa kembali status transaksi dari
                      daftar donasi.
                    </p>
                  )}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        Nominal donasi
                      </span>
                      <strong>{formatRupiah(currentDonation.amount)}</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        Kode unik ditambahkan ke tagihan
                      </span>
                      <strong>
                        {formatRupiah(currentDonation.amount_uniq)}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        Biaya layanan (dipotong dari merchant)
                      </span>
                      <strong>
                        {formatRupiah(currentDonation.admin_fee)}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-emerald-200 pt-3 dark:border-emerald-900">
                      <span className="font-semibold">Total yang dibayar</span>
                      <strong className="text-emerald-800 dark:text-emerald-300">
                        {formatRupiah(
                          currentDonation.total_amount ??
                            currentDonation.amount,
                        )}
                      </strong>
                    </div>
                  </div>
                  {currentDonation.payment_url && (
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 w-full rounded-xl border-emerald-700/40 text-emerald-900 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-950"
                    >
                      <a
                        href={currentDonation.payment_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Buka halaman pembayaran{" "}
                        <ArrowUpRight className="size-4" />
                      </a>
                    </Button>
                  )}
                  {currentDonation.expired_at && (
                    <p className="text-center text-xs text-muted-foreground">
                      Berlaku sampai {formatDate(currentDonation.expired_at)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </Card>

          <DonationList
            title="Riwayat donasi saya"
            donations={donations}
            loading={loading}
            error={listError}
            pagination={pagination}
            onPageChange={handlePageChange}
            onRefresh={() => void loadList()}
            checkingId={checkingId}
            onCheckStatus={handleCheckStatus}
          />
        </section>
      )}

      {view === "admin" && isAdmin && (
        <section className="space-y-4">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold">Semua donasi</h2>
                  <p className="text-sm text-muted-foreground">
                    Data seluruh transaksi donasi ZISWAF.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) => {
                    setStatusFilter(value === "all" ? "" : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    aria-label="Filter status donasi"
                    className="h-10 w-full rounded-xl bg-background sm:w-44"
                  >
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={typeFilter || "all"}
                  onValueChange={(value) => {
                    setTypeFilter(value === "all" ? "" : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    aria-label="Filter jenis donasi"
                    className="h-10 w-full rounded-xl bg-background sm:w-40"
                  >
                    <SelectValue placeholder="Semua jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua jenis</SelectItem>
                    {donationTypes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadList()}
                  className="col-span-2 h-10 rounded-xl px-3 sm:col-span-1"
                >
                  <RefreshCw className="size-4" /> Muat ulang
                </Button>
              </div>
            </CardContent>
          </Card>
          <DonationList
            title="Daftar transaksi"
            donations={donations}
            loading={loading}
            error={listError}
            pagination={pagination}
            onPageChange={handlePageChange}
            onRefresh={() => void loadList()}
            checkingId={checkingId}
            onCheckStatus={handleCheckStatus}
            showDonor
          />
        </section>
      )}

      {view === "withdrawals" && isAdmin && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <Card className="h-fit overflow-hidden rounded-3xl border-border/70 shadow-sm">
            <CardHeader className="space-y-1.5 border-b border-border/60 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Wallet className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-lg">Ajukan penarikan</CardTitle>
                  <CardDescription className="mt-1 leading-5">
                    Penarikan diproses sesuai konfigurasi rekening organisasi.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-5 pt-5 sm:px-6">
              <form className="space-y-4" onSubmit={handleCreateWithdrawal}>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-amount">Nominal penarikan</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="withdrawal-amount"
                      type="number"
                      min={1}
                      step={1}
                      required
                      inputMode="numeric"
                      value={withdrawalAmount}
                      onChange={(event) =>
                        setWithdrawalAmount(event.target.value)
                      }
                      placeholder="Masukkan nominal"
                      className="h-11 rounded-xl pl-10"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3.5 text-xs leading-5 text-blue-950 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100">
                  Rekening tujuan dan PIN dikelola di server. Frontend tidak
                  mengirim atau menyimpan kredensial penarikan.
                </div>
                <Button
                  type="submit"
                  disabled={creatingWithdrawal}
                  className="h-11 w-full rounded-xl bg-emerald-700 font-semibold text-white hover:bg-emerald-800"
                >
                  {creatingWithdrawal && (
                    <LoaderCircle className="size-4 animate-spin" />
                  )}
                  Ajukan penarikan
                </Button>
              </form>
              {selectedWithdrawal && (
                <WithdrawalDetails withdrawal={selectedWithdrawal} />
              )}
            </CardContent>
          </Card>
          <WithdrawalList
            withdrawals={withdrawals}
            loading={loading}
            error={listError}
            pagination={pagination}
            onPageChange={handlePageChange}
            onRefresh={() => void loadList()}
            onSelect={handleWithdrawalDetail}
          />
        </section>
      )}
    </main>
  );
}

function DonationList({
  title,
  donations,
  loading,
  error,
  pagination,
  onPageChange,
  onRefresh,
  checkingId,
  onCheckStatus,
  showDonor = false,
}: {
  title: string;
  donations: ZiswafDonation[];
  loading: boolean;
  error: string;
  pagination: ZiswafPagination;
  onPageChange: (page: number, perPage: number) => void;
  onRefresh: () => void;
  checkingId: string;
  onCheckStatus: (donation: ZiswafDonation) => void;
  showDonor?: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          <CardDescription className="mt-1">
            Nominal bayar mengikuti total dari gateway QRIS.
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={onRefresh}
          variant="outline"
          size="icon"
          aria-label="Muat ulang daftar donasi"
          className="size-10 shrink-0 rounded-xl"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </CardHeader>
      {error && (
        <div className="mx-5 mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive sm:mx-6">
          {error}
        </div>
      )}
      {loading && donations.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" /> Memuat transaksi...
        </div>
      ) : donations.length === 0 ? (
        <CardContent className="px-5 pb-10 pt-5 text-center sm:pb-12">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <HandCoins className="size-6" />
          </span>
          <p className="mt-4 font-semibold">Belum ada transaksi donasi</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Transaksi yang dibuat akan tampil di sini.
          </p>
        </CardContent>
      ) : (
        <>
          <CardContent className="space-y-4 px-4 pb-4 pt-0 sm:px-5">
            <div className="space-y-3 md:hidden">
              {donations.map((donation) => (
                <DonationCard
                  key={donation.uuid}
                  donation={donation}
                  showDonor={showDonor}
                  checking={checkingId === donation.uuid}
                  onCheckStatus={() => onCheckStatus(donation)}
                />
              ))}
            </div>
            <div className="hidden md:block">
              <Table className="min-w-[760px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    {showDonor && (
                      <TableHead className="h-11 pl-4 text-xs uppercase tracking-wide text-muted-foreground">
                        Donatur
                      </TableHead>
                    )}
                    <TableHead className="h-11 text-xs uppercase tracking-wide text-muted-foreground">
                      Jenis
                    </TableHead>
                    <TableHead className="h-11 text-xs uppercase tracking-wide text-muted-foreground">
                      Nominal donasi
                    </TableHead>
                    <TableHead className="h-11 text-xs uppercase tracking-wide text-muted-foreground">
                      Total bayar
                    </TableHead>
                    <TableHead className="h-11 text-xs uppercase tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="h-11 text-xs uppercase tracking-wide text-muted-foreground">
                      Dibuat
                    </TableHead>
                    <TableHead className="h-11 pr-4 text-xs uppercase tracking-wide text-muted-foreground">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.uuid}>
                      {showDonor && (
                        <TableCell className="pl-4 font-medium">
                          {donation.user?.nama_lengkap ??
                            donation.user?.name ??
                            "—"}
                        </TableCell>
                      )}
                      <TableCell className="capitalize">
                        {donation.donation_type}
                      </TableCell>
                      <TableCell>{formatRupiah(donation.amount)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatRupiah(donation.total_amount ?? donation.amount)}
                      </TableCell>
                      <TableCell>
                        <DonationStatusBadge status={donation.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(donation.created_at)}
                      </TableCell>
                      <TableCell className="pr-4">
                        {["pending", "processing"].includes(donation.status) && (
                          <Button
                            type="button"
                            disabled={checkingId === donation.uuid}
                            onClick={() => onCheckStatus(donation)}
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                          >
                            <RefreshCw
                              className={cn(
                                "size-3.5",
                                checkingId === donation.uuid && "animate-spin",
                              )}
                            />
                            Cek status
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <Pager pagination={pagination} onChange={onPageChange} />
        </>
      )}
    </Card>
  );
}

function DonationCard({
  donation,
  showDonor,
  checking,
  onCheckStatus,
}: {
  donation: ZiswafDonation;
  showDonor: boolean;
  checking: boolean;
  onCheckStatus: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card shadow-none">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {showDonor && (
              <p className="mb-1 truncate text-sm font-semibold">
                {donation.user?.nama_lengkap ??
                  donation.user?.name ??
                  "Donatur"}
              </p>
            )}
            <p className="text-sm font-bold capitalize">
              {donation.donation_type}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(donation.created_at)}
            </p>
          </div>
          <DonationStatusBadge status={donation.status} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3">
          <div>
            <p className="text-xs text-muted-foreground">Nominal donasi</p>
            <p className="mt-1 text-sm font-semibold">
              {formatRupiah(donation.amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total bayar</p>
            <p className="mt-1 text-sm font-semibold">
              {formatRupiah(donation.total_amount ?? donation.amount)}
            </p>
          </div>
        </div>
        {["pending", "processing"].includes(donation.status) && (
          <Button
            type="button"
            variant="outline"
            disabled={checking}
            onClick={onCheckStatus}
            className="mt-3 h-10 w-full rounded-xl"
          >
            <RefreshCw className={cn("size-4", checking && "animate-spin")} />
            Cek status pembayaran
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function WithdrawalList({
  withdrawals,
  loading,
  error,
  pagination,
  onPageChange,
  onRefresh,
  onSelect,
}: {
  withdrawals: ZiswafWithdrawal[];
  loading: boolean;
  error: string;
  pagination: ZiswafPagination;
  onPageChange: (page: number, perPage: number) => void;
  onRefresh: () => void;
  onSelect: (withdrawal: ZiswafWithdrawal) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg">
            Riwayat penarikan
          </CardTitle>
          <CardDescription className="mt-1">
            Periksa status dan biaya akhir dari gateway.
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={onRefresh}
          variant="outline"
          size="icon"
          aria-label="Muat ulang daftar penarikan"
          className="size-10 shrink-0 rounded-xl"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </CardHeader>
      {error && (
        <div className="mx-5 mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive sm:mx-6">
          {error}
        </div>
      )}
      {loading && withdrawals.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" /> Memuat penarikan...
        </div>
      ) : withdrawals.length === 0 ? (
        <CardContent className="px-5 pb-10 pt-5 text-center sm:pb-12">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Wallet className="size-6" />
          </span>
          <p className="mt-4 font-semibold">Belum ada permintaan penarikan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pengajuan penarikan akan tercatat di sini.
          </p>
        </CardContent>
      ) : (
        <>
          <CardContent className="space-y-4 px-4 pb-4 pt-0 sm:px-5">
            <div className="space-y-3 md:hidden">
              {withdrawals.map((withdrawal) => (
                <WithdrawalCard
                  key={withdrawal.uuid}
                  withdrawal={withdrawal}
                  onSelect={() => onSelect(withdrawal)}
                />
              ))}
            </div>
            <div className="hidden md:block">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    {["Nominal", "Biaya", "Diterima", "Status", "Dibuat"].map(
                      (heading) => (
                        <TableHead
                          key={heading}
                          className="h-11 text-xs uppercase tracking-wide text-muted-foreground"
                        >
                          {heading}
                        </TableHead>
                      ),
                    )}
                    <TableHead className="h-11 pr-4 text-xs uppercase tracking-wide text-muted-foreground">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.uuid}>
                      <TableCell className="font-semibold">
                        {formatRupiah(withdrawal.amount)}
                      </TableCell>
                      <TableCell>{formatRupiah(withdrawal.fee)}</TableCell>
                      <TableCell>
                        {formatRupiah(withdrawal.net_amount)}
                      </TableCell>
                      <TableCell>
                        <WithdrawalStatus status={withdrawal.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(withdrawal.created_at)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <Button
                          type="button"
                          onClick={() => onSelect(withdrawal)}
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <Pager pagination={pagination} onChange={onPageChange} />
        </>
      )}
    </Card>
  );
}

function WithdrawalCard({
  withdrawal,
  onSelect,
}: {
  withdrawal: ZiswafWithdrawal;
  onSelect: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold">{formatRupiah(withdrawal.amount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(withdrawal.created_at)}
            </p>
          </div>
          <WithdrawalStatus status={withdrawal.status} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Biaya</p>
            <p className="mt-1 font-semibold">{formatRupiah(withdrawal.fee)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Diterima</p>
            <p className="mt-1 font-semibold">
              {formatRupiah(withdrawal.net_amount)}
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onSelect}
          variant="outline"
          className="mt-3 h-10 w-full rounded-xl"
        >
          Lihat detail
        </Button>
      </CardContent>
    </Card>
  );
}

function WithdrawalStatus({ status }: { status: string }) {
  const success = ["success", "approved", "completed"].includes(
    status.toLowerCase(),
  );
  const pending = status.toLowerCase() === "pending";
  const failed = ["failed", "rejected", "expired"].includes(
    status.toLowerCase(),
  );
  const style = success
    ? statusStyles.success
    : pending
      ? statusStyles.pending
      : failed
        ? statusStyles.failed
        : "border-border bg-muted text-muted-foreground";
  return (
    <Badge
      variant="outline"
      className={cn("px-2.5 py-1 text-xs font-semibold capitalize", style)}
    >
      {status || "—"}
    </Badge>
  );
}

function WithdrawalDetails({
  withdrawal,
}: {
  withdrawal: ZiswafWithdrawal;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-emerald-200/80 bg-emerald-50/50 shadow-none dark:border-emerald-900/70 dark:bg-emerald-950/20">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 pb-3 pt-4">
        <CardTitle className="text-base">Detail penarikan</CardTitle>
        <WithdrawalStatus status={withdrawal.status} />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Nominal</dt>
            <dd className="font-semibold">{formatRupiah(withdrawal.amount)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Biaya gateway</dt>
            <dd className="font-semibold">{formatRupiah(withdrawal.fee)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Nominal diterima</dt>
            <dd className="font-semibold">
              {formatRupiah(withdrawal.net_amount)}
            </dd>
          </div>
          {withdrawal.transaction_id && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">ID transaksi</dt>
              <dd className="max-w-[60%] break-all text-right font-mono text-xs">
                {withdrawal.transaction_id}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
