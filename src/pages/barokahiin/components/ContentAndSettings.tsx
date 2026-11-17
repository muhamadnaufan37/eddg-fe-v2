import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BookOpenText,
  CalendarRange,
  FileText,
  ImagePlus,
  Landmark,
  Plus,
  Settings,
  Trash2,
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
  addActivityExpense,
  createActivity,
  deleteActivityMedia,
  getActivities,
  getBarokahiinSettings,
  getStaticPages,
  saveStaticPage,
  uploadActivityMedia,
  updateActivity,
  updateBarokahiinSettings,
  type BarokahiinActivity,
  type BarokahiinActivityMedia,
  type BarokahiinPage,
  type BarokahiinSettings,
} from "@/services/barokahiinAdminService";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "./adminUi";
import { formatMoney, getErrorMessage } from "./adminUtils";

type ContentView = "activities" | "pages" | "settings";

export default function ContentAndSettings() {
  const [view, setView] = useState<ContentView>("activities");
  const tabs: { value: ContentView; label: string; icon: typeof CalendarRange }[] = [
    { value: "activities", label: "Kegiatan", icon: CalendarRange },
    { value: "pages", label: "Halaman statis", icon: BookOpenText },
    { value: "settings", label: "Pengaturan", icon: Settings },
  ];
  return (
    <div className="space-y-5">
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card p-1">
        {tabs.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            type="button"
            variant={view === value ? "default" : "ghost"}
            onClick={() => setView(value)}
            className={
              view === value
                ? "h-9 shrink-0 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
                : "h-9 shrink-0 rounded-lg text-muted-foreground"
            }
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
      </div>
      {view === "activities" && <ActivityManager />}
      {view === "pages" && <StaticPagesManager />}
      {view === "settings" && <SettingsManager />}
    </div>
  );
}

function ActivityManager() {
  const [activities, setActivities] = useState<BarokahiinActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BarokahiinActivity | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setActivities(await getActivities());
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat kegiatan."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      {formOpen && (
        <Modal
          isOpen
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          title={editing ? "Ubah kegiatan" : "Kegiatan baru"}
          size="xl"
        >
          <ActivityForm
            activity={editing ?? undefined}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSaved={() => {
              setFormOpen(false);
              setEditing(null);
              void load();
            }}
            onMediaChanged={() => void load()}
          />
        </Modal>
      )}
      <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CalendarRange className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base sm:text-lg">
                Kegiatan & laporan dana
              </CardTitle>
              <CardDescription className="mt-1">
                Publikasikan kegiatan dan catat penggunaan dana.
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen((open) => !open);
            }}
            className="h-10 shrink-0 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Kegiatan baru</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5 pt-0 sm:px-6">
          {error && <ErrorState message={error} onRetry={() => void load()} />}
          {loading && activities.length === 0 ? (
            <LoadingState label="Memuat kegiatan..." />
          ) : activities.length === 0 ? (
            <EmptyState
              title="Belum ada kegiatan"
              description="Tambahkan kegiatan untuk mencatat target dan transparansi dana."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.uuid}
                  activity={activity}
                  onEdit={() => {
                    setEditing(activity);
                    setFormOpen(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onRefresh={() => void load()}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityForm({
  activity,
  onCancel,
  onSaved,
  onMediaChanged,
}: {
  activity?: BarokahiinActivity;
  onCancel: () => void;
  onSaved: () => void;
  onMediaChanged: () => void;
}) {
  const [judul, setJudul] = useState(activity?.judul ?? "");
  const [deskripsi, setDeskripsi] = useState(activity?.deskripsi ?? "");
  const [target, setTarget] = useState(String(activity?.target_dana ?? ""));
  const [periode, setPeriode] = useState(activity?.periode ?? "");
  const [status, setStatus] = useState<BarokahiinActivity["status"]>(
    activity?.status ?? "draft",
  );
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetValue = Number(target);
    if (!Number.isInteger(targetValue) || targetValue < 0) {
      toast.error("Target dana harus berupa nominal Rupiah yang valid.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        target_dana: targetValue,
        periode: periode.trim() || null,
        status,
      };
      if (activity) {
        await updateActivity(activity.uuid, payload);
        toast.success("Kegiatan diperbarui.");
      } else {
        await createActivity(payload);
        toast.success("Kegiatan dibuat.");
      }
      onSaved();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal menyimpan kegiatan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Status aktif dan selesai ditampilkan pada halaman publik.
      </p>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Judul kegiatan" required>
            <Input required value={judul} onChange={(e) => setJudul(e.target.value)} className="rounded-xl" />
          </Field>
          <Field label="Target dana (Rupiah)" required>
            <Input required type="number" min={0} step={1} value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-xl" />
          </Field>
          <Field label="Periode">
            <Input value={periode} onChange={(e) => setPeriode(e.target.value)} className="rounded-xl" />
          </Field>
          <Field label="Status">
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["draft", "aktif", "selesai", "ditarik"].map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Deskripsi" required>
            <textarea required rows={3} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm sm:col-span-2" />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">
              {saving ? "Menyimpan..." : "Simpan kegiatan"}
            </Button>
          </div>
        </form>
      {activity ? (
        <ActivityMediaManager
          activity={activity}
          onMediaChanged={onMediaChanged}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Simpan kegiatan terlebih dahulu untuk menambahkan media dokumentasi.
        </p>
      )}
    </div>
  );
}

function ActivityMediaManager({
  activity,
  onMediaChanged,
}: {
  activity: BarokahiinActivity;
  onMediaChanged: () => void;
}) {
  const [media, setMedia] = useState(activity.media ?? []);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [alt, setAlt] = useState("");
  const [urutan, setUrutan] = useState(String(activity.media?.length ?? 0));
  const [hasPersonConsent, setHasPersonConsent] = useState(false);
  const [isChildSafe, setIsChildSafe] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState("");

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast.error("Pilih foto atau video terlebih dahulu.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 50 MB.");
      return;
    }
    const tipe = file.type.startsWith("image/")
      ? "foto"
      : file.type.startsWith("video/")
        ? "video"
        : null;
    if (!tipe) {
      toast.error("File harus berupa foto atau video.");
      return;
    }
    const orderValue = Number(urutan);
    if (!Number.isInteger(orderValue) || orderValue < 0) {
      toast.error("Urutan media harus berupa bilangan bulat minimal 0.");
      return;
    }
    const payload = new FormData();
    payload.append("tipe", tipe);
    payload.append("file", file);
    if (keterangan.trim()) payload.append("keterangan", keterangan.trim());
    if (alt.trim()) payload.append("alt", alt.trim());
    payload.append("urutan", String(orderValue));
    payload.append("has_person_consent", String(hasPersonConsent));
    payload.append("is_child_safe", String(isChildSafe));

    setUploading(true);
    try {
      const uploaded = await uploadActivityMedia(activity.uuid, payload);
      setMedia((current) =>
        [...current.filter((item) => item.uuid !== uploaded.uuid), uploaded].sort(
          (first, second) => (first.urutan ?? 0) - (second.urutan ?? 0),
        ),
      );
      setFile(null);
      setFileInputKey((current) => current + 1);
      setKeterangan("");
      setAlt("");
      setUrutan(String(media.length + 1));
      setHasPersonConsent(false);
      setIsChildSafe(true);
      toast.success("Media dokumentasi berhasil diunggah.");
      onMediaChanged();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal mengunggah media."));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (item: BarokahiinActivityMedia) => {
    if (!window.confirm("Hapus media dokumentasi ini?")) return;
    setDeletingUuid(item.uuid);
    try {
      await deleteActivityMedia(item.uuid);
      setMedia((current) => current.filter((entry) => entry.uuid !== item.uuid));
      toast.success("Media dokumentasi dihapus.");
      onMediaChanged();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal menghapus media."));
    } finally {
      setDeletingUuid("");
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 p-4">
      <div>
        <h3 className="font-semibold">Media dokumentasi kegiatan</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Foto dan video maksimal 50 MB. Pastikan dokumentasi aman untuk dipublikasikan.
        </p>
      </div>

      {media.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {media.map((item) => (
            <article
              key={item.uuid}
              className="overflow-hidden rounded-xl border border-border/70"
            >
              {item.tipe === "foto" ? (
                <img
                  src={item.thumbnail_url || item.url}
                  alt={item.alt || item.keterangan || "Dokumentasi kegiatan"}
                  className="aspect-4/3 w-full object-cover"
                />
              ) : (
                <video
                  src={item.url}
                  controls
                  className="aspect-4/3 w-full bg-black object-contain"
                />
              )}
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{item.tipe}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Urutan {item.urutan ?? 0}
                  </span>
                </div>
                {(item.keterangan || item.alt) && (
                  <p className="text-sm">
                    {item.keterangan || item.alt}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {item.has_person_consent && (
                    <Badge variant="outline">Izin orang terkonfirmasi</Badge>
                  )}
                  {item.is_child_safe && (
                    <Badge variant="outline">Aman untuk anak</Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingUuid === item.uuid}
                  onClick={() => void remove(item)}
                  className="w-full text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  {deletingUuid === item.uuid ? "Menghapus..." : "Hapus media"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          Belum ada media dokumentasi.
        </p>
      )}

      <form onSubmit={upload} className="grid gap-3 sm:grid-cols-2">
        <Field label="Foto atau video (maks. 50 MB)" required>
          <Input
            key={fileInputKey}
            required
            type="file"
            accept="image/*,video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="rounded-xl"
          />
        </Field>
        <Field label="Keterangan">
          <Input
            value={keterangan}
            onChange={(event) => setKeterangan(event.target.value)}
            className="rounded-xl"
          />
        </Field>
        <Field label="Alt text">
          <Input
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            className="rounded-xl"
          />
        </Field>
        <Field label="Urutan">
          <Input
            type="number"
            min={0}
            step={1}
            value={urutan}
            onChange={(event) => setUrutan(event.target.value)}
            className="rounded-xl"
          />
        </Field>
        <label className="flex items-start gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={hasPersonConsent}
            onChange={(event) => setHasPersonConsent(event.target.checked)}
            className="mt-0.5 size-4 accent-emerald-700"
          />
          Saya telah memperoleh persetujuan orang yang tampil pada media.
        </label>
        <label className="flex items-start gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={isChildSafe}
            onChange={(event) => setIsChildSafe(event.target.checked)}
            className="mt-0.5 size-4 accent-emerald-700"
          />
          Media aman dan tidak melanggar privasi anak.
        </label>
        <Button
          type="submit"
          disabled={uploading || deletingUuid !== ""}
          className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 sm:col-span-2 sm:justify-self-end"
        >
          <ImagePlus className="size-4" />
          {uploading ? "Mengunggah..." : "Unggah media"}
        </Button>
      </form>
    </section>
  );
}

function ActivityCard({
  activity,
  onEdit,
  onRefresh,
}: {
  activity: BarokahiinActivity;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const [pos, setPos] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateInput(new Date()));
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [publicApproved, setPublicApproved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const saveExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 0) {
      toast.error("Nominal penggunaan dana tidak valid.");
      return;
    }
    setSaving(true);
    try {
      await addActivityExpense(activity.uuid, {
        pos: pos.trim(),
        nominal_rupiah: value,
        tanggal: date,
        keterangan: description.trim() || undefined,
        bukti_ref: reference.trim() || undefined,
        disetujui_publik: publicApproved,
      });
      toast.success("Penggunaan dana berhasil dicatat.");
      setPos("");
      setAmount("");
      setDescription("");
      setReference("");
      setPublicApproved(false);
      setExpenseOpen(false);
      onRefresh();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal mencatat penggunaan dana."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Card className="rounded-2xl border-border/70 shadow-none">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{activity.judul}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Target {formatMoney(activity.target_dana)}
              {activity.periode ? ` · ${activity.periode}` : ""}
            </p>
          </div>
          <Badge variant={activity.status === "aktif" ? "default" : "secondary"}>
            {activity.status}
          </Badge>
        </div>
        <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">
          {activity.deskripsi}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onEdit} className="flex-1 rounded-xl">
            Ubah kegiatan
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setExpenseOpen(true)}
          className="w-full rounded-xl"
        >
          Catat penggunaan dana
        </Button>
      </CardContent>
    </Card>
    {expenseOpen && (
      <Modal
        isOpen
        onClose={() => setExpenseOpen(false)}
        title={`Penggunaan dana · ${activity.judul}`}
        size="lg"
      >
        <form onSubmit={saveExpense} className="grid gap-3 sm:grid-cols-2">
            <Field label="Pos pengeluaran" required>
              <Input required value={pos} onChange={(e) => setPos(e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Nominal (Rupiah)" required>
              <Input required type="number" min={0} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Tanggal" required>
              <Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Referensi bukti">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Keterangan">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:pt-6">
              <input type="checkbox" checked={publicApproved} onChange={(e) => setPublicApproved(e.target.checked)} className="size-4 accent-emerald-700" />
              Setujui untuk publik
            </label>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">
              {saving ? "Menyimpan..." : "Simpan penggunaan dana"}
            </Button>
          </div>
        </form>
      </Modal>
    )}
    </>
  );
}

function StaticPagesManager() {
  const [pages, setPages] = useState<BarokahiinPage[]>([]);
  const [selectedKey, setSelectedKey] = useState("tentang");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getStaticPages();
      setPages(result);
      const page = result.find((item) => item.kunci === selectedKey);
      if (page) {
        setTitle(page.judul);
        setBody(page.isi);
        setPublished(Boolean(page.diterbitkan));
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat halaman statis."));
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const choosePage = (key: string) => {
    setSelectedKey(key);
    const page = pages.find((item) => item.kunci === key);
    setTitle(page?.judul ?? "");
    setBody(page?.isi ?? "");
    setPublished(Boolean(page?.diterbitkan));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveStaticPage({
        kunci: selectedKey,
        judul: title.trim(),
        isi: body,
        diterbitkan: published,
      });
      toast.success("Halaman statis diperbarui.");
      await load();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal menyimpan halaman."));
    } finally {
      setSaving(false);
    }
  };

  const keys = ["tentang", "cara-kerja", "faq", "kebijakan", "kontak"];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(14rem,0.55fr)_minmax(0,1.45fr)]">
      <Card className="h-fit rounded-3xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Halaman yang dikelola</CardTitle>
          <CardDescription>Pilih halaman untuk mengubah kontennya.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {keys.map((key) => (
            <Button
              key={key}
              type="button"
              variant={selectedKey === key ? "default" : "ghost"}
              onClick={() => choosePage(key)}
              className={`h-11 w-full justify-start rounded-xl capitalize ${
                selectedKey === key
                  ? "bg-emerald-700 text-white hover:bg-emerald-800"
                  : "text-muted-foreground"
              }`}
            >
              <FileText className="size-4" />
              {key.replaceAll("-", " ")}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            <BookOpenText className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">Konten halaman</CardTitle>
            <CardDescription className="mt-1">
              Key: <span className="font-mono">{selectedKey}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error && <ErrorState message={error} onRetry={() => void load()} />}
          {loading && pages.length === 0 ? (
            <LoadingState label="Memuat halaman..." />
          ) : (
            <form onSubmit={save} className="space-y-4">
              <Field label="Judul" required>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
              </Field>
              <Field label="Isi" required>
                <textarea required rows={12} value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm leading-6" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="size-4 accent-emerald-700" />
                Terbitkan halaman
              </label>
              <Button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto">
                {saving ? "Menyimpan..." : "Simpan halaman"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsManager() {
  const [settings, setSettings] = useState<BarokahiinSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSettings(await getBarokahiinSettings());
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat pengaturan."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof BarokahiinSettings>(
    key: K,
    value: BarokahiinSettings[K],
  ) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      setSettings(await updateBarokahiinSettings(settings));
      toast.success("Pengaturan Barokahiin disimpan.");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Gagal menyimpan pengaturan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Landmark className="size-5" />
        </span>
        <div>
          <CardTitle className="text-base sm:text-lg">
            Pengaturan storefront
          </CardTitle>
          <CardDescription className="mt-1">
            Informasi rekening resmi, kontak, dan operasional yang tampil ke publik.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error && <ErrorState message={error} onRetry={() => void load()} />}
        {loading && !settings ? (
          <LoadingState label="Memuat pengaturan..." />
        ) : settings ? (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank resmi">
              <Input value={settings.rekening_resmi_bank} onChange={(e) => update("rekening_resmi_bank", e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Nomor rekening">
              <Input value={settings.rekening_resmi_nomor} onChange={(e) => update("rekening_resmi_nomor", e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Atas nama">
              <Input value={settings.rekening_resmi_atas_nama} onChange={(e) => update("rekening_resmi_atas_nama", e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="WhatsApp resmi">
              <Input value={settings.whatsapp_resmi} onChange={(e) => update("whatsapp_resmi", e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Label anonim">
              <Input value={settings.label_anonim} onChange={(e) => update("label_anonim", e.target.value)} className="rounded-xl" />
            </Field>
            <Field label="Batas pembayaran (jam)">
              <Input type="number" min={1} value={settings.batas_bayar_jam} onChange={(e) => update("batas_bayar_jam", Number(e.target.value))} className="rounded-xl" />
            </Field>
            <Field label="Lokasi pengambilan">
              <Input value={settings.lokasi_pengambilan} onChange={(e) => update("lokasi_pengambilan", e.target.value)} className="rounded-xl sm:col-span-2" />
            </Field>
            <Button type="submit" disabled={saving} className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 sm:col-span-2">
              {saving ? "Menyimpan..." : "Simpan pengaturan"}
            </Button>
          </form>
        ) : (
          <EmptyState title="Pengaturan tidak tersedia" description="Periksa koneksi lalu coba muat ulang." />
        )}
      </CardContent>
    </Card>
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

function toDateInput(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
