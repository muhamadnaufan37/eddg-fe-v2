import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Archive,
  Check,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
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
  addDonorConsent,
  anonymizeDonor,
  createCategory,
  createDonor,
  getCategories,
  getDonor,
  getDonors,
  updateCategory,
  updateDonor,
  type AdminPagination,
  type BarokahiinCategory,
  type BarokahiinDonor,
} from "@/services/barokahiinAdminService";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pager,
  SectionHeading,
} from "./adminUi";
import { formatDate, getErrorMessage } from "./adminUtils";

type Subsection = "donors" | "categories";

export default function DonorsAndCategories() {
  const [section, setSection] = useState<Subsection>("donors");
  return (
    <div className="space-y-5">
      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card p-1">
        {(
          [
            ["donors", "Donatur"],
            ["categories", "Kategori"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            variant={section === id ? "default" : "ghost"}
            onClick={() => setSection(id)}
            className={
              section === id
                ? "h-9 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
                : "h-9 rounded-lg text-muted-foreground"
            }
          >
            {label}
          </Button>
        ))}
      </div>
      {section === "donors" ? <DonorManager /> : <CategoryManager />}
    </div>
  );
}

function DonorManager() {
  const [donors, setDonors] = useState<BarokahiinDonor[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState({ q: "", wilayah: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<BarokahiinDonor | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getDonors({
        ...search,
        page,
        per_page: 15,
      });
      setDonors(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat data donatur."));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch({ q: query.trim(), wilayah: region.trim() });
  };

  const openDonor = async (donor: BarokahiinDonor) => {
    try {
      setSelected(await getDonor(donor.uuid));
    } catch (requestError) {
      toast.error(
        getErrorMessage(requestError, "Gagal membuka detail donatur."),
      );
    }
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <SectionHeading
          icon={UsersRound}
          title="Donatur"
          description="Kelola data donatur, persetujuan, dan privasi informasi."
          action={
            <Button
              type="button"
              onClick={() => {
                setSelected(null);
                setFormOpen((open) => !open);
              }}
              className="h-10 shrink-0 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Donatur baru</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          }
        />
        <CardContent className="space-y-4 px-5 pb-5 pt-0 sm:px-6">
          <form
            onSubmit={handleSearch}
            className="grid gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama atau kontak"
                aria-label="Cari donatur"
                className="h-10 rounded-xl bg-background pl-9"
              />
            </div>
            <Input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="Filter wilayah"
              aria-label="Filter wilayah donatur"
              className="h-10 rounded-xl bg-background"
            />
            <Button type="submit" variant="outline" className="h-10 rounded-xl">
              <Search className="size-4" />
              Cari
            </Button>
          </form>

          {formOpen && (
            <DonorForm
              onCancel={() => setFormOpen(false)}
              onSaved={() => {
                setFormOpen(false);
                setPage(1);
                setSearch({ q: "", wilayah: "" });
                setQuery("");
                setRegion("");
              }}
            />
          )}

          {error && <ErrorState message={error} onRetry={() => void load()} />}
          {loading && donors.length === 0 ? (
            <LoadingState label="Memuat donatur..." />
          ) : donors.length === 0 ? (
            <EmptyState
              title="Donatur belum ditemukan"
              description="Ubah kata kunci atau tambahkan donatur baru."
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {donors.map((donor) => (
                  <DonorCard
                    key={donor.uuid}
                    donor={donor}
                    onOpen={() => void openDonor(donor)}
                  />
                ))}
              </div>
              <div className="hidden md:block">
                <Table className="min-w-175">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Nama</TableHead>
                      <TableHead>Wilayah</TableHead>
                      <TableHead>Persetujuan</TableHead>
                      <TableHead>Terdaftar</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donors.map((donor) => (
                      <TableRow key={donor.uuid}>
                        <TableCell>
                          <p className="font-semibold">{donor.nama}</p>
                          <p className="text-xs text-muted-foreground">
                            {donor.kontak || "Kontak tidak tersedia"}
                          </p>
                        </TableCell>
                        <TableCell>{donor.wilayah || "—"}</TableCell>
                        <TableCell>
                          <ConsentBadges donor={donor} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(donor.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => void openDonor(donor)}
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
          title={`Donatur: ${selected.nama}`}
          size="xl"
        >
          <DonorDetail donor={selected} onUpdated={setSelected} />
        </Modal>
      )}
    </div>
  );
}

function DonorCard({
  donor,
  onOpen,
}: {
  donor: BarokahiinDonor;
  onOpen: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{donor.nama}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {donor.kontak || "Kontak tidak tersedia"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {donor.wilayah || "Wilayah belum diisi"} ·{" "}
              {formatDate(donor.created_at)}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onOpen}>
            Detail
          </Button>
        </div>
        <div className="mt-3">
          <ConsentBadges donor={donor} />
        </div>
      </CardContent>
    </Card>
  );
}

function ConsentBadges({ donor }: { donor: BarokahiinDonor }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge
        variant="outline"
        className={
          donor.has_jual_consent
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            : "border-border bg-muted text-muted-foreground"
        }
      >
        Jual {donor.has_jual_consent ? "✓" : "—"}
      </Badge>
      <Badge
        variant="outline"
        className={
          donor.has_media_consent
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            : "border-border bg-muted text-muted-foreground"
        }
      >
        Media {donor.has_media_consent ? "✓" : "—"}
      </Badge>
      {donor.dianonimkan_pada && <Badge variant="secondary">Anonim</Badge>}
    </div>
  );
}

function DonorForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [catatan, setCatatan] = useState("");
  const [preferensiAnonim, setPreferensiAnonim] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const donor = await createDonor({
        nama: nama.trim(),
        kontak: kontak.trim(),
        wilayah: wilayah.trim() || null,
        catatan: catatan.trim() || null,
        preferensi_anonim: preferensiAnonim,
      });
      toast.success(donor.duplicate_warning || "Donatur berhasil ditambahkan.");
      onSaved();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal menyimpan donatur."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-emerald-200 bg-emerald-50/30 shadow-none dark:border-emerald-900 dark:bg-emerald-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tambah donatur</CardTitle>
        <CardDescription>
          Kontak akan disimpan terenkripsi oleh backend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama donatur" required>
            <Input
              required
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              className="rounded-xl bg-background"
            />
          </FormField>
          <FormField label="Kontak" required>
            <Input
              required
              value={kontak}
              onChange={(event) => setKontak(event.target.value)}
              className="rounded-xl bg-background"
            />
          </FormField>
          <FormField label="Wilayah">
            <Input
              value={wilayah}
              onChange={(event) => setWilayah(event.target.value)}
              className="rounded-xl bg-background"
            />
          </FormField>
          <FormField label="Catatan">
            <Input
              value={catatan}
              onChange={(event) => setCatatan(event.target.value)}
              className="rounded-xl bg-background"
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={preferensiAnonim}
              onChange={(event) => setPreferensiAnonim(event.target.checked)}
              className="size-4 accent-emerald-700"
            />
            Utamakan anonimitas donatur pada publikasi
          </label>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {saving ? "Menyimpan..." : "Simpan donatur"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DonorDetail({
  donor,
  onUpdated,
}: {
  donor: BarokahiinDonor;
  onUpdated: (donor: BarokahiinDonor) => void;
}) {
  const [nama, setNama] = useState(donor.nama);
  const [kontak, setKontak] = useState(donor.kontak ?? "");
  const [wilayah, setWilayah] = useState(donor.wilayah ?? "");
  const [catatan, setCatatan] = useState(donor.catatan ?? "");
  const [preferensiAnonim, setPreferensiAnonim] = useState(
    Boolean(donor.preferensi_anonim),
  );
  const [consentType, setConsentType] = useState<"jual" | "publikasi_media">(
    "jual",
  );
  const [proofType, setProofType] = useState<
    "tertulis" | "digital" | "lisan_terekam"
  >("tertulis");
  const [consentNote, setConsentNote] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await updateDonor(donor.uuid, {
        nama: nama.trim(),
        kontak: kontak.trim(),
        wilayah: wilayah.trim() || null,
        catatan: catatan.trim() || null,
        preferensi_anonim: preferensiAnonim,
      });
      onUpdated({ ...donor, ...updated });
      toast.success("Data donatur diperbarui.");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal memperbarui donatur."));
    } finally {
      setSaving(false);
    }
  };

  const addConsent = async () => {
    setSaving(true);
    try {
      const updated = await addDonorConsent(donor.uuid, {
        jenis: consentType,
        bentuk_bukti: proofType,
        catatan: consentNote.trim() || undefined,
      });
      onUpdated({ ...donor, ...updated });
      setConsentNote("");
      toast.success("Persetujuan donatur berhasil dicatat.");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal mencatat persetujuan."));
    } finally {
      setSaving(false);
    }
  };

  const anonymize = async () => {
    if (
      !window.confirm(
        "Anonimkan donatur ini? Data pribadi akan dihapus permanen dan tidak dapat dipulihkan.",
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const updated = await anonymizeDonor(donor.uuid);
      onUpdated({ ...donor, ...updated });
      setNama(updated.nama);
      setKontak(updated.kontak ?? "");
      setWilayah(updated.wilayah ?? "");
      setCatatan(updated.catatan ?? "");
      toast.success("Data pribadi donatur telah dianonimkan.");
    } catch (requestError) {
      toast.error(
        getErrorMessage(requestError, "Gagal menganonimkan donatur."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="space-y-4">
        <p className="break-all font-mono text-xs text-muted-foreground">
          {donor.uuid}
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="space-y-4">
          <h3 className="font-semibold">Informasi donatur</h3>
          <FormField label="Nama" required>
            <Input
              required
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              className="rounded-xl"
            />
          </FormField>
          <FormField label="Kontak" required>
            <Input
              required
              value={kontak}
              onChange={(event) => setKontak(event.target.value)}
              className="rounded-xl"
            />
          </FormField>
          <FormField label="Wilayah">
            <Input
              value={wilayah}
              onChange={(event) => setWilayah(event.target.value)}
              className="rounded-xl"
            />
          </FormField>
          <FormField label="Catatan">
            <Input
              value={catatan}
              onChange={(event) => setCatatan(event.target.value)}
              className="rounded-xl"
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={preferensiAnonim}
              onChange={(event) => setPreferensiAnonim(event.target.checked)}
              className="size-4 accent-emerald-700"
            />
            Preferensi anonim
          </label>
          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto"
          >
            {saving ? "Menyimpan..." : "Simpan perubahan"}
          </Button>
          {donor.dianonimkan_pada ? (
            <p className="text-sm text-muted-foreground">
              Dianonimkan pada {formatDate(donor.dianonimkan_pada)}.
            </p>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void anonymize()}
              className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 sm:ml-2 sm:w-auto"
            >
              <Archive className="size-4" />
              Anonimkan
            </Button>
          )}
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Persetujuan</h3>
              <ConsentBadges donor={donor} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FormField label="Jenis persetujuan">
                <Select
                  value={consentType}
                  onValueChange={(value) =>
                    setConsentType(value as typeof consentType)
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jual">Persetujuan jual</SelectItem>
                    <SelectItem value="publikasi_media">
                      Publikasi media
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Bentuk bukti">
                <Select
                  value={proofType}
                  onValueChange={(value) =>
                    setProofType(value as typeof proofType)
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tertulis">Tertulis</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="lisan_terekam">Lisan terekam</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Catatan persetujuan">
                <Input
                  value={consentNote}
                  onChange={(event) => setConsentNote(event.target.value)}
                  className="rounded-xl"
                />
              </FormField>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void addConsent()}
              className="mt-3 w-full rounded-xl sm:w-auto"
            >
              <Check className="size-4" />
              Catat persetujuan
            </Button>
          </div>
          <div className="rounded-2xl border border-border/70 p-4">
            <h3 className="font-semibold">Barang terkait</h3>
            {donor.items?.length ? (
              <div className="mt-3 space-y-2">
                {donor.items.map((item) => (
                  <div
                    key={item.uuid}
                    className="flex flex-col gap-1 rounded-xl bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{item.nama_internal}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.kode_barang}
                      </p>
                    </div>
                    <Badge variant="secondary">{item.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Belum ada barang terkait.
              </p>
            )}
          </div>
        </div>
        </div>
      </div>
  );
}

function CategoryManager() {
  const [categories, setCategories] = useState<BarokahiinCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BarokahiinCategory | null>(null);
  const [nama, setNama] = useState("");
  const [urutan, setUrutan] = useState("0");
  const [aktif, setAktif] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCategories(await getCategories());
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat kategori."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (category?: BarokahiinCategory) => {
    setEditing(category ?? null);
    setNama(category?.nama ?? "");
    setUrutan(String(category?.urutan ?? categories.length));
    setAktif(category?.aktif ?? true);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nama: nama.trim(),
        urutan: Number(urutan),
        aktif,
      };
      if (editing) {
        await updateCategory(editing.uuid, payload);
        toast.success("Kategori diperbarui.");
      } else {
        await createCategory(payload);
        toast.success("Kategori ditambahkan.");
      }
      startEdit();
      await load();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal menyimpan kategori."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
      <Card className="h-fit overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <SectionHeading
          icon={Edit3}
          title={editing ? "Ubah kategori" : "Kategori baru"}
          description="Kategori aktif tersedia untuk klasifikasi barang."
        />
        <CardContent className="px-5 pb-5 pt-0 sm:px-6">
          <form onSubmit={save} className="space-y-4">
            <FormField label="Nama kategori" required>
              <Input
                required
                value={nama}
                onChange={(event) => setNama(event.target.value)}
                placeholder="Contoh: Peralatan rumah tangga"
                className="rounded-xl"
              />
            </FormField>
            <FormField label="Urutan">
              <Input
                type="number"
                min={0}
                value={urutan}
                onChange={(event) => setUrutan(event.target.value)}
                className="rounded-xl"
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={aktif}
                onChange={(event) => setAktif(event.target.checked)}
                className="size-4 accent-emerald-700"
              />
              Kategori aktif
            </label>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
              >
                {saving
                  ? "Menyimpan..."
                  : editing
                    ? "Simpan perubahan"
                    : "Tambah kategori"}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startEdit()}
                >
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <SectionHeading
          icon={UsersRound}
          title="Daftar kategori"
          description="Kelola label untuk klasifikasi barang."
          action={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-xl"
              aria-label="Muat ulang kategori"
              onClick={() => void load()}
            >
              <RefreshCwIcon loading={loading} />
            </Button>
          }
        />
        <CardContent className="px-5 pb-5 pt-0 sm:px-6">
          {error && <ErrorState message={error} onRetry={() => void load()} />}
          {loading && categories.length === 0 ? (
            <LoadingState label="Memuat kategori..." />
          ) : categories.length === 0 ? (
            <EmptyState
              title="Belum ada kategori"
              description="Tambahkan kategori untuk mulai mengelompokkan barang."
            />
          ) : (
            <div className="space-y-2">
              {categories
                .slice()
                .sort((a, b) => a.urutan - b.urutan)
                .map((category) => (
                  <div
                    key={category.uuid}
                    className="flex flex-col gap-3 rounded-2xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold">
                        {category.urutan}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {category.nama}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {category.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <Badge variant={category.aktif ? "default" : "secondary"}>
                        {category.aktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(category)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function RefreshCwIcon({ loading }: { loading: boolean }) {
  return <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />;
}
