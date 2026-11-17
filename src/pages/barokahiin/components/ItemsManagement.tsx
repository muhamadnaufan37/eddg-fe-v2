import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Check,
  Eye,
  ImagePlus,
  PackageOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
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
  createItem,
  deleteItemMedia,
  getCategories,
  getDonors,
  getItem,
  getItems,
  publishItem,
  transitionItem,
  unpublishItem,
  updateItem,
  updateItemMedia,
  uploadItemMedia,
  type AdminPagination,
  type BarokahiinCategory,
  type BarokahiinDonor,
  type BarokahiinItem,
} from "@/services/barokahiinAdminService";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pager,
  StatusBadge,
} from "./adminUi";
import { formatDate, formatMoney, getErrorMessage } from "./adminUtils";

const itemStatuses = [
  "diajukan",
  "diterima",
  "dikurasi",
  "siap_terbit",
  "terbit",
  "dipesan",
  "terjual",
  "ditarik",
  "ditolak",
];

export default function ItemsManagement() {
  const [items, setItems] = useState<BarokahiinItem[]>([]);
  const [categories, setCategories] = useState<BarokahiinCategory[]>([]);
  const [donors, setDonors] = useState<BarokahiinDonor[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    kategori_uuid: "",
    donor_uuid: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<BarokahiinItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getItems({
        ...filters,
        page,
        per_page: 15,
      });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat barang."));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    Promise.all([getCategories(), getDonors({ per_page: 100 })])
      .then(([categoryResult, donorResult]) => {
        setCategories(categoryResult);
        setDonors(donorResult.items);
      })
      .catch((requestError: unknown) => {
        toast.error(
          getErrorMessage(requestError, "Gagal memuat pilihan kategori/donatur."),
        );
      });
  }, []);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilters((current) => ({ ...current, q: query.trim() }));
  };

  const openDetail = async (item: BarokahiinItem) => {
    try {
      setFormOpen(false);
      setSelected(await getItem(item.uuid));
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal membuka detail barang."));
    }
  };

  const refreshSelected = async () => {
    if (!selected) return;
    try {
      setSelected(await getItem(selected.uuid));
      await loadItems();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal memperbarui detail."));
    }
  };

  const statusOptions = [
    { value: "all", label: "Semua status" },
    ...itemStatuses.map((status) => ({
      value: status,
      label: status.replaceAll("_", " "),
    })),
  ];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <PackageOpen className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base sm:text-lg">
                Barang & kurasi
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola barang, kelengkapan kurasi, status publikasi, dan media.
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            className="h-10 shrink-0 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={() => {
              setSelected(null);
              setFormOpen((open) => !open);
            }}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Barang baru</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5 pt-0 sm:px-6">
          <form
            onSubmit={applyFilters}
            className="grid gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_repeat(3,minmax(9rem,0.65fr))_auto]"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama atau kode barang"
                aria-label="Cari barang"
                className="h-10 rounded-xl bg-background pl-9"
              />
            </div>
            <FilterSelect
              label="Status"
              value={filters.status || "all"}
              options={statusOptions}
              onChange={(value) => {
                setPage(1);
                setFilters((current) => ({
                  ...current,
                  status: value === "all" ? "" : value,
                }));
              }}
            />
            <FilterSelect
              label="Kategori"
              value={filters.kategori_uuid || "all"}
              options={[
                { value: "all", label: "Semua kategori" },
                ...categories.map((category) => ({
                  value: category.uuid,
                  label: category.nama,
                })),
              ]}
              onChange={(value) => {
                setPage(1);
                setFilters((current) => ({
                  ...current,
                  kategori_uuid: value === "all" ? "" : value,
                }));
              }}
            />
            <FilterSelect
              label="Donatur"
              value={filters.donor_uuid || "all"}
              options={[
                { value: "all", label: "Semua donatur" },
                ...donors.map((donor) => ({
                  value: donor.uuid,
                  label: donor.nama,
                })),
              ]}
              onChange={(value) => {
                setPage(1);
                setFilters((current) => ({
                  ...current,
                  donor_uuid: value === "all" ? "" : value,
                }));
              }}
            />
            <Button
              type="submit"
              variant="outline"
              className="h-10 rounded-xl sm:col-span-2 xl:col-span-1"
            >
              <Search className="size-4" />
              Cari
            </Button>
          </form>

          {error && <ErrorState message={error} onRetry={() => void loadItems()} />}
          {loading && items.length === 0 ? (
            <LoadingState label="Memuat barang..." />
          ) : items.length === 0 ? (
            <EmptyState
              title="Barang tidak ditemukan"
              description="Ubah filter atau tambahkan data barang baru."
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {items.map((item) => (
                  <ItemCard
                    key={item.uuid}
                    item={item}
                    onOpen={() => void openDetail(item)}
                  />
                ))}
              </div>
              <div className="hidden md:block">
                <Table className="min-w-225">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Barang</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Donatur</TableHead>
                      <TableHead>Harga / stok</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.uuid}>
                        <TableCell>
                          <p className="font-semibold">{item.nama_internal}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.kode_barang}
                          </p>
                        </TableCell>
                        <TableCell>{item.kategori?.nama ?? "—"}</TableCell>
                        <TableCell>{item.donor?.nama ?? "—"}</TableCell>
                        <TableCell>
                          <p>{formatMoney(item.harga_rupiah)}</p>
                          <p className="text-xs text-muted-foreground">
                            Stok {item.stok_tersedia ?? item.jumlah ?? 0}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={item.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void openDetail(item)}
                          >
                            <Eye className="size-4" />
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

      {formOpen && !selected && (
        <Modal
          isOpen
          onClose={() => setFormOpen(false)}
          title="Tambah barang"
          size="xl"
        >
          <ItemForm
            categories={categories}
            donors={donors}
            onCancel={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              setPage(1);
            }}
          />
        </Modal>
      )}

      {selected && (
        <Modal
          isOpen
          onClose={() => {
            setSelected(null);
            setFormOpen(false);
          }}
          title={`${formOpen ? "Ubah barang" : "Detail barang"}: ${selected.nama_internal}`}
          size="xl"
        >
          {formOpen ? (
            <ItemForm
              item={selected}
              categories={categories}
              donors={donors}
              onCancel={() => setFormOpen(false)}
              onSaved={async () => {
                setFormOpen(false);
                await refreshSelected();
              }}
            />
          ) : (
            <ItemDetail
              item={selected}
              onEdit={() => setFormOpen(true)}
              onRefresh={() => void refreshSelected()}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-10 w-full rounded-xl bg-background">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ItemCard({
  item,
  onOpen,
}: {
  item: BarokahiinItem;
  onOpen: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-none">
      <CardContent className="flex gap-3 p-4">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.judul_publik || item.nama_internal}
            className="size-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <PackageOpen className="size-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{item.nama_internal}</p>
              <p className="text-xs text-muted-foreground">{item.kode_barang}</p>
            </div>
            <StatusBadge value={item.status} />
          </div>
          <p className="mt-2 text-sm font-semibold">
            {formatMoney(item.harga_rupiah)}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Stok {item.stok_tersedia ?? item.jumlah ?? 0}
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full rounded-lg"
            onClick={onOpen}
          >
            <Eye className="size-4" />
            Detail & kurasi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemForm({
  item,
  categories,
  donors,
  onCancel,
  onSaved,
}: {
  item?: BarokahiinItem;
  categories: BarokahiinCategory[];
  donors: BarokahiinDonor[];
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [namaInternal, setNamaInternal] = useState(item?.nama_internal ?? "");
  const [judulPublik, setJudulPublik] = useState(item?.judul_publik ?? "");
  const [deskripsi, setDeskripsi] = useState(item?.keterangan_publik ?? "");
  const [kekurangan, setKekurangan] = useState(item?.kekurangan ?? "");
  const [catatan, setCatatan] = useState(item?.catatan_internal ?? "");
  const [spesifikasi, setSpesifikasi] = useState(item?.spesifikasi ?? "");
  const [harga, setHarga] = useState(
    item?.harga_rupiah === null || item?.harga_rupiah === undefined
      ? ""
      : String(item.harga_rupiah),
  );
  const [jumlah, setJumlah] = useState(String(item?.jumlah ?? 1));
  const [kondisi, setKondisi] = useState(item?.kondisi_grade ?? "baik");
  const [caraTerima, setCaraTerima] = useState(item?.cara_terima ?? "diantar");
  const [checklist, setChecklist] = useState({
    kebersihan: item?.checklist_kurasi?.kebersihan ?? false,
    fungsi: item?.checklist_kurasi?.fungsi ?? false,
    kelengkapan: item?.checklist_kurasi?.kelengkapan ?? false,
    foto_memadai: item?.checklist_kurasi?.foto_memadai ?? false,
  });
  const [donorUuid, setDonorUuid] = useState(item?.donor?.uuid ?? "none");
  const [categoryUuid, setCategoryUuid] = useState(
    item?.kategori?.uuid ?? "none",
  );
  const [lokasi, setLokasi] = useState(item?.lokasi_penyimpanan ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Number(jumlah) < 1 || !Number.isInteger(Number(jumlah))) {
      toast.error("Jumlah barang harus berupa bilangan bulat minimal 1.");
      return;
    }
    if (harga && (!Number.isInteger(Number(harga)) || Number(harga) < 0)) {
      toast.error("Harga harus berupa bilangan Rupiah yang valid.");
      return;
    }
    setSaving(true);
    const payload = {
      nama_internal: namaInternal.trim(),
      judul_publik: judulPublik.trim() || null,
      keterangan_publik: deskripsi.trim() || null,
      kekurangan: kekurangan.trim() || null,
      catatan_internal: catatan.trim() || null,
      spesifikasi: spesifikasi.trim() || null,
      harga_rupiah: harga ? Number(harga) : null,
      jumlah: Number(jumlah),
      kondisi_grade: kondisi as "sangat_baik" | "baik" | "cukup",
      cara_terima: caraTerima as "diantar" | "dijemput",
      checklist_kurasi: checklist,
      donor_uuid: donorUuid === "none" ? null : donorUuid,
      kategori_uuid: categoryUuid === "none" ? null : categoryUuid,
      lokasi_penyimpanan: lokasi.trim() || null,
    };
    try {
      if (item) {
        await updateItem(item.uuid, payload);
        toast.success("Data barang diperbarui.");
      } else {
        await createItem(payload);
        toast.success("Barang berhasil ditambahkan.");
      }
      await onSaved();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal menyimpan barang."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {item && (
        <p className="font-mono text-xs text-muted-foreground">
          {item.kode_barang}
        </p>
      )}
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama internal" required>
            <Input required value={namaInternal} onChange={(e) => setNamaInternal(e.target.value)} />
          </Field>
          <Field label="Judul publik">
            <Input value={judulPublik} onChange={(e) => setJudulPublik(e.target.value)} />
          </Field>
          <Field label="Kategori">
            <Select value={categoryUuid} onValueChange={setCategoryUuid}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.uuid} value={category.uuid}>
                    {category.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Donatur">
            <Select value={donorUuid} onValueChange={setDonorUuid}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa donatur</SelectItem>
                {donors.map((donor) => (
                  <SelectItem key={donor.uuid} value={donor.uuid}>
                    {donor.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Kondisi">
            <Select value={kondisi} onValueChange={setKondisi}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sangat_baik">Sangat baik</SelectItem>
                <SelectItem value="baik">Baik</SelectItem>
                <SelectItem value="cukup">Cukup</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cara penerimaan">
            <Select
              value={caraTerima}
              onValueChange={(value) =>
                setCaraTerima(value as "diantar" | "dijemput")
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diantar">Diantar</SelectItem>
                <SelectItem value="dijemput">Dijemput</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Harga (Rupiah)">
            <Input type="number" min={0} step={1} value={harga} onChange={(e) => setHarga(e.target.value)} />
          </Field>
          <Field label="Jumlah stok">
            <Input type="number" min={1} step={1} required value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
          </Field>
          <Field label="Spesifikasi">
            <Input value={spesifikasi} onChange={(e) => setSpesifikasi(e.target.value)} />
          </Field>
          <Field label="Lokasi penyimpanan">
            <Input value={lokasi} onChange={(e) => setLokasi(e.target.value)} />
          </Field>
          <Field label="Deskripsi publik">
            <textarea
              value={deskripsi}
              onChange={(event) => setDeskripsi(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:col-span-2"
            />
          </Field>
          <Field label="Kekurangan barang">
            <Input value={kekurangan} onChange={(e) => setKekurangan(e.target.value)} />
          </Field>
          <Field label="Catatan internal">
            <Input value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </Field>
          <fieldset className="space-y-2 rounded-xl border border-border/70 p-3 sm:col-span-2">
            <legend className="px-1 text-sm font-medium">Checklist kurasi</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["kebersihan", "Kebersihan"],
                  ["fungsi", "Fungsi barang"],
                  ["kelengkapan", "Kelengkapan"],
                  ["foto_memadai", "Foto memadai"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklist[key]}
                    onChange={(event) =>
                      setChecklist((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                    className="size-4 accent-emerald-700"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {saving ? "Menyimpan..." : item ? "Simpan perubahan" : "Tambah barang"}
            </Button>
          </div>
        </form>
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

function ItemDetail({
  item,
  onEdit,
  onRefresh,
}: {
  item: BarokahiinItem;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const [nextStatus, setNextStatus] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaAlt, setMediaAlt] = useState("");
  const [mediaOrder, setMediaOrder] = useState("0");
  const [isCover, setIsCover] = useState(false);

  const transition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nextStatus) return;
    setSaving(true);
    try {
      await transitionItem(item.uuid, nextStatus, reason.trim() || undefined);
      toast.success(`Status barang diubah menjadi ${nextStatus.replaceAll("_", " ")}.`);
      setNextStatus("");
      setReason("");
      onRefresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal mengubah status barang."));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setSaving(true);
    try {
      await publishItem(item.uuid);
      toast.success("Barang berhasil diterbitkan.");
      onRefresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Barang belum dapat diterbitkan."));
    } finally {
      setSaving(false);
    }
  };

  const unpublish = async () => {
    const note = window.prompt("Alasan menarik barang dari publikasi?");
    if (note === null) return;
    setSaving(true);
    try {
      await unpublishItem(item.uuid, note.trim() || undefined);
      toast.success("Barang ditarik dari storefront.");
      onRefresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal menarik publikasi barang."));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mediaFile) {
      toast.error("Pilih foto atau video terlebih dahulu.");
      return;
    }
    const payload = new FormData();
    payload.append("tipe", mediaFile.type.startsWith("video/") ? "video" : "foto");
    payload.append("file", mediaFile);
    payload.append("alt", mediaAlt);
    payload.append("urutan", mediaOrder);
    payload.append("is_cover", String(isCover));
    setSaving(true);
    try {
      await uploadItemMedia(item.uuid, payload);
      setMediaFile(null);
      setMediaAlt("");
      setIsCover(false);
      toast.success("Media berhasil diunggah.");
      onRefresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal mengunggah media."));
    } finally {
      setSaving(false);
    }
  };

  const removeMedia = async (mediaUuid: string) => {
    if (!window.confirm("Hapus media ini dari barang?")) return;
    try {
      await deleteItemMedia(mediaUuid);
      toast.success("Media dihapus.");
      onRefresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal menghapus media."));
    }
  };

  const setCover = async (mediaUuid: string) => {
    try {
      await updateItemMedia(mediaUuid, { is_cover: true });
      toast.success("Sampul barang diperbarui.");
      onRefresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal memperbarui sampul."));
    }
  };

  const updateMedia = async (
    mediaUuid: string,
    payload: { urutan: number; alt: string },
  ) => {
    await updateItemMedia(mediaUuid, payload);
    toast.success("Keterangan media diperbarui.");
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{item.kode_barang}</p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Muat ulang detail" onClick={onRefresh}>
            <RefreshCw className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="Ubah barang" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
        </div>
      </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={item.status} />
              {item.kondisi_grade && (
                <Badge variant="secondary">{item.kondisi_grade.replaceAll("_", " ")}</Badge>
              )}
              {item.kategori?.nama && <Badge variant="outline">{item.kategori.nama}</Badge>}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {item.keterangan_publik || "Belum ada deskripsi publik."}
            </p>
            <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-4 text-sm">
              <Info label="Harga" value={formatMoney(item.harga_rupiah)} />
              <Info label="Stok tersedia" value={String(item.stok_tersedia ?? item.jumlah ?? 0)} />
              <Info label="Donatur" value={item.donor?.nama ?? "—"} />
              <Info label="Dibuat" value={formatDate(item.created_at)} />
            </dl>
            {item.publish_readiness_errors?.length ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="font-semibold">Belum memenuhi syarat terbit</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {item.publish_readiness_errors.map((message, index) => (
                    <li key={`${index}-${message}`}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="space-y-3">
            {item.status === "siap_terbit" && (
              <Button
                type="button"
                disabled={saving || Boolean(item.publish_readiness_errors?.length)}
                onClick={() => void publish()}
                className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
              >
                <Send className="size-4" />
                Terbitkan ke storefront
              </Button>
            )}
            {item.status === "terbit" && (
              <Button
                type="button"
                disabled={saving}
                variant="outline"
                onClick={() => void unpublish()}
                className="w-full rounded-xl"
              >
                <X className="size-4" />
                Tarik dari storefront
              </Button>
            )}
            <form onSubmit={transition} className="space-y-3 rounded-2xl border border-border/70 p-4">
              <p className="text-sm font-semibold">Transisi status</p>
              <Select value={nextStatus} onValueChange={setNextStatus}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Pilih status berikutnya" />
                </SelectTrigger>
                <SelectContent>
                  {itemStatuses
                    .filter((status) => status !== item.status)
                    .map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Alasan (wajib bila ditolak/ditarik)"
                className="rounded-xl"
              />
              <Button
                type="submit"
                disabled={saving || !nextStatus}
                variant="outline"
                className="w-full rounded-xl"
              >
                {saving ? "Memproses..." : "Simpan status"}
              </Button>
            </form>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold">Media barang</h3>
              <p className="text-xs text-muted-foreground">
                Foto/video disimpan aman; foto diproses backend untuk menghapus EXIF/GPS.
              </p>
            </div>
          </div>
          {item.media?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {item.media.map((media) => (
                <ItemMediaCard
                  key={media.uuid}
                  media={media}
                  onDelete={() => void removeMedia(media.uuid)}
                  onSetCover={() => void setCover(media.uuid)}
                  onSave={(payload) => updateMedia(media.uuid, payload)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              Belum ada foto atau video.
            </p>
          )}
          <form
            onSubmit={upload}
            className="grid gap-3 rounded-2xl bg-muted/40 p-4 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_0.5fr_auto_auto]"
          >
            <Field label="Pilih media" required>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={(event) =>
                  setMediaFile(event.target.files?.[0] ?? null)
                }
                className="h-10 rounded-xl bg-background file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
              />
            </Field>
            <Field label="Alt / keterangan">
              <Input
                value={mediaAlt}
                onChange={(event) => setMediaAlt(event.target.value)}
                className="rounded-xl bg-background"
              />
            </Field>
            <Field label="Urutan">
              <Input
                type="number"
                min={0}
                value={mediaOrder}
                onChange={(event) => setMediaOrder(event.target.value)}
                className="rounded-xl bg-background"
              />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={isCover}
                onChange={(event) => setIsCover(event.target.checked)}
                className="size-4 accent-emerald-700"
              />
              Sampul
            </label>
            <Button
              type="submit"
              disabled={saving}
              className="h-10 self-end rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
            >
              <ImagePlus className="size-4" />
              Unggah
            </Button>
          </form>
        </section>

        {item.status_histories?.length ? (
          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="font-semibold">Riwayat status</h3>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {item.status_histories.map((history, index) => (
                <div
                  key={`${history.waktu}-${index}`}
                  className="rounded-xl bg-muted/40 p-3 text-xs"
                >
                  <p className="font-semibold">
                    {history.dari || "Mulai"} → {history.ke}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {history.oleh || "Sistem"} · {formatDate(history.waktu)}
                  </p>
                  {history.alasan && (
                    <p className="mt-1 text-muted-foreground">
                      {history.alasan}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}
    </div>
  );
}

function ItemMediaCard({
  media,
  onDelete,
  onSetCover,
  onSave,
}: {
  media: BarokahiinMedia;
  onDelete: () => void;
  onSetCover: () => void;
  onSave: (payload: { urutan: number; alt: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [alt, setAlt] = useState(media.alt ?? "");
  const [order, setOrder] = useState(String(media.urutan));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAlt(media.alt ?? "");
    setOrder(String(media.urutan));
  }, [media.alt, media.urutan]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const orderValue = Number(order);
    if (!Number.isInteger(orderValue) || orderValue < 0) {
      toast.error("Urutan media harus berupa bilangan bulat minimal 0.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ urutan: orderValue, alt: alt.trim() });
      setEditing(false);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal memperbarui media."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      {media.tipe === "foto" ? (
        <img
          src={media.thumbnail_url || media.url}
          alt={media.alt || "Foto barang"}
          className="aspect-4/3 w-full object-cover"
        />
      ) : (
        <video
          src={media.url}
          controls
          className="aspect-4/3 w-full bg-black object-contain"
        />
      )}
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{media.tipe}</Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Urutan {media.urutan}</span>
            {media.is_cover && <Badge>Sampul</Badge>}
          </div>
        </div>
        {editing ? (
          <form onSubmit={save} className="space-y-2">
            <Field label="Alt / keterangan">
              <Input value={alt} onChange={(event) => setAlt(event.target.value)} />
            </Field>
            <Field label="Urutan">
              <Input
                type="number"
                min={0}
                step={1}
                value={order}
                onChange={(event) => setOrder(event.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving} className="flex-1">
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
                Batal
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {media.alt || "Tanpa keterangan"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5" />
                Ubah detail
              </Button>
              {!media.is_cover && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={onSetCover}
                >
                  <Check className="size-3.5" />
                  Jadikan sampul
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Hapus media"
                onClick={onDelete}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-semibold">{value}</dd>
    </div>
  );
}
