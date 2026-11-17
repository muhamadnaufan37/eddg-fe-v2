import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BadgeDollarSign,
  FilePlus2,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/global/Modal";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cancelPurchaseRequest,
  confirmPurchaseRequest,
  createSalesCorrection,
  fulfillPurchaseRequest,
  getPurchaseRequest,
  getPurchaseRequests,
  getSales,
  getSalesReport,
  recordPurchasePayment,
  rejectPurchaseRequest,
  updatePurchaseNotes,
  type AdminPagination,
  type PurchaseRequest,
  type SaleRecord,
  type SalesReport,
} from "@/services/barokahiinAdminService";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pager,
  StatusBadge,
} from "./adminUi";
import { formatDate, formatMoney, getErrorMessage } from "./adminUtils";

type FinanceView = "requests" | "sales" | "report" | "correction";

export default function OrdersAndFinance() {
  const [view, setView] = useState<FinanceView>("requests");
  const tabs: { value: FinanceView; label: string }[] = [
    { value: "requests", label: "Permintaan beli" },
    { value: "sales", label: "Catatan penjualan" },
    { value: "report", label: "Laporan penjualan" },
    { value: "correction", label: "Koreksi penjualan" },
  ];
  return (
    <div className="space-y-5">
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            variant={view === tab.value ? "default" : "ghost"}
            onClick={() => setView(tab.value)}
            className={
              view === tab.value
                ? "h-9 shrink-0 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
                : "h-9 shrink-0 rounded-lg text-muted-foreground"
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>
      {view === "requests" && <PurchaseRequests />}
      {view === "sales" && <SalesLedger />}
      {view === "report" && <SalesSummary />}
      {view === "correction" && <SalesCorrection />}
    </div>
  );
}

function PurchaseRequests() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [itemUuid, setItemUuid] = useState("");
  const [filterItemUuid, setFilterItemUuid] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCount, setNewCount] = useState(0);
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getPurchaseRequests({
        ...(status ? { status } : {}),
        ...(filterItemUuid ? { item_uuid: filterItemUuid } : {}),
        page,
        per_page: 15,
      });
      setRequests(result.items);
      setPagination(result.pagination);
      setNewCount(result.new_requests_count ?? 0);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Gagal memuat permintaan pembelian."),
      );
    } finally {
      setLoading(false);
    }
  }, [filterItemUuid, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = async (request: PurchaseRequest) => {
    try {
      setSelected(await getPurchaseRequest(request.uuid));
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal memuat detail pesanan."));
    }
  };

  const applyItemFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilterItemUuid(itemUuid.trim());
  };

  const changeStatus = (value: string) => {
    setStatus(value === "all" ? "" : value);
    setPage(1);
  };

  const updateSelected = async () => {
    await load();
    if (selected) {
      try {
        setSelected(await getPurchaseRequest(selected.uuid));
      } catch (requestError) {
        toast.error(getErrorMessage(requestError, "Gagal memuat ulang detail."));
      }
    }
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <ShoppingCart className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base sm:text-lg">
                Permintaan pembelian
              </CardTitle>
              <CardDescription className="mt-1">
                Konfirmasi pesanan, catat pembayaran, dan selesaikan pemenuhan.
              </CardDescription>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={newCount ? "default" : "secondary"}>
              {newCount} baru
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 rounded-lg"
              aria-label="Muat ulang permintaan"
              onClick={() => void load()}
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5 pt-0 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={status || "all"} onValueChange={changeStatus}>
              <SelectTrigger aria-label="Filter status permintaan" className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {[
                  "diajukan",
                  "dikonfirmasi",
                  "dibayar",
                  "selesai",
                  "ditolak",
                  "batal",
                  "kedaluwarsa",
                ].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <form onSubmit={applyItemFilter} className="flex gap-2">
              <Input
                value={itemUuid}
                onChange={(event) => setItemUuid(event.target.value)}
                placeholder="Filter UUID barang"
                aria-label="Filter UUID barang"
                className="h-10 min-w-0 rounded-xl"
              />
              <Button type="submit" variant="outline" className="h-10 rounded-xl">
                <Search className="size-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </form>
          </div>
          {error && <ErrorState message={error} onRetry={() => void load()} />}
          {loading && requests.length === 0 ? (
            <LoadingState label="Memuat permintaan..." />
          ) : requests.length === 0 ? (
            <EmptyState
              title="Belum ada permintaan"
              description="Permintaan pembelian akan muncul di daftar ini."
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {requests.map((request) => (
                  <PurchaseCard
                    key={request.uuid}
                    request={request}
                    onOpen={() => void open(request)}
                  />
                ))}
              </div>
              <div className="hidden md:block">
                <Table className="min-w-225">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Pembeli</TableHead>
                      <TableHead>Barang</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Diajukan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.uuid}>
                        <TableCell>
                          <p className="font-semibold">{request.nama_pembeli}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.kontak_pembeli}
                          </p>
                        </TableCell>
                        <TableCell>
                          {request.item?.judul_publik ??
                            request.item?.kode_barang ??
                            "—"}
                        </TableCell>
                        <TableCell>{request.jumlah}</TableCell>
                        <TableCell className="font-semibold">
                          {formatMoney(request.harga_terkunci_rupiah)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={request.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void open(request)}
                          >
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pager pagination={pagination} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Modal
          isOpen
          onClose={() => setSelected(null)}
          title={`Permintaan: ${selected.nama_pembeli}`}
          size="xl"
        >
          <PurchaseDetail
            request={selected}
            onUpdated={() => void updateSelected()}
          />
        </Modal>
      )}
    </div>
  );
}

function PurchaseCard({
  request,
  onOpen,
}: {
  request: PurchaseRequest;
  onOpen: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{request.nama_pembeli}</p>
            <p className="truncate text-sm text-muted-foreground">
              {request.item?.judul_publik ?? request.item?.kode_barang ?? "Barang"}
            </p>
          </div>
          <StatusBadge value={request.status} />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 p-3 text-sm">
          <span className="text-muted-foreground">Jumlah {request.jumlah}</span>
          <strong>{formatMoney(request.harga_terkunci_rupiah)}</strong>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full rounded-xl"
          onClick={onOpen}
        >
          Lihat pesanan
        </Button>
      </CardContent>
    </Card>
  );
}

function PurchaseDetail({
  request,
  onUpdated,
}: {
  request: PurchaseRequest;
  onUpdated: () => void;
}) {
  const [notes, setNotes] = useState(request.catatan_internal ?? "");
  const [method, setMethod] = useState<"transfer" | "qris_manual" | "tunai">(
    "transfer",
  );
  const [amount, setAmount] = useState(
    String(request.harga_terkunci_rupiah ?? ""),
  );
  const [reference, setReference] = useState("");
  const [differenceReason, setDifferenceReason] = useState("");
  const [saving, setSaving] = useState(false);

  const action = async (
    name: string,
    callback: () => Promise<unknown>,
  ) => {
    setSaving(true);
    try {
      await callback();
      toast.success(name);
      onUpdated();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, `Gagal ${name.toLowerCase()}.`));
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await action("Catatan internal disimpan", () =>
      updatePurchaseNotes(request.uuid, notes.trim()),
    );
  };

  const payment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const paidAmount = Number(amount);
    if (!Number.isInteger(paidAmount) || paidAmount < 0) {
      toast.error("Nominal pembayaran tidak valid.");
      return;
    }
    if (
      request.harga_terkunci_rupiah !== null &&
      request.harga_terkunci_rupiah !== undefined &&
      paidAmount !== request.harga_terkunci_rupiah &&
      !differenceReason.trim()
    ) {
      toast.error("Alasan selisih wajib diisi jika nominal berbeda.");
      return;
    }
    await action("Pembayaran berhasil dicatat", () =>
      recordPurchasePayment(request.uuid, {
        metode: method,
        nominal_rupiah: paidAmount,
        bukti_ref: reference.trim() || undefined,
        alasan_selisih: differenceReason.trim() || undefined,
      }),
    );
  };

  const promptReason = async (
    operation: "cancel" | "reject",
  ) => {
    const reason = window.prompt(
      operation === "cancel"
        ? "Masukkan alasan pembatalan:"
        : "Masukkan alasan penolakan:",
    );
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error("Alasan wajib diisi.");
      return;
    }
    await action(
      operation === "cancel" ? "Pesanan dibatalkan" : "Permintaan ditolak",
      () =>
        operation === "cancel"
          ? cancelPurchaseRequest(request.uuid, reason.trim())
          : rejectPurchaseRequest(request.uuid, reason.trim()),
    );
  };

  return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge value={request.status} />
          <p className="break-all font-mono text-xs text-muted-foreground">
            {request.uuid}
          </p>
        </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-4 text-sm">
            <Info label="Pembeli" value={request.nama_pembeli} />
            <Info label="Kontak" value={request.kontak_pembeli} />
            <Info
              label="Barang"
              value={
                request.item?.judul_publik ?? request.item?.kode_barang ?? "—"
              }
            />
            <Info label="Jumlah" value={String(request.jumlah)} />
            <Info
              label="Harga terkunci"
              value={formatMoney(request.harga_terkunci_rupiah)}
            />
            <Info label="Batas pembayaran" value={formatDate(request.batas_bayar_pada)} />
            <Info label="Catatan pembeli" value={request.catatan || "—"} />
            <Info
              label="Alasan batal/tolak"
              value={request.alasan_tolak_batal || "—"}
            />
          </div>
          <form
            onSubmit={saveNotes}
            className="space-y-3 rounded-2xl border border-border/70 p-4"
          >
            <Label htmlFor="purchase-internal-notes">Catatan internal</Label>
            <textarea
              id="purchase-internal-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="outline" disabled={saving}>
              Simpan catatan
            </Button>
          </form>
        </div>

        <div className="space-y-3">
          {request.status === "diajukan" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() =>
                  void action("Pesanan dikonfirmasi", () =>
                    confirmPurchaseRequest(request.uuid),
                  )
                }
                className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Konfirmasi pesanan
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void promptReason("reject")}
                className="rounded-xl"
              >
                Tolak permintaan
              </Button>
            </div>
          )}
          {request.status === "dikonfirmasi" && (
            <form
              onSubmit={payment}
              className="space-y-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/30 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/10"
            >
              <h3 className="font-semibold">Catat pembayaran</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Metode">
                  <Select
                    value={method}
                    onValueChange={(value) =>
                      setMethod(value as typeof method)
                    }
                  >
                    <SelectTrigger className="rounded-xl bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="qris_manual">QRIS manual</SelectItem>
                      <SelectItem value="tunai">Tunai</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Nominal diterima (Rp)">
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="rounded-xl bg-background"
                  />
                </Field>
                <Field label="Bukti / referensi">
                  <Input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    className="rounded-xl bg-background"
                  />
                </Field>
                <Field label="Alasan selisih (jika nominal berbeda)">
                  <Input
                    value={differenceReason}
                    onChange={(event) =>
                      setDifferenceReason(event.target.value)
                    }
                    className="rounded-xl bg-background"
                  />
                </Field>
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Simpan pembayaran
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void promptReason("cancel")}
                className="w-full rounded-xl"
              >
                Batalkan pesanan
              </Button>
            </form>
          )}
          {request.status === "dibayar" && (
            <Button
              type="button"
              disabled={saving}
              onClick={() =>
                void action("Pesanan selesai dipenuhi", () =>
                  fulfillPurchaseRequest(request.uuid),
                )
              }
              className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
            >
              Tandai pesanan selesai
            </Button>
          )}
          {["selesai", "ditolak", "batal", "kedaluwarsa"].includes(
            request.status,
          ) && (
            <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
              Pesanan berada pada status akhir:{" "}
              <span className="font-semibold text-foreground">
                {request.status}
              </span>
              .
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SalesLedger() {
  const today = toDateInput(new Date());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);
  const [applied, setApplied] = useState({ start_date: "", end_date: today });
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getSales({ ...applied, page, per_page: 20 });
      setSales(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat catatan penjualan."));
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      toast.error("Tanggal akhir harus sama dengan atau setelah tanggal awal.");
      return;
    }
    setPage(1);
    setApplied({ start_date: startDate, end_date: endDate });
  };

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <ReceiptText className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base sm:text-lg">Catatan penjualan</CardTitle>
            <CardDescription className="mt-1">
              Buku besar permanen untuk transaksi penjualan dan koreksi.
            </CardDescription>
          </div>
        </div>
        <Button type="button" variant="outline" size="icon" aria-label="Muat ulang penjualan" onClick={() => void load()}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 pt-0 sm:px-6">
        <form onSubmit={apply} className="grid gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <Field label="Tanggal awal">
            <Input type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl bg-background" />
          </Field>
          <Field label="Tanggal akhir">
            <Input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl bg-background" />
          </Field>
          <Button type="submit" variant="outline" className="self-end rounded-xl">
            Terapkan periode
          </Button>
        </form>
        {error && <ErrorState message={error} onRetry={() => void load()} />}
        {loading && sales.length === 0 ? (
          <LoadingState label="Memuat catatan penjualan..." />
        ) : sales.length === 0 ? (
          <EmptyState title="Belum ada transaksi" description="Catatan penjualan sesuai filter akan tampil di sini." />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {sales.map((sale) => (
                <SaleCard key={sale.uuid} sale={sale} />
              ))}
            </div>
            <div className="hidden md:block">
              <Table className="min-w-190">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Jenis</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Dibayar</TableHead>
                    <TableHead>Bukti / koreksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.uuid}>
                      <TableCell>
                        <Badge variant={sale.jenis === "koreksi" ? "secondary" : "outline"}>
                          {sale.jenis}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatMoney(sale.nominal_rupiah)}
                      </TableCell>
                      <TableCell>{sale.metode || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(sale.dibayar_pada)}
                      </TableCell>
                      <TableCell className="max-w-72 truncate text-muted-foreground">
                        {sale.alasan_koreksi || sale.bukti_ref || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pager pagination={pagination} onChange={setPage} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SaleCard({ sale }: { sale: SaleRecord }) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant={sale.jenis === "koreksi" ? "secondary" : "outline"}>
            {sale.jenis}
          </Badge>
          <span className="font-bold">{formatMoney(sale.nominal_rupiah)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Info label="Metode" value={sale.metode || "—"} />
          <Info label="Dibayar" value={formatDate(sale.dibayar_pada)} />
        </div>
        {(sale.alasan_koreksi || sale.bukti_ref) && (
          <p className="mt-3 wrap-break-word text-xs text-muted-foreground">
            {sale.alasan_koreksi || sale.bukti_ref}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SalesSummary() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(toDateInput(new Date()));
  const [applied, setApplied] = useState({ start_date: "", end_date: toDateInput(new Date()) });
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await getSalesReport(applied));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat laporan penjualan."));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      toast.error("Tanggal akhir harus sama dengan atau setelah tanggal awal.");
      return;
    }
    setApplied({ start_date: startDate, end_date: endDate });
  };

  return (
    <div className="space-y-5">
      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Laporan penjualan</CardTitle>
          <CardDescription>
            Ringkasan pencatatan penjualan dan koreksi sesuai periode.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={apply} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <Field label="Tanggal awal">
              <Input type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Tanggal akhir">
              <Input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl" />
            </Field>
            <Button type="submit" className="self-end rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">
              Tampilkan laporan
            </Button>
          </form>
        </CardContent>
      </Card>
      {error && <ErrorState message={error} onRetry={() => void load()} />}
      {loading && !report ? (
        <LoadingState label="Memuat laporan..." />
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Total penjualan" value={formatMoney(report.total_nominal_rupiah)} />
            <Metric label="Transaksi penjualan" value={report.total_transaksi_penjualan.toLocaleString("id-ID")} />
            <Metric label="Catatan koreksi" value={report.total_catatan_koreksi.toLocaleString("id-ID")} />
          </div>
          <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Per kategori</CardTitle>
              <CardDescription>Jumlah pencatatan dan total nominal berdasarkan kategori.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {report.per_kategori.length === 0 ? (
                <EmptyState title="Belum ada rincian kategori" description="Tidak ada data untuk periode ini." />
              ) : (
                <div className="space-y-3 md:hidden">
                  {report.per_kategori.map((entry) => (
                    <Card key={entry.kategori} className="rounded-2xl shadow-none">
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <p className="font-semibold">{entry.kategori}</p>
                          <p className="text-xs text-muted-foreground">{entry.jumlah_catatan} catatan</p>
                        </div>
                        <strong>{formatMoney(entry.total_nominal)}</strong>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {report.per_kategori.length > 0 && (
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Kategori</TableHead>
                        <TableHead>Jumlah catatan</TableHead>
                        <TableHead>Total nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.per_kategori.map((entry) => (
                        <TableRow key={entry.kategori}>
                          <TableCell className="font-medium">{entry.kategori}</TableCell>
                          <TableCell>{entry.jumlah_catatan}</TableCell>
                          <TableCell className="font-semibold">{formatMoney(entry.total_nominal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function SalesCorrection() {
  const [itemUuid, setItemUuid] = useState("");
  const [requestUuid, setRequestUuid] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value)) {
      toast.error("Nominal koreksi harus berupa Rupiah bulat.");
      return;
    }
    setSaving(true);
    try {
      await createSalesCorrection({
        item_uuid: itemUuid.trim(),
        request_uuid: requestUuid.trim() || undefined,
        nominal_rupiah: value,
        alasan_koreksi: reason.trim(),
        bukti_ref: reference.trim() || undefined,
      });
      toast.success("Koreksi penjualan tercatat di buku besar.");
      setItemUuid("");
      setRequestUuid("");
      setAmount("");
      setReason("");
      setReference("");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal mencatat koreksi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
      <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <FilePlus2 className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Catat koreksi</CardTitle>
            <CardDescription className="mt-1 leading-5">
              Koreksi disimpan sebagai catatan permanen dan tidak menghapus transaksi lama.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={submit} className="space-y-4">
            <Field label="UUID barang" required>
              <Input required value={itemUuid} onChange={(e) => setItemUuid(e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="UUID permintaan (opsional)">
              <Input value={requestUuid} onChange={(e) => setRequestUuid(e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Nominal koreksi (Rupiah)" required>
              <Input required type="number" step={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Alasan koreksi" required>
              <textarea required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Referensi bukti">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} className="rounded-xl" />
            </Field>
            <Button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">
              {saving ? "Menyimpan..." : "Simpan koreksi"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="rounded-3xl border-border/70 bg-muted/20 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-background text-emerald-700 shadow-sm dark:text-emerald-300">
            <BadgeDollarSign className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold">Jaga jejak keuangan</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Periksa UUID barang dan permintaan sebelum mencatat koreksi. Setiap
            koreksi akan muncul terpisah dari catatan penjualan biasa di buku
            besar, laporan, dan audit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 wrap-break-word font-medium">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function toDateInput(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
