import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  addConsoleDonorConsent,
  anonymizeConsoleDonor,
  createConsoleDonor,
  getConsoleDonors,
  parseBarokahiinError,
  type ConsoleDonor,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ConsoleSelect,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  InfoBanner,
  LoadingSkeleton,
  Pager,
  RegionSelect,
} from "../components/ui/ConsoleUi";
import {
  formatDateId,
  maskSensitive,
  normalizePhoneId,
  unwrapList,
} from "../components/ui/utils";

export default function CoordinatorDonors() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Create form
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");
  const [regionId, setRegionId] = useState("1");
  const [anonim, setAnonim] = useState(true);
  const [catatan, setCatatan] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Consent modal state
  const [consentTarget, setConsentTarget] = useState<ConsoleDonor | null>(null);
  const [consentJenis, setConsentJenis] = useState<"jual" | "publikasi_media">(
    "jual",
  );
  const [consentBukti, setConsentBukti] = useState("");

  // Anonymize modal state
  const [anonTarget, setAnonTarget] = useState<ConsoleDonor | null>(null);

  const donorsQuery = useQuery({
    queryKey: ["barokahiin", "console", "donors", search, page],
    queryFn: () => getConsoleDonors({ q: search, page, per_page: 15 }),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createConsoleDonor({
        region_id: Number(regionId) || regionId,
        nama: nama.trim(),
        kontak: normalizePhoneId(kontak.trim()),
        anonim,
        catatan: catatan.trim() || undefined,
      }),
    onSuccess: (created) => {
      if (created?.duplicate_warning) {
        setDuplicateWarning(created.duplicate_warning);
      } else {
        setDuplicateWarning(null);
      }
      setNama("");
      setKontak("");
      setCatatan("");
      toast.success("Donatur berhasil dicatat");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "donors"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const consentMut = useMutation({
    mutationFn: () => {
      if (!consentTarget) throw new Error("Donatur belum dipilih");
      return addConsoleDonorConsent(consentTarget.uuid, {
        jenis: consentJenis,
        bukti_ref: consentBukti.trim(),
      });
    },
    onSuccess: () => {
      setConsentTarget(null);
      setConsentBukti("");
      toast.success("Persetujuan donatur berhasil dicatat");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "donors"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const anonMut = useMutation({
    mutationFn: () => {
      if (!anonTarget) throw new Error("Donatur belum dipilih");
      return anonymizeConsoleDonor(anonTarget.uuid);
    },
    onSuccess: () => {
      setAnonTarget(null);
      toast.success("Data pribadi donatur telah dianonimkan");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "donors"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const { items: donors, pagination } = unwrapList(donorsQuery.data);

  return (
    <div className="space-y-5">
      {duplicateWarning && (
        <InfoBanner
          tone="warning"
          title="Peringatan potensi duplikat donatur"
          message={duplicateWarning}
        />
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Add donor form */}
        <ConsolePanel
          className="lg:col-span-5"
          icon={Plus}
          title="Catat donatur baru"
          description="Donatur anonim secara default di publik (tampil sebagai Sahabat Berbagi). Nama donatur tidak pernah dikirim ke API publik."
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!nama.trim() || !kontak.trim()) return;
              createMut.mutate();
            }}
          >
            <FieldWrapper id="donor-nama" label="Nama donatur" required>
              <input
                id="donor-nama"
                className="brk-input"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </FieldWrapper>

            <FieldWrapper
              id="donor-kontak"
              label="Nomor HP atau kontak"
              required
              helper="Akan dinormalisasi ke +62 dan diperiksa terhadap duplikat."
            >
              <input
                id="donor-kontak"
                className="brk-input brk-num"
                inputMode="tel"
                value={kontak}
                onChange={(e) => setKontak(e.target.value)}
                placeholder="0812 3456 7890"
                required
              />
            </FieldWrapper>

            <FieldWrapper id="donor-region" label="Wilayah Kabupaten/Kota" required>
              <RegionSelect
                id="donor-region"
                value={regionId}
                onChange={setRegionId}
                required
              />
            </FieldWrapper>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--garis)" }}>
              <input
                type="checkbox"
                checked={anonim}
                onChange={(e) => setAnonim(e.target.checked)}
                className="size-4"
              />
              <span>Anonimkan nama di publik (disarankan)</span>
            </label>

            <FieldWrapper id="donor-catatan" label="Catatan internal">
              <textarea
                id="donor-catatan"
                className="brk-textarea"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </FieldWrapper>

            <button
              type="submit"
              className="brk-btn brk-btn-primary w-full"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "Menyimpan..." : "Simpan donatur"}
            </button>
          </form>
        </ConsolePanel>

        {/* Donor list */}
        <ConsolePanel
          className="lg:col-span-7"
          icon={Users}
          title="Daftar donatur wilayah"
          description="Kedua persetujuan (jual dan publikasi media) wajib aktif sebelum barang dari donatur dapat diajukan review."
        >
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                style={{ color: "var(--muted-brk)" }}
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Cari donatur"
                className="brk-input pl-9"
                placeholder="Cari nama atau nomor HP..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {donorsQuery.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : donorsQuery.error ? (
            <ErrorBanner
              message={parseBarokahiinError(donorsQuery.error).message}
              onRetry={() => void donorsQuery.refetch()}
            />
          ) : donors.length === 0 ? (
            <EmptyState
              title="Belum ada donatur di wilayah ini"
              description="Tambahkan donatur pertama menggunakan formulir di samping."
            />
          ) : (
            <div className="space-y-3">
              {donors.map((donor) => {
                const jualOk =
                  donor.has_jual_consent ||
                  donor.consents?.some((c) => c.jenis === "jual" && c.aktif !== false);
                const mediaOk =
                  donor.has_media_consent ||
                  donor.consents?.some(
                    (c) => c.jenis === "publikasi_media" && c.aktif !== false,
                  );

                return (
                  <article
                    key={donor.uuid}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold">
                          {donor.dianonimkan_pada ? "Donatur Dianonimkan" : donor.nama}
                        </h3>
                        <p
                          className="brk-num mt-0.5 text-sm"
                          style={{ color: "var(--muted-brk)" }}
                        >
                          Kontak: {maskSensitive(donor.kontak)}
                          {donor.region_name ? `, ${donor.region_name}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor: jualOk
                                ? "var(--daun-muda)"
                                : "var(--kunyit-muda)",
                              color: jualOk
                                ? "var(--daun-tua)"
                                : "var(--peringatan-teks)",
                              borderColor: jualOk
                                ? "var(--daun)"
                                : "var(--kunyit)",
                            }}
                          >
                            {jualOk ? (
                              <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            ) : (
                              <AlertTriangle className="size-3.5" aria-hidden="true" />
                            )}
                            Persetujuan jual
                          </span>

                          <span
                            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor: mediaOk
                                ? "var(--daun-muda)"
                                : "var(--kunyit-muda)",
                              color: mediaOk
                                ? "var(--daun-tua)"
                                : "var(--peringatan-teks)",
                              borderColor: mediaOk
                                ? "var(--daun)"
                                : "var(--kunyit)",
                            }}
                          >
                            {mediaOk ? (
                              <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            ) : (
                              <AlertTriangle className="size-3.5" aria-hidden="true" />
                            )}
                            Persetujuan media
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="brk-btn brk-btn-secondary"
                          onClick={() => {
                            setConsentTarget(donor);
                            setConsentJenis(!jualOk ? "jual" : "publikasi_media");
                            setConsentBukti("");
                          }}
                        >
                          <ShieldCheck className="size-4" aria-hidden="true" />
                          <span>Catat persetujuan</span>
                        </button>
                        {!donor.dianonimkan_pada && (
                          <button
                            type="button"
                            className="brk-btn brk-btn-ghost"
                            onClick={() => setAnonTarget(donor)}
                          >
                            <UserMinus className="size-4" aria-hidden="true" />
                            <span>Anonimkan</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {donor.created_at && (
                      <p
                        className="mt-2 text-xs"
                        style={{ color: "var(--muted-brk)" }}
                      >
                        Dicatat pada {formatDateId(donor.created_at)}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <Pager pagination={pagination} onChange={setPage} />
        </ConsolePanel>
      </div>

      {/* Consent modal */}
      <ConfirmDialog
        open={Boolean(consentTarget)}
        title="Catat persetujuan donatur"
        description={`Catat persetujuan untuk ${consentTarget?.nama || "donatur"} sesuai ketentuan Pasal 7.1.`}
        confirmLabel="Simpan persetujuan"
        tone="daun"
        loading={consentMut.isPending}
        onCancel={() => setConsentTarget(null)}
        onConfirm={() => {
          if (!consentBukti.trim()) {
            toast.error("Bukti persetujuan wajib diisi.");
            return;
          }
          consentMut.mutate();
        }}
      >
        <div className="space-y-3">
          <FieldWrapper id="consent-jenis" label="Jenis persetujuan" required>
            <ConsoleSelect
              id="consent-jenis"
              value={consentJenis}
              onChange={(v) =>
                setConsentJenis(v as "jual" | "publikasi_media")
              }
              options={[
                { value: "jual", label: "Persetujuan jual (atau salurkan)" },
                {
                  value: "publikasi_media",
                  label: "Persetujuan publikasi foto dan video barang",
                },
              ]}
            />
          </FieldWrapper>

          <FieldWrapper
            id="consent-bukti"
            label="Referensi bukti persetujuan"
            required
            helper="Contoh: Tangkapan layar WhatsApp 20 Nov 2026 atau formulir serah terima #012."
          >
            <input
              id="consent-bukti"
              className="brk-input"
              value={consentBukti}
              onChange={(e) => setConsentBukti(e.target.value)}
              required
            />
          </FieldWrapper>
        </div>
      </ConfirmDialog>

      {/* Anonymize modal */}
      <ConfirmDialog
        open={Boolean(anonTarget)}
        title="Anonimkan data pribadi donatur"
        description={`Anda akan menganonimkan data pribadi milik ${anonTarget?.nama || "donatur ini"}.`}
        consequences="Nama dan kontak pribadi akan dihapus permanen. Catatan barang dan penjualan historis tetap utuh untuk keperluan audit."
        confirmLabel="Anonimkan sekarang"
        tone="danger"
        loading={anonMut.isPending}
        onCancel={() => setAnonTarget(null)}
        onConfirm={() => anonMut.mutate()}
      />
    </div>
  );
}
