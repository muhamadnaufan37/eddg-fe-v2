import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileClock,
  FileText,
  Megaphone,
  Percent,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import {
  announceAdminSplitScheme,
  createAdminSplitScheme,
  getAdminAuditLogs,
  getAdminConfig,
  getAdminPages,
  getAdminSplitSchemes,
  parseBarokahiinError,
  saveAdminPage,
  updateAdminConfig,
  updateAdminSettings,
  type SplitScheme,
} from "@/services/barokahiin";
import {
  ConfirmDialog,
  ConsolePanel,
  ConsoleSelect,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  KuitansiPreview,
  LoadingSkeleton,
  Pager,
  StatusBadge,
} from "../components/ui/ConsoleUi";
import {
  daysBetweenNowAnd,
  formatDateId,
  unwrapList,
} from "../components/ui/utils";

export default function AdminConfigAndAudit() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<
    "split" | "config" | "pages" | "audit"
  >("split");

  // Split scheme state (default pilot 40/30/25/5/0)
  const [schemeName, setSchemeName] = useState("Skema Pilot 2026");
  const [koorPct, setKoorPct] = useState(40);
  const [kegPct, setKegPct] = useState(30);
  const [opsPct, setOpsPct] = useState(25);
  const [jamPct, setJamPct] = useState(5);
  const [donPct, setDonPct] = useState(0);

  const [createdSchemes, setCreatedSchemes] = useState<SplitScheme[]>([]);
  const [announceUuidInput, setAnnounceUuidInput] = useState("");
  const [announceTarget, setAnnounceTarget] = useState<SplitScheme | null>(
    null,
  );
  const [effectiveDate, setEffectiveDate] = useState(() => {
    const d = new Date(Date.now() + 31 * 86400000);
    return d.toISOString().slice(0, 10);
  });

  // Structured Config & Settings state (with optional advanced JSON mode)
  const [advancedJsonMode, setAdvancedJsonMode] = useState(false);
  const [configText, setConfigText] = useState("");
  const [cfgHoldMinutes, setCfgHoldMinutes] = useState("30");
  const [cfgSlaHours, setCfgSlaHours] = useState("48");
  const [cfgAutoCancelHours, setCfgAutoCancelHours] = useState("96");
  const [cfgComplaintHours, setCfgComplaintHours] = useState("48");
  const [cfgMinPrice, setCfgMinPrice] = useState("15000");
  const [cfgPackagingFee, setCfgPackagingFee] = useState("2000");
  const [cfgCharityCapPct, setCfgCharityCapPct] = useState("20");
  const [cfgMinPayout, setCfgMinPayout] = useState("100000");

  const [setShowSplit, setSetShowSplit] = useState(true);
  const [setAnonLabel, setSetAnonLabel] = useState("Sahabat Berbagi");
  const [setWhatsapp, setSetWhatsapp] = useState("");
  const [setFraudWarning, setSetFraudWarning] = useState(
    "Pembayaran hanya dilakukan melalui kanal resmi di halaman checkout Barokahiin. Jangan transfer ke rekening pribadi.",
  );

  // Static page editor
  const [pageKey, setPageKey] = useState("cara_kerja");
  const [pageTitle, setPageTitle] = useState("");
  const [pageBody, setPageBody] = useState("");
  const [pagePublished, setPagePublished] = useState(true);

  // Audit logs
  const [auditSearch, setAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);

  const splitSchemesQuery = useQuery({
    queryKey: ["barokahiin", "admin", "split-schemes"],
    queryFn: () => getAdminSplitSchemes({ per_page: 20 }),
    enabled: subTab === "split",
  });

  const pagesQuery = useQuery({
    queryKey: ["barokahiin", "admin", "pages"],
    queryFn: getAdminPages,
    enabled: subTab === "pages",
  });

  const configQuery = useQuery({
    queryKey: ["barokahiin", "admin", "config"],
    queryFn: getAdminConfig,
    enabled: subTab === "config",
  });

  const auditQuery = useQuery({
    queryKey: ["barokahiin", "admin", "audit-logs", auditSearch, auditPage],
    queryFn: () =>
      getAdminAuditLogs({ q: auditSearch, page: auditPage, per_page: 20 }),
    enabled: subTab === "audit",
  });

  useEffect(() => {
    if (configQuery.data) {
      const c = configQuery.data as Record<string, unknown>;
      setConfigText(JSON.stringify(c, null, 2));
      if (c.hold_minutes !== undefined) setCfgHoldMinutes(String(c.hold_minutes));
      if (c.fulfillment_sla_hours !== undefined) setCfgSlaHours(String(c.fulfillment_sla_hours));
      if (c.auto_cancel_sla_hours !== undefined) setCfgAutoCancelHours(String(c.auto_cancel_sla_hours));
      if (c.complaint_window_hours !== undefined) setCfgComplaintHours(String(c.complaint_window_hours));
      if (c.min_item_price_idr !== undefined) setCfgMinPrice(String(c.min_item_price_idr));
      if (c.packaging_fee_idr !== undefined) setCfgPackagingFee(String(c.packaging_fee_idr));
      if (c.charity_item_max_pct !== undefined) setCfgCharityCapPct(String(c.charity_item_max_pct));
      if (c.min_payout_idr !== undefined) setCfgMinPayout(String(c.min_payout_idr));
    }
  }, [configQuery.data]);

  const totalPct = koorPct + kegPct + opsPct + jamPct + donPct;

  const createSchemeMut = useMutation({
    mutationFn: () =>
      createAdminSplitScheme({
        nama: schemeName.trim(),
        koordinator_pct: koorPct,
        kegiatan_pct: kegPct,
        operasional_pct: opsPct,
        jaminan_pct: jamPct,
        donatur_pct: donPct,
      }),
    onSuccess: (created) => {
      if (created) {
        setCreatedSchemes((prev) => [created, ...prev]);
        if (created.uuid) setAnnounceUuidInput(created.uuid);
      }
      toast.success("Skema bagi hasil baru tersimpan sebagai draf");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "split-schemes"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const announceMut = useMutation({
    mutationFn: () => {
      const targetUuid = announceTarget?.uuid || announceUuidInput.trim();
      return announceAdminSplitScheme(targetUuid, effectiveDate);
    },
    onSuccess: () => {
      setAnnounceTarget(null);
      setAnnounceUuidInput("");
      toast.success("Skema bagi hasil berhasil diumumkan ke koordinator");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "split-schemes"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const saveConfigMut = useMutation({
    mutationFn: () => {
      if (advancedJsonMode) {
        return updateAdminConfig(JSON.parse(configText));
      }
      return updateAdminConfig({
        ...(configQuery.data ?? {}),
        hold_minutes: Number(cfgHoldMinutes) || 30,
        fulfillment_sla_hours: Number(cfgSlaHours) || 48,
        auto_cancel_sla_hours: Number(cfgAutoCancelHours) || 96,
        complaint_window_hours: Number(cfgComplaintHours) || 48,
        min_item_price_idr: Number(cfgMinPrice) || 15000,
        packaging_fee_idr: Number(cfgPackagingFee) || 2000,
        charity_item_max_pct: Number(cfgCharityCapPct) || 20,
        min_payout_idr: Number(cfgMinPayout) || 100000,
      });
    },
    onSuccess: () => {
      toast.success("Konfigurasi sistem berhasil diperbarui");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "config"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const saveSettingsMut = useMutation({
    mutationFn: () =>
      updateAdminSettings({
        show_split_breakdown: setShowSplit,
        label_anonim: setAnonLabel.trim() || "Sahabat Berbagi",
        whatsapp_resmi: setWhatsapp.trim(),
        peringatan_penipuan: setFraudWarning.trim(),
      }),
    onSuccess: () => {
      toast.success("Pengaturan umum berhasil diperbarui");
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const savePageMut = useMutation({
    mutationFn: () =>
      saveAdminPage({
        kunci: pageKey.trim(),
        judul: pageTitle.trim(),
        isi: pageBody,
        diterbitkan: pagePublished,
      }),
    onSuccess: () => {
      toast.success("Halaman statis berhasil disimpan");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "admin", "pages"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const { items: auditLogs, pagination: auditPagination } = unwrapList(
    auditQuery.data,
  );
  const { items: serverSchemes } = unwrapList(splitSchemesQuery.data);
  const { items: staticPages } = unwrapList(pagesQuery.data);
  const allSchemes = serverSchemes.length > 0 ? serverSchemes : createdSchemes;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`brk-btn ${subTab === "split" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("split")}
        >
          <Percent className="size-4" aria-hidden="true" />
          <span>Skema bagi hasil</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "config" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("config")}
        >
          <Settings2 className="size-4" aria-hidden="true" />
          <span>Konfigurasi dan pengaturan</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "pages" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("pages")}
        >
          <FileText className="size-4" aria-hidden="true" />
          <span>Halaman statis</span>
        </button>
        <button
          type="button"
          className={`brk-btn ${subTab === "audit" ? "brk-btn-primary" : "brk-btn-secondary"}`}
          onClick={() => setSubTab("audit")}
        >
          <FileClock className="size-4" aria-hidden="true" />
          <span>Audit log</span>
        </button>
      </div>

      {subTab === "split" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <ConsolePanel
            className="lg:col-span-7"
            icon={Percent}
            title="Buat versi skema bagi hasil"
            description="Total 5 bagian wajib tepat 100%. Perubahan skema harus diumumkan minimal 30 hari sebelum tanggal mulai berlaku."
          >
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (totalPct !== 100) {
                  toast.error("Total persentase 5 bagian wajib tepat 100%.");
                  return;
                }
                createSchemeMut.mutate();
              }}
            >
              <FieldWrapper id="sch-name" label="Nama skema" required>
                <input
                  id="sch-name"
                  className="brk-input"
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  required
                />
              </FieldWrapper>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <FieldWrapper id="pct-koor" label="Koordinator (%)">
                  <input
                    id="pct-koor"
                    type="number"
                    min={0}
                    max={100}
                    className="brk-input brk-num"
                    value={koorPct}
                    onChange={(e) => setKoorPct(Number(e.target.value) || 0)}
                  />
                </FieldWrapper>
                <FieldWrapper id="pct-keg" label="Dana Kegiatan (%)">
                  <input
                    id="pct-keg"
                    type="number"
                    min={0}
                    max={100}
                    className="brk-input brk-num"
                    value={kegPct}
                    onChange={(e) => setKegPct(Number(e.target.value) || 0)}
                  />
                </FieldWrapper>
                <FieldWrapper id="pct-ops" label="Operasional (%)">
                  <input
                    id="pct-ops"
                    type="number"
                    min={0}
                    max={100}
                    className="brk-input brk-num"
                    value={opsPct}
                    onChange={(e) => setOpsPct(Number(e.target.value) || 0)}
                  />
                </FieldWrapper>
                <FieldWrapper id="pct-jam" label="Dana Jaminan (%)">
                  <input
                    id="pct-jam"
                    type="number"
                    min={0}
                    max={100}
                    className="brk-input brk-num"
                    value={jamPct}
                    onChange={(e) => setJamPct(Number(e.target.value) || 0)}
                  />
                </FieldWrapper>
                <FieldWrapper id="pct-don" label="Donatur (%)">
                  <input
                    id="pct-don"
                    type="number"
                    min={0}
                    max={100}
                    className="brk-input brk-num"
                    value={donPct}
                    onChange={(e) => setDonPct(Number(e.target.value) || 0)}
                  />
                </FieldWrapper>
              </div>

              <div
                className="flex items-center justify-between rounded-xl border p-3.5 text-sm font-bold"
                style={{
                  backgroundColor:
                    totalPct === 100
                      ? "var(--daun-muda)"
                      : "var(--bahaya-muda)",
                  borderColor:
                    totalPct === 100 ? "var(--daun)" : "var(--bahaya)",
                  color:
                    totalPct === 100 ? "var(--daun-tua)" : "var(--bahaya)",
                }}
              >
                <span>Total persentase (wajib 100%)</span>
                <span className="brk-num text-lg">{totalPct}%</span>
              </div>

              <button
                type="submit"
                className="brk-btn brk-btn-primary"
                disabled={totalPct !== 100 || createSchemeMut.isPending}
              >
                {createSchemeMut.isPending
                  ? "Menyimpan..."
                  : "Simpan draf skema"}
              </button>
            </form>

            {/* Direct announce by UUID or created schemes */}
            <div
              className="mt-6 space-y-3 border-t pt-5"
              style={{ borderColor: "var(--garis)" }}
            >
              <h3 className="text-base font-bold">
                Umumkan skema bagi hasil (minimal 30 hari sebelum berlaku)
              </h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  aria-label="UUID skema bagi hasil"
                  className="brk-input flex-1"
                  placeholder="Masukkan UUID skema draf..."
                  value={announceUuidInput}
                  onChange={(e) => setAnnounceUuidInput(e.target.value)}
                />
                <button
                  type="button"
                  className="brk-btn brk-btn-secondary shrink-0"
                  disabled={!announceUuidInput.trim()}
                  onClick={() =>
                    setAnnounceTarget({
                      uuid: announceUuidInput.trim(),
                      koordinator_pct: koorPct,
                      kegiatan_pct: kegPct,
                      operasional_pct: opsPct,
                      jaminan_pct: jamPct,
                      donatur_pct: donPct,
                    })
                  }
                >
                  <Megaphone className="size-4" aria-hidden="true" />
                  <span>Umumkan</span>
                </button>
              </div>

              {splitSchemesQuery.isLoading ? (
                <LoadingSkeleton rows={2} />
              ) : (
                allSchemes.map((sch, idx) => (
                  <div
                    key={sch.uuid || idx}
                    className="flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">
                          {sch.nama || `Versi ${sch.versi ?? idx + 1}`}
                        </span>
                        <StatusBadge value={sch.status} />
                      </div>
                      <p
                        className="brk-num mt-1 text-xs"
                        style={{ color: "var(--muted-brk)" }}
                      >
                        Koor {sch.koordinator_pct}% · Keg {sch.kegiatan_pct}% · Ops{" "}
                        {sch.operasional_pct}% · Jam {sch.jaminan_pct}% · Don{" "}
                        {sch.donatur_pct}%
                        {sch.mulai_berlaku
                          ? ` · Berlaku ${formatDateId(sch.mulai_berlaku)}`
                          : ""}
                      </p>
                    </div>
                    {sch.uuid && sch.status === "draft" && (
                      <button
                        type="button"
                        className="brk-btn brk-btn-secondary shrink-0"
                        onClick={() => setAnnounceTarget(sch)}
                      >
                        <Megaphone className="size-4" aria-hidden="true" />
                        <span>Umumkan</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ConsolePanel>

          <div className="lg:col-span-5">
            <KuitansiPreview
              koordinatorPct={koorPct}
              kegiatanPct={kegPct}
              operasionalPct={opsPct}
              jaminanPct={jamPct}
              donaturPct={donPct}
            />
          </div>
        </div>
      )}

      {subTab === "config" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ConsolePanel
            icon={Settings2}
            title="Konfigurasi sistem dan Mesin Toko"
            description="Parameter hold, SLA, harga minimum, biaya kemas, dan batas penarikan. Semua perubahan tercatat di Audit Log."
            action={
              <button
                type="button"
                className="brk-btn brk-btn-ghost min-h-9 px-2.5 text-xs"
                onClick={() => setAdvancedJsonMode((prev) => !prev)}
              >
                {advancedJsonMode ? "Mode formulir" : "Mode JSON lanjutan"}
              </button>
            }
          >
            {configQuery.isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : advancedJsonMode ? (
              <div className="space-y-3">
                <textarea
                  aria-label="JSON Konfigurasi sistem"
                  className="brk-textarea min-h-64 font-normal"
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                />
                <button
                  type="button"
                  className="brk-btn brk-btn-primary"
                  disabled={saveConfigMut.isPending}
                  onClick={() => saveConfigMut.mutate()}
                >
                  {saveConfigMut.isPending
                    ? "Menyimpan..."
                    : "Simpan konfigurasi JSON"}
                </button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveConfigMut.mutate();
                }}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FieldWrapper id="cfg-hold" label="Durasi hold bayar (menit)">
                    <input
                      id="cfg-hold"
                      type="number"
                      className="brk-input brk-num"
                      value={cfgHoldMinutes}
                      onChange={(e) => setCfgHoldMinutes(e.target.value)}
                    />
                  </FieldWrapper>
                  <FieldWrapper id="cfg-sla" label="SLA siap pesanan (jam)">
                    <input
                      id="cfg-sla"
                      type="number"
                      className="brk-input brk-num"
                      value={cfgSlaHours}
                      onChange={(e) => setCfgSlaHours(e.target.value)}
                    />
                  </FieldWrapper>
                  <FieldWrapper id="cfg-cancel" label="Batal otomatis SLA (jam)">
                    <input
                      id="cfg-cancel"
                      type="number"
                      className="brk-input brk-num"
                      value={cfgAutoCancelHours}
                      onChange={(e) => setCfgAutoCancelHours(e.target.value)}
                    />
                  </FieldWrapper>
                  <FieldWrapper id="cfg-cmp" label="Jendela komplain (jam)">
                    <input
                      id="cfg-cmp"
                      type="number"
                      className="brk-input brk-num"
                      value={cfgComplaintHours}
                      onChange={(e) => setCfgComplaintHours(e.target.value)}
                    />
                  </FieldWrapper>
                  <FieldWrapper id="cfg-minp" label="Harga minimum barang (Rp)">
                    <input
                      id="cfg-minp"
                      type="number"
                      step={500}
                      className="brk-input brk-num"
                      value={cfgMinPrice}
                      onChange={(e) => setCfgMinPrice(e.target.value)}
                    />
                  </FieldWrapper>
                  <FieldWrapper id="cfg-pack" label="Biaya kemas per paket (Rp)">
                    <input
                      id="cfg-pack"
                      type="number"
                      step={500}
                      className="brk-input brk-num"
                      value={cfgPackagingFee}
                      onChange={(e) => setCfgPackagingFee(e.target.value)}
                    />
                  </FieldWrapper>
                  <FieldWrapper id="cfg-ccap" label="Maks. Barang Charity (%)">
                    <input
                      id="cfg-ccap"
                      type="number"
                      max={100}
                      className="brk-input brk-num"
                      value={cfgCharityCapPct}
                      onChange={(e) => setCfgCharityCapPct(e.target.value)}
                    />
                  </FieldWrapper>
                  <FieldWrapper id="cfg-mpay" label="Minimal penarikan (Rp)">
                    <input
                      id="cfg-mpay"
                      type="number"
                      step={10000}
                      className="brk-input brk-num"
                      value={cfgMinPayout}
                      onChange={(e) => setCfgMinPayout(e.target.value)}
                    />
                  </FieldWrapper>
                </div>
                <button
                  type="submit"
                  className="brk-btn brk-btn-primary"
                  disabled={saveConfigMut.isPending}
                >
                  {saveConfigMut.isPending
                    ? "Menyimpan..."
                    : "Simpan konfigurasi sistem"}
                </button>
              </form>
            )}
          </ConsolePanel>

          <ConsolePanel
            icon={Settings2}
            title="Pengaturan umum dan kanal resmi"
            description="Satu sumber kebenaran untuk transparansi Kuitansi Kebaikan, label anonim donatur, dan peringatan penipuan."
          >
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveSettingsMut.mutate();
              }}
            >
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--garis)" }}>
                <input
                  type="checkbox"
                  checked={setShowSplit}
                  onChange={(e) => setSetShowSplit(e.target.checked)}
                  className="size-4"
                />
                <span>
                  Tampilkan rincian bagi hasil pada Kuitansi Kebaikan publik
                </span>
              </label>

              <FieldWrapper
                id="set-anon"
                label="Label anonim donatur di storefront"
              >
                <input
                  id="set-anon"
                  className="brk-input"
                  value={setAnonLabel}
                  onChange={(e) => setSetAnonLabel(e.target.value)}
                />
              </FieldWrapper>

              <FieldWrapper id="set-wa" label="Nomor WhatsApp bantuan resmi">
                <input
                  id="set-wa"
                  className="brk-input brk-num"
                  inputMode="tel"
                  value={setWhatsapp}
                  onChange={(e) => setSetWhatsapp(e.target.value)}
                  placeholder="+62812..."
                />
              </FieldWrapper>

              <FieldWrapper
                id="set-fraud"
                label="Teks peringatan penipuan dan kanal resmi"
              >
                <textarea
                  id="set-fraud"
                  className="brk-textarea"
                  value={setFraudWarning}
                  onChange={(e) => setSetFraudWarning(e.target.value)}
                />
              </FieldWrapper>

              <button
                type="submit"
                className="brk-btn brk-btn-primary"
                disabled={saveSettingsMut.isPending}
              >
                {saveSettingsMut.isPending
                  ? "Menyimpan..."
                  : "Simpan pengaturan umum"}
              </button>
            </form>
          </ConsolePanel>
        </div>
      )}

      {subTab === "pages" && (
        <ConsolePanel
          icon={FileText}
          title="Halaman statis dan kanal resmi"
          description="Kelola halaman Cara Kerja, FAQ, Kebijakan Privasi, dan Kanal Pembayaran Resmi."
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <form
              className="space-y-4 lg:col-span-7"
              onSubmit={(e) => {
                e.preventDefault();
                savePageMut.mutate();
              }}
            >
              <FieldWrapper id="pg-key" label="Kunci halaman" required>
                <ConsoleSelect
                  id="pg-key"
                  value={pageKey}
                  onChange={setPageKey}
                  options={[
                    { value: "cara_kerja", label: "cara_kerja" },
                    { value: "faq", label: "faq" },
                    { value: "kebijakan_privasi", label: "kebijakan_privasi" },
                    { value: "syarat_layanan", label: "syarat_layanan" },
                    { value: "kanal_resmi", label: "kanal_resmi" },
                  ]}
                />
              </FieldWrapper>

              <FieldWrapper id="pg-title" label="Judul halaman" required>
                <input
                  id="pg-title"
                  className="brk-input"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  required
                />
              </FieldWrapper>

              <FieldWrapper id="pg-body" label="Isi halaman" required>
                <textarea
                  id="pg-body"
                  className="brk-textarea min-h-48"
                  value={pageBody}
                  onChange={(e) => setPageBody(e.target.value)}
                  required
                />
              </FieldWrapper>

              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={pagePublished}
                  onChange={(e) => setPagePublished(e.target.checked)}
                  className="size-4"
                />
                <span>Terbitkan ke storefront publik</span>
              </label>

              <button
                type="submit"
                className="brk-btn brk-btn-primary"
                disabled={savePageMut.isPending}
              >
                {savePageMut.isPending ? "Menyimpan..." : "Simpan halaman"}
              </button>
            </form>

            <div className="space-y-2.5 lg:col-span-5">
              <h3 className="text-sm font-bold">Daftar halaman statis tersimpan</h3>
              {pagesQuery.isLoading ? (
                <LoadingSkeleton rows={2} />
              ) : staticPages.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--muted-brk)" }}>
                  Belum ada halaman statis tersimpan. Pilih kunci halaman di formulir kiri lalu simpan.
                </p>
              ) : (
                <div className="space-y-2">
                  {staticPages.map((pg) => (
                    <button
                      key={pg.kunci}
                      type="button"
                      onClick={() => {
                        setPageKey(pg.kunci);
                        setPageTitle(pg.judul || "");
                        setPageBody(pg.isi || "");
                        setPagePublished(pg.diterbitkan !== false);
                      }}
                      className="w-full rounded-xl border p-3 text-left text-sm transition-colors hover:border-[var(--indigo)]"
                      style={{
                        borderColor:
                          pageKey === pg.kunci ? "var(--indigo)" : "var(--garis)",
                        backgroundColor:
                          pageKey === pg.kunci
                            ? "var(--indigo-muda)"
                            : "var(--kertas)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{pg.judul || pg.kunci}</span>
                        <StatusBadge
                          value={pg.diterbitkan === false ? "draft" : "terbit"}
                        />
                      </div>
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--muted-brk)" }}
                      >
                        Kunci: <code>{pg.kunci}</code>
                        {pg.updated_at ? ` · Diperbarui ${formatDateId(pg.updated_at)}` : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ConsolePanel>
      )}

      {subTab === "audit" && (
        <ConsolePanel
          icon={FileClock}
          title="Audit log tindakan sensitif"
          description="Rekam jejak aktor, waktu, target, serta perubahan sebelum dan sesudah."
        >
          <div className="mb-4">
            <input
              type="search"
              aria-label="Cari audit log"
              className="brk-input sm:max-w-sm"
              placeholder="Cari aksi atau target..."
              value={auditSearch}
              onChange={(e) => {
                setAuditSearch(e.target.value);
                setAuditPage(1);
              }}
            />
          </div>

          {auditQuery.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : auditQuery.error ? (
            <ErrorBanner
              message={parseBarokahiinError(auditQuery.error).message}
              onRetry={() => void auditQuery.refetch()}
            />
          ) : auditLogs.length === 0 ? (
            <EmptyState
              title="Belum ada catatan audit"
              description="Tindakan sensitif Admin dan Koordinator akan muncul di sini."
            />
          ) : (
            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-xl border p-3.5 text-sm"
                  style={{ borderColor: "var(--garis)" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">{log.aksi}</span>
                    <span
                      className="brk-num text-xs"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      {formatDateId(log.waktu)}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--muted-brk)" }}
                  >
                    Aktor:{" "}
                    <strong>
                      {log.actor?.nama_lengkap ||
                        log.actor?.username ||
                        `ID #${log.aktor_id ?? "-"}`}
                    </strong>
                    {log.target_type
                      ? `, Target: ${log.target_type} (${log.target_id ?? "-"})`
                      : ""}
                  </p>
                  {log.alasan && <p className="mt-1 text-xs">Alasan: {log.alasan}</p>}
                </article>
              ))}
            </div>
          )}

          <Pager pagination={auditPagination} onChange={setAuditPage} />
        </ConsolePanel>
      )}

      {/* Announce split scheme modal */}
      <ConfirmDialog
        open={Boolean(announceTarget)}
        title="Umumkan perubahan skema bagi hasil"
        description="Perubahan skema wajib diumumkan minimal 30 hari sebelum tanggal mulai berlaku."
        consequences="Koordinator yang tidak setuju berhak mengundurkan diri tanpa penalti dalam 14 hari sejak pengumuman sesuai Pasal 17."
        confirmLabel="Umumkan sekarang"
        tone="primary"
        loading={announceMut.isPending}
        onCancel={() => setAnnounceTarget(null)}
        onConfirm={() => {
          const days = daysBetweenNowAnd(effectiveDate);
          if (days < 30) {
            toast.error(
              `Tanggal mulai berlaku harus minimal 30 hari dari hari ini (saat ini ${days} hari).`,
            );
            return;
          }
          announceMut.mutate();
        }}
      >
        <FieldWrapper
          id="ann-date"
          label="Tanggal mulai berlaku (minimal 30 hari ke depan)"
          required
        >
          <input
            id="ann-date"
            type="date"
            className="brk-input"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
          />
        </FieldWrapper>
      </ConfirmDialog>
    </div>
  );
}
