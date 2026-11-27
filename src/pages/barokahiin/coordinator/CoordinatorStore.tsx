import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  CheckCircle2,
  Clock,
  Crosshair,
  ExternalLink,
  MapPin,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Store,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EMPTY_WILAYAH,
  getConsoleStore,
  getConsoleStoreScore,
  parseBarokahiinError,
  pauseConsoleStore,
  resumeConsoleStore,
  submitStoreAddress,
  updateConsoleStore,
  type BarokahiinMedia,
  type WilayahValue,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ConsoleSelect,
  ErrorBanner,
  FieldWrapper,
  InfoBanner,
  LevelBadge,
  LoadingSkeleton,
  StatusBadge,
  WilayahCascader,
} from "../components/ui/ConsoleUi";
import { MediaUploadQueue } from "../components/ui/MediaUploadQueue";
import {
  ADDRESS_CHECKS_SPEC,
  formatDateId,
  normalizePhoneId,
} from "../components/ui/utils";

const DAYS_OF_WEEK = [
  { key: "senin", label: "Senin" },
  { key: "selasa", label: "Selasa" },
  { key: "rabu", label: "Rabu" },
  { key: "kamis", label: "Kamis" },
  { key: "jumat", label: "Jumat" },
  { key: "sabtu", label: "Sabtu" },
  { key: "minggu", label: "Minggu" },
] as const;

interface DaySchedule {
  open: boolean;
  start: string;
  end: string;
}

type ScheduleMap = Record<string, DaySchedule>;

function defaultSchedule(): ScheduleMap {
  return {
    senin: { open: true, start: "09:00", end: "17:00" },
    selasa: { open: true, start: "09:00", end: "17:00" },
    rabu: { open: true, start: "09:00", end: "17:00" },
    kamis: { open: true, start: "09:00", end: "17:00" },
    jumat: { open: true, start: "09:00", end: "17:00" },
    sabtu: { open: true, start: "09:00", end: "15:00" },
    minggu: { open: false, start: "09:00", end: "15:00" },
  };
}

function parseOperatingHours(raw: unknown): {
  schedule: ScheduleMap;
  timezone: "WIB" | "WITA" | "WIT";
} {
  const base = defaultSchedule();
  let tz: "WIB" | "WITA" | "WIT" = "WIB";

  if (!raw) return { schedule: base, timezone: tz };

  let obj: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>;
      }
    } catch {
      // Plain text fallback
      return { schedule: base, timezone: tz };
    }
  } else if (typeof raw === "object" && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  }

  if (obj) {
    if (
      obj.timezone === "WIB" ||
      obj.timezone === "WITA" ||
      obj.timezone === "WIT"
    ) {
      tz = obj.timezone;
    }
    for (const d of DAYS_OF_WEEK) {
      const val = obj[d.key];
      if (typeof val === "string") {
        const lower = val.toLowerCase();
        if (lower === "tutup" || lower === "closed" || lower === "-") {
          base[d.key] = { open: false, start: "09:00", end: "17:00" };
        } else {
          const match = val.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
          if (match) {
            base[d.key] = {
              open: true,
              start: match[1].replace(".", ":").padStart(5, "0"),
              end: match[2].replace(".", ":").padStart(5, "0"),
            };
          }
        }
      } else if (val && typeof val === "object") {
        const v = val as Record<string, unknown>;
        base[d.key] = {
          open: Boolean(v.open ?? v.buka ?? true),
          start: String(v.start ?? v.jam_buka ?? "09:00"),
          end: String(v.end ?? v.jam_tutup ?? "17:00"),
        };
      }
    }
  }

  return { schedule: base, timezone: tz };
}

function serializeOperatingHours(
  schedule: ScheduleMap,
  timezone: "WIB" | "WITA" | "WIT",
): Record<string, string> {
  const result: Record<string, string> = { timezone };
  for (const d of DAYS_OF_WEEK) {
    const item = schedule[d.key];
    result[d.key] = item?.open ? `${item.start}-${item.end}` : "tutup";
  }
  return result;
}

function formatOperatingHoursSummary(
  schedule: ScheduleMap,
  timezone: "WIB" | "WITA" | "WIT",
): string[] {
  const lines: string[] = [];
  for (const d of DAYS_OF_WEEK) {
    const item = schedule[d.key];
    if (item?.open) {
      lines.push(`${d.label}: ${item.start} – ${item.end} ${timezone}`);
    }
  }
  return lines.length > 0 ? lines : ["Belum ada hari buka yang dipilih"];
}

export default function CoordinatorStore() {
  const queryClient = useQueryClient();

  const storeQuery = useQuery({
    queryKey: ["barokahiin", "console", "store"],
    queryFn: getConsoleStore,
  });

  const scoreQuery = useQuery({
    queryKey: ["barokahiin", "console", "store-score"],
    queryFn: getConsoleStoreScore,
  });

  const rawStoreData = storeQuery.data as
    | (typeof storeQuery.data & {
        store?: typeof storeQuery.data;
      })
    | undefined;
  const store = rawStoreData?.store ?? rawStoreData;

  // Profile form state
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kebijakan, setKebijakan] = useState("");
  const [schedule, setSchedule] = useState<ScheduleMap>(defaultSchedule);
  const [timezone, setTimezone] = useState<"WIB" | "WITA" | "WIT">("WIB");

  // Address modal + 3-step wizard state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addrStep, setAddrStep] = useState<1 | 2 | 3>(1);
  const [locatingGps, setLocatingGps] = useState(false);
  const [jalanNomor, setJalanNomor] = useState("");
  const [rtRw, setRtRw] = useState("");
  const [wilayah, setWilayah] = useState<WilayahValue>(EMPTY_WILAYAH);
  const [kodePos, setKodePos] = useState("");
  const [patokan, setPatokan] = useState("");
  const [lat, setLat] = useState("-6.9175");
  const [lng, setLng] = useState("107.6191");
  const [jenisTempat, setJenisTempat] = useState<"rumah" | "ruko" | "gudang">(
    "rumah",
  );
  const [statusPenguasaan, setStatusPenguasaan] = useState<
    "milik" | "sewa" | "pinjam"
  >("milik");
  const [buktiRef, setBuktiRef] = useState("");
  const [kontakToko, setKontakToko] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<BarokahiinMedia[]>([]);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Pause dialog
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseDays, setPauseDays] = useState("7");

  useEffect(() => {
    if (!store) return;
    setNama(store.nama ?? "");
    setDeskripsi(store.deskripsi ?? "");
    setKebijakan(store.kebijakan_tambahan ?? "");

    const parsedHours = parseOperatingHours(store.jam_operasional);
    setSchedule(parsedHours.schedule);
    setTimezone(parsedHours.timezone);

    const addr = store.pending_address || store.active_address;
    if (addr) {
      setJalanNomor(addr.jalan_nomor ?? "");
      setRtRw(addr.rt_rw ?? "");
      const addrAny = addr as unknown as Record<string, unknown>;
      setWilayah({
        province_code: String(addrAny.province_code ?? ""),
        regency_code: String(addrAny.regency_code ?? ""),
        district_code: String(addrAny.district_code ?? ""),
        village_code: String(addrAny.village_code ?? ""),
      });
      setKodePos(addr.kode_pos ?? "");
      setPatokan(addr.patokan ?? "");
      if (addr.lat !== null && addr.lat !== undefined) setLat(String(addr.lat));
      if (addr.lng !== null && addr.lng !== undefined) setLng(String(addr.lng));
      setJenisTempat(addr.jenis_tempat ?? "rumah");
      setStatusPenguasaan(addr.status_penguasaan ?? "milik");
      setBuktiRef(addr.bukti_ref ?? "");
      setKontakToko(addr.kontak_toko ?? "");
    }
  }, [store]);

  useEffect(() => {
    if (!addressModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddressModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addressModalOpen]);

  const openDaysCount = DAYS_OF_WEEK.filter((d) => schedule[d.key]?.open).length;

  const saveProfileMut = useMutation({
    mutationFn: () =>
      updateConsoleStore({
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        kebijakan_tambahan: kebijakan.trim(),
        jam_operasional: serializeOperatingHours(schedule, timezone),
      }),
    onSuccess: () => {
      toast.success("Profil toko berhasil disimpan");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const submitAddressMut = useMutation({
    mutationFn: () => {
      const mediaIds = uploadedPhotos
        .map((m) => m.id ?? m.uuid)
        .filter(Boolean);
      return submitStoreAddress({
        jalan_nomor: jalanNomor.trim(),
        rt_rw: rtRw.trim() || "Tidak ada",
        province_code: wilayah.province_code || undefined,
        regency_code: wilayah.regency_code || undefined,
        district_code: wilayah.district_code || undefined,
        village_code: wilayah.village_code,
        kode_pos: kodePos.trim(),
        patokan: patokan.trim(),
        lat: Number(lat),
        lng: Number(lng),
        jenis_tempat: jenisTempat,
        status_penguasaan: statusPenguasaan,
        ...(mediaIds.length > 0 ? { foto_media_ids: mediaIds } : {}),
        bukti_ref: buktiRef.trim(),
        kontak_toko: normalizePhoneId(kontakToko.trim()),
      });
    },
    onSuccess: () => {
      setAddressError(null);
      setAddressModalOpen(false);
      toast.success("Pengajuan alamat toko dikirim untuk verifikasi Admin");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => {
      const parsed = parseBarokahiinError(err);
      setAddressError(parsed.message);
      toast.error(parsed.message);
    },
  });

  const pauseMut = useMutation({
    mutationFn: () => pauseConsoleStore(Number(pauseDays)),
    onSuccess: () => {
      setPauseOpen(false);
      toast.success("Toko berhasil dijeda");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const resumeMut = useMutation({
    mutationFn: resumeConsoleStore,
    onSuccess: () => {
      toast.success("Toko kembali aktif");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  if (storeQuery.isLoading) return <LoadingSkeleton rows={4} />;
  if (storeQuery.error) {
    return (
      <ErrorBanner
        message={
          parseBarokahiinError(storeQuery.error, "Gagal memuat data toko.")
            .message
        }
        onRetry={() => void storeQuery.refetch()}
      />
    );
  }
  if (!store) return null;

  const latestAddress =
    store.pending_address ||
    store.active_address ||
    rawStoreData?.pending_address ||
    rawStoreData?.active_address ||
    store.addresses?.[0] ||
    rawStoreData?.addresses?.[0];
  const resolvedStoreUuid =
    store.uuid ||
    rawStoreData?.uuid ||
    (store as unknown as Record<string, unknown>)?.store_uuid?.toString() ||
    "";
  const resolvedAddressUuid = latestAddress?.uuid || "";
  const isAddressVerified =
    store.address_verified || store.active_address?.status === "terverifikasi";
  const checks = latestAddress?.checks ?? [];

  // Safe Score & Level parsing (never show undefined)
  const scoreRawObj = scoreQuery.data as
    | (Record<string, unknown> & {
        score?: number | null;
        store_score?: number | null;
        total_score?: number | null;
        level?: number;
        components?: Record<string, number>;
      })
    | undefined;
  const numericScoreCandidate =
    scoreRawObj?.score ??
    scoreRawObj?.store_score ??
    scoreRawObj?.total_score ??
    store.store_score;
  const hasValidScore =
    typeof numericScoreCandidate === "number" &&
    Number.isFinite(numericScoreCandidate);
  const resolvedLevel = Number(
    scoreRawObj?.level ?? store.coordinator?.level ?? 1,
  );
  const scoreComponents =
    scoreRawObj?.components && typeof scoreRawObj.components === "object"
      ? scoreRawObj.components
      : null;

  const readinessItems = [
    {
      label: "Profil toko terisi (nama, deskripsi, jam operasional)",
      done: Boolean(store.nama && store.deskripsi && openDaysCount >= 3),
    },
    {
      label: "Alamat lengkap dan pin peta telah diajukan",
      done: Boolean(latestAddress?.jalan_nomor && latestAddress?.patokan),
    },
    {
      label: "Foto lokasi tampak depan (minimal 2) dan bukti alamat",
      done:
        uploadedPhotos.length >= 2 ||
        (latestAddress?.foto_media_ids?.length ?? 0) >= 2 ||
        Boolean(latestAddress?.bukti_ref),
    },
    {
      label: "Verifikasi alamat oleh Admin (V1 sampai V8)",
      done: isAddressVerified,
    },
  ];

  const operatingSummaryLines = formatOperatingHoursSummary(schedule, timezone);

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wilayah.village_code) {
      setAddressError(
        "Wilayah alamat toko wajib dipilih sampai tingkat Kelurahan / Desa.",
      );
      setAddrStep(1);
      return;
    }
    if (!jalanNomor.trim() || !kodePos.trim() || !patokan.trim()) {
      setAddressError(
        "Nama jalan dan nomor, kode pos, serta patokan wajib diisi lengkap.",
      );
      setAddrStep(1);
      return;
    }
    if (!kontakToko.trim()) {
      setAddressError("Nomor kontak toko aktif wajib diisi.");
      setAddrStep(1);
      return;
    }
    if (!buktiRef.trim()) {
      setAddressError(
        "Bukti alamat wajib diisi (surat domisili, tagihan listrik/air, bukti sewa, atau izin pemilik/RT).",
      );
      setAddrStep(3);
      return;
    }
    submitAddressMut.mutate();
  };

  return (
    <div className="space-y-5">
      {/* Readiness checklist */}
      <ConsolePanel
        icon={ShieldCheck}
        title="Kesiapan Toko Koordinator"
        description="Toko tidak dapat mengajukan atau menerbitkan barang sebelum alamat berstatus Terverifikasi oleh Admin."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={store.status} />
            {store.status === "dijeda" ? (
              <button
                type="button"
                className="brk-btn brk-btn-daun"
                disabled={resumeMut.isPending}
                onClick={() => resumeMut.mutate()}
              >
                <PlayCircle className="size-4" aria-hidden="true" />
                <span>Aktifkan kembali</span>
              </button>
            ) : (
              <button
                type="button"
                className="brk-btn brk-btn-secondary"
                onClick={() => setPauseOpen(true)}
              >
                <PauseCircle className="size-4" aria-hidden="true" />
                <span>Jeda toko (cuti)</span>
              </button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {readinessItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-xl border p-3.5"
              style={{
                backgroundColor: item.done ? "var(--daun-muda)" : "var(--kertas)",
                borderColor: item.done ? "var(--daun)" : "var(--garis)",
              }}
            >
              {item.done ? (
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0"
                  style={{ color: "var(--daun)" }}
                  aria-hidden="true"
                />
              ) : (
                <Clock
                  className="mt-0.5 size-5 shrink-0"
                  style={{ color: "var(--peringatan-teks)" }}
                  aria-hidden="true"
                />
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </ConsolePanel>

      {/* Compact Verified Address Card (opens Modal for editing/submitting) */}
      <ConsolePanel
        icon={MapPin}
        title="Alamat Toko Terverifikasi (Titik Ambil)"
        description="Alamat lengkap hanya dibuka ke pembeli yang sudah membayar dengan metode Ambil di tempat."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {latestAddress && <StatusBadge value={latestAddress.status} />}
            <button
              type="button"
              className="brk-btn brk-btn-primary"
              onClick={() => {
                setAddressError(null);
                setAddrStep(1);
                setAddressModalOpen(true);
              }}
            >
              <MapPin className="size-4" aria-hidden="true" />
              <span>
                {latestAddress ? "Ubah / Ajukan Ulang Alamat" : "Ajukan Alamat Toko"}
              </span>
            </button>
          </div>
        }
      >
        {latestAddress?.status === "perlu_perbaikan" && (
          <div className="mb-4">
            <InfoBanner
              tone="warning"
              title="Alamat memerlukan perbaikan"
              message={
                latestAddress.alasan_tolak ||
                "Periksa catatan pada butir V1 sampai V8 di bawah, lalu ajukan ulang melalui tombol di atas."
              }
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div
            className="space-y-2 rounded-xl border p-4 text-sm lg:col-span-5"
            style={{
              backgroundColor: "var(--kertas)",
              borderColor: "var(--garis)",
            }}
          >
            {latestAddress ? (
              <>
                <p className="font-bold">
                  {latestAddress.jalan_nomor} ({latestAddress.rt_rw})
                </p>
                <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                  Patokan: {latestAddress.patokan || "-"}, Kode pos{" "}
                  <span className="brk-num font-semibold">
                    {latestAddress.kode_pos || "-"}
                  </span>
                </p>
                <p className="text-xs capitalize" style={{ color: "var(--muted-brk)" }}>
                  Tempat: {latestAddress.jenis_tempat || "-"} (
                  {latestAddress.status_penguasaan || "-"}), Kontak:{" "}
                  <span className="brk-num">{latestAddress.kontak_toko || "-"}</span>
                </p>
                {latestAddress.lat && latestAddress.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${latestAddress.lat},${latestAddress.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold underline"
                    style={{ color: "var(--indigo)" }}
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    <span>
                      Lihat pin peta ({latestAddress.lat}, {latestAddress.lng})
                    </span>
                  </a>
                )}
                {latestAddress.reverify_due_at && (
                  <p className="pt-1 text-xs" style={{ color: "var(--muted-brk)" }}>
                    Verifikasi ulang berikutnya:{" "}
                    <strong>
                      {formatDateId(latestAddress.reverify_due_at, false)}
                    </strong>
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--muted-brk)" }}>
                Belum ada alamat toko yang diajukan. Klik{" "}
                <strong>Ajukan Alamat Toko</strong> untuk memulai verifikasi V1 sampai V8.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:col-span-7">
            {ADDRESS_CHECKS_SPEC.map((spec) => {
              const found = checks.find((c) => c.kode === spec.kode);
              return (
                <div
                  key={spec.kode}
                  className="rounded-lg border p-2.5 text-xs"
                  style={{
                    backgroundColor: found
                      ? found.lulus
                        ? "var(--daun-muda)"
                        : "var(--bahaya-muda)"
                      : "var(--kertas)",
                    borderColor: found
                      ? found.lulus
                        ? "var(--daun)"
                        : "var(--bahaya)"
                      : "var(--garis)",
                  }}
                >
                  <div className="flex items-center justify-between gap-1 font-bold">
                    <span>{spec.kode}</span>
                    {found ? (
                      found.lulus ? (
                        <CheckCircle2
                          className="size-3.5"
                          style={{ color: "var(--daun)" }}
                        />
                      ) : (
                        <XCircle
                          className="size-3.5"
                          style={{ color: "var(--bahaya)" }}
                        />
                      )
                    ) : (
                      <Clock
                        className="size-3.5"
                        style={{ color: "var(--muted-brk)" }}
                      />
                    )}
                  </div>
                  <p
                    className="mt-1 line-clamp-2"
                    style={{ color: "var(--muted-brk)" }}
                  >
                    {found?.catatan || spec.judul}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </ConsolePanel>

      {/* Profile + Live public preview & Store Score */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ConsolePanel
          className="lg:col-span-7"
          icon={Store}
          title="Profil Toko dan Jam Operasional"
          description="Minimal buka 3 hari per pekan sesuai Pasal 9 Peraturan Koordinator."
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (openDaysCount < 3) {
                toast.error("Jam operasional minimal 3 hari buka per pekan.");
                return;
              }
              saveProfileMut.mutate();
            }}
          >
            <FieldWrapper
              id="store-nama"
              label="Nama toko"
              required
              helper="Unik, pantas, dan tidak meniru merek lain atau mengesankan sebagai pusat."
            >
              <input
                id="store-nama"
                className="brk-input"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </FieldWrapper>

            <FieldWrapper
              id="store-deskripsi"
              label="Deskripsi toko"
              helper={`${deskripsi.length} dari 500 karakter`}
            >
              <textarea
                id="store-deskripsi"
                className="brk-textarea"
                maxLength={500}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              />
            </FieldWrapper>

            {/* Structured Operating Hours Editor */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    Jam operasional ({openDaysCount} hari buka)
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                    Aktifkan hari buka dan atur jam pelayanan toko.
                  </p>
                </div>
                <div className="w-32">
                  <ConsoleSelect
                    value={timezone}
                    onChange={(v) =>
                      setTimezone(v as "WIB" | "WITA" | "WIT")
                    }
                    options={[
                      { value: "WIB", label: "WIB" },
                      { value: "WITA", label: "WITA" },
                      { value: "WIT", label: "WIT" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => {
                  const dayVal = schedule[day.key] ?? {
                    open: false,
                    start: "09:00",
                    end: "17:00",
                  };
                  return (
                    <div
                      key={day.key}
                      className="flex flex-col gap-2 rounded-lg border p-2.5 sm:flex-row sm:items-center sm:justify-between"
                      style={{
                        backgroundColor: dayVal.open
                          ? "var(--kertas)"
                          : "transparent",
                        borderColor: "var(--garis)",
                      }}
                    >
                      <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={dayVal.open}
                          onChange={(e) =>
                            setSchedule((prev) => ({
                              ...prev,
                              [day.key]: {
                                ...dayVal,
                                open: e.target.checked,
                              },
                            }))
                          }
                          className="size-4"
                        />
                        <span className="w-16">{day.label}</span>
                      </label>

                      {dayVal.open ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            aria-label={`Jam buka ${day.label}`}
                            className="brk-input brk-num min-h-9 w-30 px-2 py-1 text-sm"
                            value={dayVal.start}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day.key]: {
                                  ...dayVal,
                                  start: e.target.value,
                                },
                              }))
                            }
                          />
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--muted-brk)" }}
                          >
                            s/d
                          </span>
                          <input
                            type="time"
                            aria-label={`Jam tutup ${day.label}`}
                            className="brk-input brk-num min-h-9 w-30 px-2 py-1 text-sm"
                            value={dayVal.end}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day.key]: {
                                  ...dayVal,
                                  end: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      ) : (
                        <span
                          className="text-xs font-medium"
                          style={{ color: "var(--muted-brk)" }}
                        >
                          Tutup
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <FieldWrapper
              id="store-kebijakan"
              label="Kebijakan toko tambahan"
              helper={`${kebijakan.length} dari 500 karakter`}
            >
              <textarea
                id="store-kebijakan"
                className="brk-textarea"
                maxLength={500}
                value={kebijakan}
                onChange={(e) => setKebijakan(e.target.value)}
              />
            </FieldWrapper>

            <button
              type="submit"
              className="brk-btn brk-btn-primary"
              disabled={saveProfileMut.isPending}
            >
              {saveProfileMut.isPending ? "Menyimpan..." : "Simpan profil toko"}
            </button>
          </form>
        </ConsolePanel>

        <div className="space-y-5 lg:col-span-5">
          {/* Live storefront preview */}
          <ConsolePanel
            icon={Store}
            title="Pratinjau kartu toko publik"
            description="Alamat lengkap tidak tampil di publik, hanya area Kabupaten/Kota."
          >
            <div
              className="rounded-xl border p-4"
              style={{
                backgroundColor: "var(--kertas)",
                borderColor: "var(--garis)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold">
                    {nama || "Nama Toko Anda"}
                  </h3>
                  <p
                    className="mt-0.5 text-sm"
                    style={{ color: "var(--muted-brk)" }}
                  >
                    {store.region_name || "Wilayah penugasan"}
                  </p>
                </div>
                <LevelBadge level={resolvedLevel} />
              </div>

              <p className="mt-3 text-sm" style={{ color: "var(--tinta)" }}>
                {deskripsi || "Deskripsi singkat toko akan tampil di sini."}
              </p>

              <div
                className="mt-3 space-y-1.5 border-t pt-3 text-xs"
                style={{
                  borderColor: "var(--garis)",
                  color: "var(--muted-brk)",
                }}
              >
                <p className="font-semibold" style={{ color: "var(--tinta)" }}>
                  Jam operasional ({timezone}):
                </p>
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {operatingSummaryLines.map((line) => (
                    <li key={line} className="brk-num">
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="pt-1">
                  Rating:{" "}
                  <strong>
                    {store.review_count && store.review_count >= 10
                      ? `${store.rating ?? 0} (${store.review_count} ulasan)`
                      : "Toko baru"}
                  </strong>
                </p>
              </div>
            </div>
          </ConsolePanel>

          {/* Store Score Breakdown */}
          <ConsolePanel
            icon={Award}
            title="Skor Toko dan Level"
            description="Komponen kinerja internal koordinator."
          >
            {scoreQuery.isLoading ? (
              <LoadingSkeleton rows={2} />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="brk-display brk-num text-2xl font-bold">
                    {hasValidScore
                      ? `${numericScoreCandidate} / 100`
                      : "Belum cukup data"}
                  </span>
                  <LevelBadge level={resolvedLevel} />
                </div>

                {scoreComponents && Object.keys(scoreComponents).length > 0 ? (
                  <dl className="space-y-2 text-sm">
                    {Object.entries(scoreComponents).map(([key, rawVal]) => {
                      const val = Number.isFinite(Number(rawVal))
                        ? Number(rawVal)
                        : 0;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between capitalize">
                            <dt style={{ color: "var(--muted-brk)" }}>{key}</dt>
                            <dd className="brk-num font-semibold">{val}</dd>
                          </div>
                          <div
                            className="h-2 w-full overflow-hidden rounded-full"
                            style={{ backgroundColor: "var(--indigo-muda)" }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, val))}%`,
                                backgroundColor: "var(--indigo-btn)",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </dl>
                ) : (
                  <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                    Skor dihitung otomatis setelah minimal 10 pesanan selesai dalam 90 hari terakhir.
                  </p>
                )}
              </div>
            )}
          </ConsolePanel>
        </div>
      </div>

      {/* Store Address Verification Modal (3-step wizard) */}
      {addressModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="brk-addr-modal-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 sm:items-center sm:p-4"
          onClick={() => setAddressModalOpen(false)}
        >
          <div
            className="brk-float brk-safe-bottom max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-4xl border p-5 sm:p-6"
            style={{
              backgroundColor: "var(--putih)",
              borderColor: "var(--garis)",
              color: "var(--tinta)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between gap-3 border-b pb-3"
              style={{ borderColor: "var(--garis)" }}
            >
              <div>
                <h2 id="brk-addr-modal-title" className="text-lg font-bold">
                  Ajukan Alamat Toko Terverifikasi (Titik Ambil)
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "var(--muted-brk)" }}>
                  Perubahan alamat ditolak bila ada pesanan aktif (409 ACTIVE_ORDERS_EXIST).
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Tutup modal alamat"
                className="size-10 shrink-0 rounded-lg"
                onClick={() => setAddressModalOpen(false)}
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>

            {addressError && (
              <div className="mt-4">
                <ErrorBanner message={addressError} />
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleSubmitAddress}>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { step: 1 as const, label: "1. Alamat" },
                  { step: 2 as const, label: "2. Pin & tempat" },
                  { step: 3 as const, label: "3. Foto & bukti" },
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setAddrStep(s.step)}
                    className="brk-btn min-h-10 px-2 text-xs sm:text-sm"
                    style={{
                      backgroundColor:
                        addrStep === s.step
                          ? "var(--indigo-btn)"
                          : "var(--kertas)",
                      color: addrStep === s.step ? "#ffffff" : "var(--tinta)",
                      borderColor:
                        addrStep === s.step
                          ? "var(--indigo-btn)"
                          : "var(--garis)",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {addrStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldWrapper
                      id="addr-jalan"
                      label="Nama jalan, nomor, blok/lantai"
                      required
                    >
                      <input
                        id="addr-jalan"
                        className="brk-input"
                        value={jalanNomor}
                        onChange={(e) => setJalanNomor(e.target.value)}
                        placeholder="Contoh: Jl. Cihampelas No. 12"
                        required
                      />
                    </FieldWrapper>

                    <FieldWrapper
                      id="addr-rtrw"
                      label="RT/RW"
                      required
                      helper="Tulis 'Tidak ada' jika tidak memiliki RT/RW."
                    >
                      <input
                        id="addr-rtrw"
                        className="brk-input"
                        value={rtRw}
                        onChange={(e) => setRtRw(e.target.value)}
                        placeholder="RT 03/RW 05"
                        required
                      />
                    </FieldWrapper>
                  </div>

                  <FieldWrapper
                    label="Wilayah administratif (wajib sampai Kelurahan / Desa)"
                    required
                    helper="Pastikan berada dalam wilayah penugasan koordinator."
                  >
                    <WilayahCascader
                      value={wilayah}
                      onChange={setWilayah}
                      maxLevel="village"
                    />
                  </FieldWrapper>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldWrapper id="addr-pos" label="Kode pos" required>
                      <input
                        id="addr-pos"
                        className="brk-input brk-num"
                        inputMode="numeric"
                        maxLength={5}
                        value={kodePos}
                        onChange={(e) => setKodePos(e.target.value)}
                        placeholder="40131"
                        required
                      />
                    </FieldWrapper>

                    <FieldWrapper
                      id="addr-kontak"
                      label="Nomor kontak toko aktif"
                      required
                    >
                      <input
                        id="addr-kontak"
                        className="brk-input brk-num"
                        inputMode="tel"
                        value={kontakToko}
                        onChange={(e) => setKontakToko(e.target.value)}
                        placeholder="0812 3456 7890"
                        required
                      />
                    </FieldWrapper>
                  </div>

                  <FieldWrapper
                    id="addr-patokan"
                    label="Patokan (penanda dekat)"
                    required
                  >
                    <input
                      id="addr-patokan"
                      className="brk-input"
                      value={patokan}
                      onChange={(e) => setPatokan(e.target.value)}
                      placeholder="Dekat Masjid Al-Hidayah, gerbang biru"
                      required
                    />
                  </FieldWrapper>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="brk-btn brk-btn-primary"
                      onClick={() => setAddrStep(2)}
                    >
                      Lanjut ke pin peta
                    </button>
                  </div>
                </div>
              )}

              {addrStep === 2 && (
                <div className="space-y-4">
                  <div
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      backgroundColor: "var(--kertas)",
                      borderColor: "var(--garis)",
                    }}
                  >
                    <div>
                      <p className="text-sm font-bold">Titik koordinat lokasi</p>
                      <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                        Ambil dari GPS perangkat agar cocok dengan patokan (V3).
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="brk-btn brk-btn-secondary"
                        disabled={locatingGps}
                        onClick={() => {
                          if (!navigator.geolocation) {
                            toast.error("Browser tidak mendukung GPS.");
                            return;
                          }
                          setLocatingGps(true);
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setLat(pos.coords.latitude.toFixed(6));
                              setLng(pos.coords.longitude.toFixed(6));
                              setLocatingGps(false);
                              toast.success("Koordinat GPS berhasil diambil");
                            },
                            () => {
                              setLocatingGps(false);
                              toast.error("Gagal mengambil GPS.");
                            },
                          );
                        }}
                      >
                        <Crosshair className="size-4" aria-hidden="true" />
                        <span>{locatingGps ? "Mencari..." : "Gunakan GPS"}</span>
                      </button>
                      {lat && lng && (
                        <a
                          href={`https://www.google.com/maps?q=${lat},${lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="brk-btn brk-btn-ghost"
                        >
                          <ExternalLink className="size-4" aria-hidden="true" />
                          <span>Cek di Maps</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldWrapper id="addr-lat" label="Latitude" required>
                      <input
                        id="addr-lat"
                        className="brk-input brk-num"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        required
                      />
                    </FieldWrapper>

                    <FieldWrapper id="addr-lng" label="Longitude" required>
                      <input
                        id="addr-lng"
                        className="brk-input brk-num"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        required
                      />
                    </FieldWrapper>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldWrapper id="addr-jenis" label="Jenis tempat" required>
                      <ConsoleSelect
                        id="addr-jenis"
                        value={jenisTempat}
                        onChange={(v) =>
                          setJenisTempat(v as "rumah" | "ruko" | "gudang")
                        }
                        options={[
                          { value: "rumah", label: "Rumah" },
                          { value: "ruko", label: "Ruko" },
                          { value: "gudang", label: "Gudang" },
                        ]}
                      />
                    </FieldWrapper>

                    <FieldWrapper
                      id="addr-penguasaan"
                      label="Status penguasaan tempat"
                      required
                    >
                      <ConsoleSelect
                        id="addr-penguasaan"
                        value={statusPenguasaan}
                        onChange={(v) =>
                          setStatusPenguasaan(v as "milik" | "sewa" | "pinjam")
                        }
                        options={[
                          { value: "milik", label: "Milik sendiri" },
                          { value: "sewa", label: "Sewa" },
                          {
                            value: "pinjam",
                            label: "Pinjam (dengan izin pemilik)",
                          },
                        ]}
                      />
                    </FieldWrapper>
                  </div>

                  <div className="flex justify-between gap-2">
                    <button
                      type="button"
                      className="brk-btn brk-btn-secondary"
                      onClick={() => setAddrStep(1)}
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      className="brk-btn brk-btn-primary"
                      onClick={() => setAddrStep(3)}
                    >
                      Lanjut ke foto & bukti
                    </button>
                  </div>
                </div>
              )}

              {addrStep === 3 && (
                <div className="space-y-4">
                  <FieldWrapper
                    id="addr-bukti"
                    label="Referensi bukti alamat (V5)"
                    required
                    helper="Nomor/tautan surat domisili, tagihan listrik/air, bukti sewa, atau izin pemilik/RT."
                  >
                    <input
                      id="addr-bukti"
                      className="brk-input"
                      value={buktiRef}
                      onChange={(e) => setBuktiRef(e.target.value)}
                      placeholder="Contoh: Tagihan PLN November 2026 / Surat Domisili RT 03"
                      required
                    />
                  </FieldWrapper>

                  <div
                    className="rounded-xl border p-4"
                    style={{
                      backgroundColor: "var(--kertas)",
                      borderColor: "var(--garis)",
                    }}
                  >
                    <p className="mb-2 text-sm font-bold">
                      Foto tampak depan (min. 2 sudut) & ruang penyimpanan (V4)
                    </p>
                    <MediaUploadQueue
                      ownerType={resolvedAddressUuid ? "store_address" : "store"}
                      ownerUuid={resolvedAddressUuid || resolvedStoreUuid}
                      fallbackOwner={
                        resolvedAddressUuid && resolvedStoreUuid
                          ? { ownerType: "store", ownerUuid: resolvedStoreUuid }
                          : null
                      }
                      guideLabel="Ambil foto tampak depan dari 2 sudut berbeda dan ruang penyimpanan yang bersih."
                      buttonLabel="Ambil foto lokasi"
                      onUploaded={(media) =>
                        setUploadedPhotos((prev) => [...prev, media])
                      }
                    />
                    {uploadedPhotos.length > 0 && (
                      <p
                        className="brk-num mt-2 text-xs font-semibold"
                        style={{ color: "var(--daun)" }}
                      >
                        {uploadedPhotos.length} foto lokasi siap dilampirkan.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-between gap-2">
                    <button
                      type="button"
                      className="brk-btn brk-btn-secondary"
                      onClick={() => setAddrStep(2)}
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className="brk-btn brk-btn-primary"
                      disabled={submitAddressMut.isPending}
                    >
                      {submitAddressMut.isPending
                        ? "Mengajukan..."
                        : "Ajukan verifikasi alamat"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pauseOpen}
        title="Jeda toko sementara (cuti)"
        description="Selama toko dijeda, barang tidak tampil di katalog dan pembeli tidak dapat membuat pesanan baru."
        consequences="Pesanan yang sudah dibayar sebelum jeda tetap wajib diselesaikan sesuai SLA 48 jam. Maksimal jeda adalah 30 hari per kali."
        confirmLabel="Jeda toko sekarang"
        loading={pauseMut.isPending}
        onCancel={() => setPauseOpen(false)}
        onConfirm={() => pauseMut.mutate()}
      >
        <FieldWrapper
          id="pause-days"
          label="Lama jeda (hari)"
          required
          helper="Isi antara 1 sampai 30 hari."
        >
          <input
            id="pause-days"
            type="number"
            min={1}
            max={30}
            className="brk-input brk-num"
            value={pauseDays}
            onChange={(e) => setPauseDays(e.target.value)}
          />
        </FieldWrapper>
      </ConfirmDialog>
    </div>
  );
}
