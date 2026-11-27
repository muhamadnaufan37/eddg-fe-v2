import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminCoordinators,
  getAdminStores,
  getWilayahProvinces,
  getWilayahRegencies,
  moderateAdminStore,
  parseBarokahiinError,
  recordStoreAddressCheck,
  rejectStoreAddress,
  sanctionAdminCoordinator,
  verifyAdminCoordinator,
  verifyStoreAddress,
  type AddressCheckCode,
  type CoordinatorStore,
  type CoordinatorSummary,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ConsoleSelect,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  LevelBadge,
  LoadingSkeleton,
  StatusBadge,
} from "../components/ui/ConsoleUi";
import {
  ADDRESS_CHECKS_SPEC,
  maskSensitive,
  unwrapList,
} from "../components/ui/utils";

export default function AdminCoordinatorsStores() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"stores" | "coordinators">("stores");
  const [storeSearch, setStoreSearch] = useState("");
  const [coordSearch, setCoordSearch] = useState("");

  // Selected store for V1-V8 verification
  const [selectedStore, setSelectedStore] = useState<CoordinatorStore | null>(
    null,
  );
  const [checkNotes, setCheckNotes] = useState<Record<string, string>>({});
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectStatus, setRejectStatus] = useState<
    "perlu_perbaikan" | "ditolak"
  >("perlu_perbaikan");
  const [rejectReason, setRejectReason] = useState("");

  // Store moderation modal
  const [modStore, setModStore] = useState<CoordinatorStore | null>(null);
  const [modStatus, setModStatus] = useState<
    "aktif" | "dibatasi" | "ditangguhkan" | "ditutup"
  >("aktif");
  const [modNote, setModNote] = useState("");

  // Coordinator verify modal (uses official regency_codes[] from /public/wilayah)
  const [verifyTarget, setVerifyTarget] = useState<CoordinatorSummary | null>(
    null,
  );
  const [verifyStatus, setVerifyStatus] = useState("aktif");
  const [verifyLevel, setVerifyLevel] = useState<1 | 2 | 3>(1);
  const [verifyProvCode, setVerifyProvCode] = useState("32");
  const [verifyRegencyCodes, setVerifyRegencyCodes] = useState<string[]>([]);
  const [verifyAlasan, setVerifyAlasan] = useState("");

  // Coordinator sanction modal
  const [sanctionTarget, setSanctionTarget] =
    useState<CoordinatorSummary | null>(null);
  const [sanctionTier, setSanctionTier] = useState<
    "ringan" | "sedang" | "berat"
  >("ringan");
  const [sanctionJenis, setSanctionJenis] = useState("");
  const [sanctionAlasan, setSanctionAlasan] = useState("");
  const [sanctionSelesai, setSanctionSelesai] = useState("");

  const storesQuery = useQuery({
    queryKey: ["barokahiin", "admin", "stores", storeSearch],
    queryFn: () => getAdminStores({ q: storeSearch, per_page: 30 }),
    enabled: subTab === "stores",
  });

  const coordsQuery = useQuery({
    queryKey: ["barokahiin", "admin", "coordinators", coordSearch],
    queryFn: () => getAdminCoordinators({ q: coordSearch, per_page: 30 }),
    enabled: subTab === "coordinators",
  });

  const provincesQuery = useQuery({
    queryKey: ["barokahiin", "public-wilayah", "provinces"],
    queryFn: getWilayahProvinces,
    staleTime: 1000 * 60 * 30,
    enabled: Boolean(verifyTarget),
  });

  const regenciesQuery = useQuery({
    queryKey: ["barokahiin", "public-wilayah", "regencies", verifyProvCode],
    queryFn: () => getWilayahRegencies(verifyProvCode),
    staleTime: 1000 * 60 * 30,
    enabled: Boolean(verifyTarget && verifyProvCode),
  });

  const checkMut = useMutation({
    mutationFn: ({
      addressUuid,
      kode,
      lulus,
      catatan,
    }: {
      addressUuid: string;
      kode: AddressCheckCode;
      lulus: boolean;
      catatan?: string;
    }) => recordStoreAddressCheck(addressUuid, { kode, lulus, catatan }),
    onSuccess: (updatedAddr) => {
      toast.success("Hasil pemeriksaan alamat tersimpan");
      setSelectedStore((prev) =>
        prev
          ? {
              ...prev,
              pending_address: updatedAddr,
            }
          : prev,
      );
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "stores"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const verifyAddrMut = useMutation({
    mutationFn: (addressUuid: string) => verifyStoreAddress(addressUuid),
    onSuccess: () => {
      toast.success("Alamat toko terverifikasi dan diaktifkan secara atomik");
      setSelectedStore(null);
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const rejectAddrMut = useMutation({
    mutationFn: (addressUuid: string) =>
      rejectStoreAddress(addressUuid, {
        status: rejectStatus,
        alasan: rejectReason.trim(),
      }),
    onSuccess: () => {
      setRejectModalOpen(false);
      setRejectReason("");
      setSelectedStore(null);
      toast.success("Status pengajuan alamat diperbarui");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const moderateMut = useMutation({
    mutationFn: () =>
      moderateAdminStore(modStore!.uuid, {
        status: modStatus,
        note: modNote.trim() || undefined,
      }),
    onSuccess: () => {
      setModStore(null);
      setModNote("");
      toast.success("Status moderasi toko diperbarui");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "stores"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const verifyCoordMut = useMutation({
    mutationFn: () =>
      verifyAdminCoordinator(verifyTarget!.uuid, {
        status: verifyStatus,
        level: verifyLevel,
        regency_codes: verifyRegencyCodes,
        alasan: verifyAlasan.trim() || undefined,
      }),
    onSuccess: () => {
      setVerifyTarget(null);
      setVerifyAlasan("");
      toast.success("Verifikasi koordinator diperbarui");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "coordinators"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const sanctionMut = useMutation({
    mutationFn: () =>
      sanctionAdminCoordinator(sanctionTarget!.uuid, {
        tingkat: sanctionTier,
        jenis: sanctionJenis.trim(),
        alasan: sanctionAlasan.trim(),
        selesai: sanctionSelesai || null,
      }),
    onSuccess: () => {
      setSanctionTarget(null);
      setSanctionJenis("");
      setSanctionAlasan("");
      toast.success(
        sanctionTier === "berat"
          ? "Sanksi berat dicatat: koordinator dan toko otomatis ditangguhkan"
          : "Sanksi koordinator berhasil dicatat",
      );
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const { items: stores } = unwrapList(storesQuery.data);
  const { items: coords } = unwrapList(coordsQuery.data);

  const targetAddr =
    selectedStore?.pending_address || selectedStore?.active_address;
  const requiredAddressCodes =
    (selectedStore?.coordinator?.level ?? 1) === 1
      ? ["V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8"]
      : ["V1", "V2", "V3", "V4", "V5", "V6", "V7"];
  const passedAddressChecksCount = requiredAddressCodes.filter((code) =>
    targetAddr?.checks?.some((c) => c.kode === code && c.lulus),
  ).length;
  const allRequiredAddressChecksPassed =
    passedAddressChecksCount === requiredAddressCodes.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`brk-btn ${subTab === "stores" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("stores")}
        >
          <MapPin className="size-4" aria-hidden="true" />
          <span>Toko dan verifikasi alamat (V1 sampai V8)</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "coordinators" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("coordinators")}
        >
          <Users className="size-4" aria-hidden="true" />
          <span>Koordinator, level, dan sanksi</span>
        </button>
      </div>

      {subTab === "stores" && (
        <ConsolePanel
          icon={Store}
          title="Daftar toko dan antrean verifikasi alamat"
          description="Pilih toko untuk memeriksa butir V1 sampai V8 secara berdampingan. Alamat hanya bisa disetujui jika V1–V7 (serta V8 untuk Level 1) lulus."
        >
          <div className="mb-4">
            <input
              type="search"
              aria-label="Cari toko"
              className="brk-input sm:max-w-sm"
              placeholder="Cari nama toko atau wilayah..."
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
            />
          </div>

          {storesQuery.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : storesQuery.error ? (
            <ErrorBanner
              message={parseBarokahiinError(storesQuery.error).message}
              onRetry={() => void storesQuery.refetch()}
            />
          ) : stores.length === 0 ? (
            <EmptyState
              title="Belum ada toko terdaftar"
              description="Toko koordinator akan tampil di sini setelah pendaftaran."
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {stores.map((s) => {
                  const addr = s.pending_address || s.active_address;
                  return (
                    <article
                      key={s.uuid}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor:
                          selectedStore?.uuid === s.uuid
                            ? "var(--indigo)"
                            : "var(--garis)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold">{s.nama}</h3>
                          <p
                            className="text-xs"
                            style={{ color: "var(--muted-brk)" }}
                          >
                            {s.region_name || "Wilayah"} — Koordinator:{" "}
                            {s.coordinator?.nama || "-"}
                          </p>
                        </div>
                        <StatusBadge value={s.status} />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <LevelBadge level={s.coordinator?.level} />
                        {addr && <StatusBadge value={addr.status} />}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {addr && (
                          <button
                            type="button"
                            className="brk-btn brk-btn-primary"
                            onClick={() => {
                              setSelectedStore(s);
                              setCheckNotes({});
                            }}
                          >
                            <MapPin className="size-4" aria-hidden="true" />
                            <span>Periksa alamat V1–V8</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="brk-btn brk-btn-secondary"
                          onClick={() => {
                            setModStore(s);
                            setModStatus("aktif");
                            setModNote("");
                          }}
                        >
                          Moderasi toko
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Side-by-side V1-V8 verification workspace */}
              {selectedStore && targetAddr && (
                <div
                  className="grid grid-cols-1 gap-5 rounded-xl border p-4 lg:grid-cols-12 lg:p-5"
                  style={{
                    backgroundColor: "var(--kertas)",
                    borderColor: "var(--indigo)",
                  }}
                >
                  {/* Left: Submitted address & proofs */}
                  <div className="space-y-3 lg:col-span-5">
                    <h3 className="text-lg font-bold">
                      Data alamat: {selectedStore.nama}
                    </h3>
                    <dl
                      className="space-y-2 rounded-xl border p-4 text-sm"
                      style={{
                        backgroundColor: "var(--putih)",
                        borderColor: "var(--garis)",
                      }}
                    >
                      <div>
                        <dt className="text-xs font-semibold" style={{ color: "var(--muted-brk)" }}>
                          Jalan dan nomor
                        </dt>
                        <dd className="font-semibold">
                          {targetAddr.jalan_nomor} ({targetAddr.rt_rw})
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold" style={{ color: "var(--muted-brk)" }}>
                          Patokan dan kode pos
                        </dt>
                        <dd>
                          {targetAddr.patokan} — Kode pos{" "}
                          <span className="brk-num font-semibold">
                            {targetAddr.kode_pos}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold" style={{ color: "var(--muted-brk)" }}>
                          Koordinat pin peta
                        </dt>
                        <dd className="brk-num">
                          {targetAddr.lat}, {targetAddr.lng}
                          {targetAddr.lat && targetAddr.lng && (
                            <a
                              href={`https://www.google.com/maps?q=${targetAddr.lat},${targetAddr.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 font-semibold underline"
                              style={{ color: "var(--indigo)" }}
                            >
                              Buka di peta
                            </a>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold" style={{ color: "var(--muted-brk)" }}>
                          Jenis dan status tempat
                        </dt>
                        <dd className="capitalize">
                          {targetAddr.jenis_tempat}, {targetAddr.status_penguasaan}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold" style={{ color: "var(--muted-brk)" }}>
                          Bukti alamat dan kontak toko
                        </dt>
                        <dd>
                          {targetAddr.bukti_ref || "-"} (Kontak:{" "}
                          <span className="brk-num">{targetAddr.kontak_toko}</span>)
                        </dd>
                      </div>
                    </dl>

                    {targetAddr.media && targetAddr.media.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {targetAddr.media.map((m) => (
                          <img
                            key={m.uuid}
                            src={m.url}
                            alt={m.alt || "Foto lokasi toko"}
                            className="aspect-4/3 w-full rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: V1-V8 checklist */}
                  <div className="space-y-3 lg:col-span-7">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-base font-bold">
                        Checklist pemeriksaan V1 sampai V8
                      </h4>
                      <span
                        className="brk-num rounded-full px-3 py-1 text-xs font-bold"
                        style={{
                          backgroundColor: allRequiredAddressChecksPassed
                            ? "var(--daun-muda)"
                            : "var(--kunyit-muda)",
                          color: allRequiredAddressChecksPassed
                            ? "var(--daun-tua)"
                            : "var(--peringatan-teks)",
                        }}
                      >
                        {passedAddressChecksCount} dari {requiredAddressCodes.length} butir wajib lulus
                      </span>
                    </div>
                    <ul className="space-y-2.5">
                      {ADDRESS_CHECKS_SPEC.map((spec) => {
                        const existing = targetAddr.checks?.find(
                          (c) => c.kode === spec.kode,
                        );
                        return (
                          <li
                            key={spec.kode}
                            className="rounded-xl border p-3"
                            style={{
                              backgroundColor: "var(--putih)",
                              borderColor: existing
                                ? existing.lulus
                                  ? "var(--daun)"
                                  : "var(--bahaya)"
                                : "var(--garis)",
                            }}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-bold">
                                  {spec.kode} — {spec.judul}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "var(--muted-brk)" }}
                                >
                                  {spec.deskripsi}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-1.5">
                                <button
                                  type="button"
                                  className={`brk-btn min-h-9.5 px-3 text-xs ${existing?.lulus ? "brk-btn-daun" : "brk-btn-secondary"}`}
                                  disabled={checkMut.isPending}
                                  onClick={() =>
                                    checkMut.mutate({
                                      addressUuid: targetAddr.uuid,
                                      kode: spec.kode,
                                      lulus: true,
                                      catatan: checkNotes[spec.kode]?.trim(),
                                    })
                                  }
                                >
                                  <CheckCircle2 className="size-3.5" />
                                  <span>Lulus</span>
                                </button>
                                <button
                                  type="button"
                                  className={`brk-btn min-h-9.5 px-3 text-xs ${existing && !existing.lulus ? "brk-btn-danger" : "brk-btn-secondary"}`}
                                  disabled={checkMut.isPending}
                                  onClick={() =>
                                    checkMut.mutate({
                                      addressUuid: targetAddr.uuid,
                                      kode: spec.kode,
                                      lulus: false,
                                      catatan: checkNotes[spec.kode]?.trim(),
                                    })
                                  }
                                >
                                  <XCircle className="size-3.5" />
                                  <span>Gagal</span>
                                </button>
                              </div>
                            </div>
                            <input
                              aria-label={`Catatan ${spec.kode}`}
                              className="brk-input mt-2 min-h-9 py-1 text-xs"
                              placeholder="Catatan pemeriksaan (opsional)..."
                              value={
                                checkNotes[spec.kode] ?? existing?.catatan ?? ""
                              }
                              onChange={(e) =>
                                setCheckNotes((prev) => ({
                                  ...prev,
                                  [spec.kode]: e.target.value,
                                }))
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        className="brk-btn brk-btn-daun flex-1"
                        disabled={
                          verifyAddrMut.isPending ||
                          !allRequiredAddressChecksPassed
                        }
                        onClick={() => verifyAddrMut.mutate(targetAddr.uuid)}
                      >
                        <ShieldCheck className="size-4" aria-hidden="true" />
                        <span>Setujui dan verifikasi alamat</span>
                      </button>
                      <button
                        type="button"
                        className="brk-btn brk-btn-danger"
                        onClick={() => {
                          setRejectStatus("perlu_perbaikan");
                          setRejectReason("");
                          setRejectModalOpen(true);
                        }}
                      >
                        Minta perbaikan atau tolak
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ConsolePanel>
      )}

      {subTab === "coordinators" && (
        <ConsolePanel
          icon={Users}
          title="Manajemen koordinator dan wilayah"
          description="Verifikasi pendaftaran, tetapkan level (1–3) dan wilayah penugasan, atau jatuhkan sanksi bertingkat."
        >
          <div className="mb-4">
            <input
              type="search"
              aria-label="Cari koordinator"
              className="brk-input sm:max-w-sm"
              placeholder="Cari nama atau email koordinator..."
              value={coordSearch}
              onChange={(e) => setCoordSearch(e.target.value)}
            />
          </div>

          {coordsQuery.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : coordsQuery.error ? (
            <ErrorBanner
              message={parseBarokahiinError(coordsQuery.error).message}
              onRetry={() => void coordsQuery.refetch()}
            />
          ) : coords.length === 0 ? (
            <EmptyState
              title="Belum ada data koordinator"
              description="Koordinator yang mendaftar akan tampil di sini."
            />
          ) : (
            <div className="space-y-3">
              {coords.map((c) => (
                <article
                  key={c.uuid}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: "var(--garis)" }}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">
                        {c.nama || c.email || c.uuid}
                      </h3>
                      <StatusBadge value={c.status} />
                      <LevelBadge level={c.level} />
                    </div>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      Kontak: {maskSensitive(c.kontak)}
                      {c.regions?.length
                        ? `, Wilayah: ${c.regions.map((r) => r.nama).join(", ")}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="brk-btn brk-btn-primary"
                      onClick={() => {
                        setVerifyTarget(c);
                        setVerifyStatus(c.status || "aktif");
                        setVerifyLevel(c.level || 1);
                        const existingCodes =
                          c.regions
                            ?.map((r) => {
                              const rAny = r as unknown as Record<string, unknown>;
                              return String(rAny.code ?? rAny.kode ?? "").trim();
                            })
                            .filter((code) => code.includes(".")) ?? [];
                        setVerifyRegencyCodes(existingCodes);
                      }}
                    >
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      <span>Verifikasi dan wilayah</span>
                    </button>
                    <button
                      type="button"
                      className="brk-btn brk-btn-danger"
                      onClick={() => {
                        setSanctionTarget(c);
                        setSanctionTier("ringan");
                      }}
                    >
                      <ShieldAlert className="size-4" aria-hidden="true" />
                      <span>Beri sanksi</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </ConsolePanel>
      )}

      {/* Reject address modal */}
      <ConfirmDialog
        open={rejectModalOpen}
        title="Tolak atau minta perbaikan alamat"
        description="Berikan alasan jelas agar koordinator mengetahui bagian yang harus diperbaiki."
        confirmLabel="Simpan keputusan"
        tone="danger"
        loading={rejectAddrMut.isPending}
        onCancel={() => setRejectModalOpen(false)}
        onConfirm={() => {
          if (!targetAddr || !rejectReason.trim()) {
            toast.error("Alasan wajib diisi.");
            return;
          }
          rejectAddrMut.mutate(targetAddr.uuid);
        }}
      >
        <div className="space-y-3">
          <FieldWrapper id="rej-status" label="Status keputusan" required>
            <ConsoleSelect
              id="rej-status"
              value={rejectStatus}
              onChange={(v) =>
                setRejectStatus(v as "perlu_perbaikan" | "ditolak")
              }
              options={[
                { value: "perlu_perbaikan", label: "Perlu perbaikan" },
                { value: "ditolak", label: "Ditolak" },
              ]}
            />
          </FieldWrapper>
          <FieldWrapper id="rej-alasan" label="Alasan" required>
            <textarea
              id="rej-alasan"
              className="brk-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </FieldWrapper>
        </div>
      </ConfirmDialog>

      {/* Moderate store modal */}
      <ConfirmDialog
        open={Boolean(modStore)}
        title={`Moderasi toko: ${modStore?.nama || ""}`}
        description="Ubah status operasional toko sesuai hasil moderasi."
        confirmLabel="Simpan moderasi"
        loading={moderateMut.isPending}
        onCancel={() => setModStore(null)}
        onConfirm={() => moderateMut.mutate()}
      >
        <div className="space-y-3">
          <FieldWrapper id="mod-status" label="Status toko" required>
            <ConsoleSelect
              id="mod-status"
              value={modStatus}
              onChange={(v) =>
                setModStatus(
                  v as "aktif" | "dibatasi" | "ditangguhkan" | "ditutup",
                )
              }
              options={[
                { value: "aktif", label: "Aktif" },
                { value: "dibatasi", label: "Dibatasi" },
                { value: "ditangguhkan", label: "Ditangguhkan" },
                { value: "ditutup", label: "Ditutup" },
              ]}
            />
          </FieldWrapper>
          <FieldWrapper id="mod-note" label="Catatan moderasi">
            <textarea
              id="mod-note"
              className="brk-textarea"
              value={modNote}
              onChange={(e) => setModNote(e.target.value)}
            />
          </FieldWrapper>
        </div>
      </ConfirmDialog>

      {/* Verify coordinator modal */}
      <ConfirmDialog
        open={Boolean(verifyTarget)}
        title={`Verifikasi koordinator: ${verifyTarget?.nama || ""}`}
        description="Tetapkan status, level (1–3), dan daftar Kabupaten/Kota penugasan (regency_codes[])."
        confirmLabel="Simpan verifikasi"
        tone="daun"
        loading={verifyCoordMut.isPending}
        onCancel={() => setVerifyTarget(null)}
        onConfirm={() => {
          if (verifyRegencyCodes.length === 0) {
            toast.error("Pilih minimal satu Kabupaten/Kota penugasan.");
            return;
          }
          verifyCoordMut.mutate();
        }}
      >
        <div className="space-y-3">
          <FieldWrapper id="vc-status" label="Status" required>
            <ConsoleSelect
              id="vc-status"
              value={verifyStatus}
              onChange={setVerifyStatus}
              options={[
                { value: "aktif", label: "Aktif" },
                { value: "disetujui", label: "Disetujui" },
                { value: "perlu_perbaikan", label: "Perlu perbaikan" },
                { value: "ditolak", label: "Ditolak" },
              ]}
            />
          </FieldWrapper>
          <FieldWrapper id="vc-level" label="Level koordinator" required>
            <ConsoleSelect
              id="vc-level"
              value={String(verifyLevel)}
              onChange={(v) => setVerifyLevel(Number(v) as 1 | 2 | 3)}
              options={[
                { value: "1", label: "Level 1, Baru" },
                { value: "2", label: "Level 2, Terpercaya" },
                { value: "3", label: "Level 3, Utama" },
              ]}
            />
          </FieldWrapper>
          <FieldWrapper
            label="Wilayah penugasan Kabupaten/Kota (regency_codes[])"
            required
            helper="Pilih provinsi lalu tambahkan satu atau lebih Kabupaten/Kota. Backend menyinkronkan otomatis dari wilayah.id."
          >
            <div className="space-y-2.5">
              <ConsoleSelect
                value={verifyProvCode}
                onChange={setVerifyProvCode}
                placeholder="Pilih provinsi"
                options={(provincesQuery.data ?? []).map((p) => ({
                  value: p.code,
                  label: p.name,
                }))}
              />

              <ConsoleSelect
                value=""
                disabled={!verifyProvCode || regenciesQuery.isLoading}
                onChange={(code) => {
                  if (!code) return;
                  setVerifyRegencyCodes((prev) =>
                    prev.includes(code) ? prev : [...prev, code],
                  );
                }}
                placeholder={
                  regenciesQuery.isLoading
                    ? "Memuat Kabupaten/Kota..."
                    : "Tambah Kabupaten/Kota..."
                }
                options={(regenciesQuery.data ?? []).map((r) => ({
                  value: r.code,
                  label: `${r.code} — ${r.name}`,
                }))}
              />

              {verifyRegencyCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {verifyRegencyCodes.map((code) => {
                    const matched = (regenciesQuery.data ?? []).find(
                      (r) => r.code === code,
                    );
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--indigo-muda)",
                          color: "var(--indigo)",
                          borderColor: "var(--indigo)",
                        }}
                      >
                        <span className="brk-num">
                          {matched ? `${code} (${matched.name})` : code}
                        </span>
                        <button
                          type="button"
                          aria-label={`Hapus ${code}`}
                          onClick={() =>
                            setVerifyRegencyCodes((prev) =>
                              prev.filter((c) => c !== code),
                            )
                          }
                          className="rounded-full p-0.5"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </FieldWrapper>
          <FieldWrapper id="vc-alasan" label="Catatan atau alasan">
            <input
              id="vc-alasan"
              className="brk-input"
              value={verifyAlasan}
              onChange={(e) => setVerifyAlasan(e.target.value)}
            />
          </FieldWrapper>
        </div>
      </ConfirmDialog>

      {/* Sanction modal */}
      <ConfirmDialog
        open={Boolean(sanctionTarget)}
        title={`Jatuhkan sanksi: ${sanctionTarget?.nama || ""}`}
        description="Setiap sanksi tercatat dan terlihat di dasbor koordinator."
        consequences={
          sanctionTier === "berat"
            ? "Sanksi berat otomatis menangguhkan akun koordinator dan toko secara langsung."
            : "Koordinator memiliki hak menanggapi dan mengajukan banding dalam 7 hari sesuai Pasal 15."
        }
        confirmLabel="Catat sanksi"
        tone="danger"
        loading={sanctionMut.isPending}
        onCancel={() => setSanctionTarget(null)}
        onConfirm={() => {
          if (!sanctionJenis.trim() || !sanctionAlasan.trim()) {
            toast.error("Jenis dan alasan sanksi wajib diisi.");
            return;
          }
          sanctionMut.mutate();
        }}
      >
        <div className="space-y-3">
          <FieldWrapper id="snc-tier" label="Tingkat sanksi" required>
            <ConsoleSelect
              id="snc-tier"
              value={sanctionTier}
              onChange={(v) =>
                setSanctionTier(v as "ringan" | "sedang" | "berat")
              }
              options={[
                { value: "ringan", label: "Ringan (peringatan tertulis)" },
                { value: "sedang", label: "Sedang (pembatasan / turun level)" },
                { value: "berat", label: "Berat (penangguhan segera)" },
              ]}
            />
          </FieldWrapper>
          <FieldWrapper id="snc-jenis" label="Jenis pelanggaran" required>
            <input
              id="snc-jenis"
              className="brk-input"
              value={sanctionJenis}
              onChange={(e) => setSanctionJenis(e.target.value)}
              placeholder="Contoh: Terlambat SLA berulang / Transaksi luar sistem"
            />
          </FieldWrapper>
          <FieldWrapper id="snc-alasan" label="Alasan dan bukti" required>
            <textarea
              id="snc-alasan"
              className="brk-textarea"
              value={sanctionAlasan}
              onChange={(e) => setSanctionAlasan(e.target.value)}
            />
          </FieldWrapper>
          <FieldWrapper id="snc-selesai" label="Tanggal berakhir (opsional)">
            <input
              id="snc-selesai"
              type="date"
              className="brk-input"
              value={sanctionSelesai}
              onChange={(e) => setSanctionSelesai(e.target.value)}
            />
          </FieldWrapper>
        </div>
      </ConfirmDialog>
    </div>
  );
}
