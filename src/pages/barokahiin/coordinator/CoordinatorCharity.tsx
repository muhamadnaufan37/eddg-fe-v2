import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  FileCheck2,
  HeartHandshake,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  EMPTY_WILAYAH,
  createConsoleProgram,
  getConsolePrograms,
  parseBarokahiinError,
  requestProgramDisbursement,
  submitProgramReport,
  type BarokahiinMedia,
  type WilayahValue,
} from "@/services/barokahiin";
import {
  ConsolePanel,
  ConsoleSelect,
  EmptyState,
  ErrorBanner,
  FieldWrapper,
  LoadingSkeleton,
  Pager,
  StatusBadge,
  WilayahCascader,
} from "../components/ui/ConsoleUi";
import { MediaUploadQueue } from "../components/ui/MediaUploadQueue";
import { formatDateId, formatRupiah, unwrapList } from "../components/ui/utils";

export default function CoordinatorCharity() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const programsQuery = useQuery({
    queryKey: ["barokahiin", "console", "programs", page],
    queryFn: () => getConsolePrograms({ page, per_page: 20 }),
  });

  const { items: programs, pagination } = unwrapList(programsQuery.data);

  // New program form (POST /console/programs)
  const [judul, setJudul] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [penerima, setPenerima] = useState("");
  const [wilayah, setWilayah] = useState<WilayahValue>(EMPTY_WILAYAH);
  const [periodeMulai, setPeriodeMulai] = useState("");
  const [periodeSelesai, setPeriodeSelesai] = useState("");
  const [targetIdr, setTargetIdr] = useState("2000000");
  const [anggaran, setAnggaran] = useState("");

  // Disbursement form (POST /console/programs/{uuid}/disbursements)
  const [disbProgramUuid, setDisbProgramUuid] = useState("");
  const [disbAmount, setDisbAmount] = useState("");
  const [disbKeperluan, setDisbKeperluan] = useState("");
  const [disbError, setDisbError] = useState<string | null>(null);

  // Report form (POST /console/programs/{uuid}/reports)
  const [reportProgramUuid, setReportProgramUuid] = useState("");
  const [reportRingkasan, setReportRingkasan] = useState("");
  const [reportTotal, setReportTotal] = useState("");
  const [reportBuktiRef, setReportBuktiRef] = useState("");
  const [reportMedia, setReportMedia] = useState<BarokahiinMedia[]>([]);

  const createMut = useMutation({
    mutationFn: () =>
      createConsoleProgram({
        judul: judul.trim(),
        tujuan: tujuan.trim(),
        penerima_manfaat: penerima.trim(),
        penerima_manfaat_desc: penerima.trim(),
        province_code: wilayah.province_code || undefined,
        regency_code: wilayah.regency_code,
        district_code: wilayah.district_code || undefined,
        village_code: wilayah.village_code || undefined,
        periode_mulai: periodeMulai,
        periode_selesai: periodeSelesai,
        target_idr: Number(targetIdr) || 0,
        rencana_anggaran: anggaran.trim(),
      }),
    onSuccess: (created) => {
      if (created?.uuid) {
        setDisbProgramUuid(created.uuid);
        setReportProgramUuid(created.uuid);
      }
      setJudul("");
      setTujuan("");
      setPenerima("");
      setAnggaran("");
      toast.success("Program Charity diajukan untuk persetujuan Admin");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "programs"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  const disbMut = useMutation({
    mutationFn: () =>
      requestProgramDisbursement(disbProgramUuid.trim(), {
        jumlah_idr: Number(disbAmount) || 0,
        keperluan: disbKeperluan.trim(),
      }),
    onSuccess: () => {
      setDisbError(null);
      setDisbAmount("");
      setDisbKeperluan("");
      toast.success("Pengajuan pencairan Dompet Program terkirim ke Admin");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "programs"],
      });
    },
    onError: (err) => {
      const parsed = parseBarokahiinError(err);
      setDisbError(parsed.message);
      toast.error(parsed.message);
    },
  });

  const reportMut = useMutation({
    mutationFn: () =>
      submitProgramReport(reportProgramUuid.trim(), {
        ringkasan: reportRingkasan.trim(),
        total_terpakai_idr: Number(reportTotal) || 0,
        bukti_ref: reportBuktiRef.trim() || undefined,
        bukti_media_ids: reportMedia.map((m) => m.id ?? m.uuid).filter(Boolean),
      }),
    onSuccess: () => {
      setReportRingkasan("");
      setReportTotal("");
      setReportBuktiRef("");
      setReportMedia([]);
      toast.success("Laporan penggunaan dana dikirim untuk persetujuan Admin");
      void queryClient.invalidateQueries({
        queryKey: ["barokahiin", "console", "programs"],
      });
    },
    onError: (err) => toast.error(parseBarokahiinError(err).message),
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Propose new program */}
        <ConsolePanel
          className="lg:col-span-6"
          icon={Plus}
          title="Ajukan program Charity baru"
          description="Program belum dapat menerima dana sebelum disetujui Admin. Dompet Program terpisah dari dompet pribadi."
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!wilayah.regency_code) {
                toast.error("Pilih wilayah program minimal sampai Kabupaten / Kota.");
                return;
              }
              createMut.mutate();
            }}
          >
            <FieldWrapper id="prg-judul" label="Judul program" required>
              <input
                id="prg-judul"
                className="brk-input"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Bantuan perlengkapan sekolah dhuafa Bandung Barat"
                required
              />
            </FieldWrapper>

            <FieldWrapper id="prg-tujuan" label="Tujuan program" required>
              <textarea
                id="prg-tujuan"
                className="brk-textarea"
                value={tujuan}
                onChange={(e) => setTujuan(e.target.value)}
                required
              />
            </FieldWrapper>

            <FieldWrapper
              id="prg-penerima"
              label="Deskripsi penerima manfaat"
              required
              helper="Tulis deskripsi umum tanpa mencantumkan data pribadi atau identitas anak."
            >
              <input
                id="prg-penerima"
                className="brk-input"
                value={penerima}
                onChange={(e) => setPenerima(e.target.value)}
                placeholder="Contoh: 25 siswa SD/SMP keluarga prasejahtera di Kec. Lembang"
                required
              />
            </FieldWrapper>

            <FieldWrapper
              label="Wilayah program (minimal Kabupaten / Kota)"
              required
            >
              <WilayahCascader
                value={wilayah}
                onChange={setWilayah}
                maxLevel="district"
              />
            </FieldWrapper>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldWrapper id="prg-mulai" label="Tanggal mulai" required>
                <input
                  id="prg-mulai"
                  type="date"
                  className="brk-input"
                  value={periodeMulai}
                  onChange={(e) => setPeriodeMulai(e.target.value)}
                  required
                />
              </FieldWrapper>
              <FieldWrapper id="prg-selesai" label="Tanggal selesai" required>
                <input
                  id="prg-selesai"
                  type="date"
                  className="brk-input"
                  value={periodeSelesai}
                  onChange={(e) => setPeriodeSelesai(e.target.value)}
                  required
                />
              </FieldWrapper>
            </div>

            <FieldWrapper
              id="prg-target"
              label="Target dana (Rp)"
              required
              helper="Batas nilai program mengikuti level koordinator."
            >
              <input
                id="prg-target"
                type="number"
                step={50000}
                className="brk-input brk-num"
                value={targetIdr}
                onChange={(e) => setTargetIdr(e.target.value)}
                required
              />
            </FieldWrapper>

            <FieldWrapper
              id="prg-anggaran"
              label="Rencana anggaran ringkas"
              required
            >
              <textarea
                id="prg-anggaran"
                className="brk-textarea"
                value={anggaran}
                onChange={(e) => setAnggaran(e.target.value)}
                placeholder="Rincikan pos pengeluaran utama program."
                required
              />
            </FieldWrapper>

            <button
              type="submit"
              className="brk-btn brk-btn-daun w-full"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "Mengajukan..." : "Ajukan program"}
            </button>
          </form>
        </ConsolePanel>

        {/* Disbursement & Report Actions */}
        <div className="space-y-5 lg:col-span-6">
          <ConsolePanel
            icon={ArrowDownToLine}
            title="Ajukan pencairan Dompet Program"
            description="Pencairan memerlukan persetujuan Admin dan akan ditahan (409 OVERDUE_REPORT) bila laporan program sebelumnya belum disetujui."
          >
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!disbProgramUuid.trim() || !disbAmount) {
                  toast.error("UUID program dan nominal wajib diisi.");
                  return;
                }
                disbMut.mutate();
              }}
            >
              {disbError && <ErrorBanner message={disbError} />}
              <FieldWrapper id="disb-prog-uuid" label="Program Charity" required>
                <ConsoleSelect
                  id="disb-prog-uuid"
                  value={disbProgramUuid}
                  onChange={setDisbProgramUuid}
                  placeholder="Pilih program yang disetujui"
                  options={programs.map((p) => ({
                    value: p.uuid,
                    label: `${p.judul} — Saldo ${formatRupiah(p.wallet_balance_idr ?? p.terkumpul_idr)} (${p.status})`,
                  }))}
                />
              </FieldWrapper>
              <FieldWrapper
                id="disb-amount"
                label="Nominal pencairan (Rp)"
                required
              >
                <input
                  id="disb-amount"
                  type="number"
                  className="brk-input brk-num"
                  value={disbAmount}
                  onChange={(e) => setDisbAmount(e.target.value)}
                  required
                />
              </FieldWrapper>
              <FieldWrapper
                id="disb-keperluan"
                label="Keperluan penggunaan dana"
                required
              >
                <textarea
                  id="disb-keperluan"
                  className="brk-textarea"
                  value={disbKeperluan}
                  onChange={(e) => setDisbKeperluan(e.target.value)}
                  required
                />
              </FieldWrapper>
              <button
                type="submit"
                className="brk-btn brk-btn-primary w-full"
                disabled={disbMut.isPending}
              >
                {disbMut.isPending ? "Mengajukan..." : "Ajukan pencairan"}
              </button>
            </form>
          </ConsolePanel>

          <ConsolePanel
            icon={FileCheck2}
            title="Kirim laporan penggunaan dana"
            description="Wajib dikirim maksimal 14 hari setelah program selesai. Sisa dana dikembalikan ke pool Dana Kegiatan."
          >
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reportProgramUuid.trim() || !reportRingkasan.trim()) {
                  toast.error("UUID program dan ringkasan wajib diisi.");
                  return;
                }
                reportMut.mutate();
              }}
            >
              <FieldWrapper id="rep-prog-uuid" label="Program Charity" required>
                <ConsoleSelect
                  id="rep-prog-uuid"
                  value={reportProgramUuid}
                  onChange={setReportProgramUuid}
                  placeholder="Pilih program untuk dilaporkan"
                  options={programs.map((p) => ({
                    value: p.uuid,
                    label: `${p.judul} (${p.status})`,
                  }))}
                />
              </FieldWrapper>
              <FieldWrapper
                id="rep-total"
                label="Total dana terpakai (Rp)"
                required
              >
                <input
                  id="rep-total"
                  type="number"
                  className="brk-input brk-num"
                  value={reportTotal}
                  onChange={(e) => setReportTotal(e.target.value)}
                  required
                />
              </FieldWrapper>
              <FieldWrapper
                id="rep-ringkasan"
                label="Ringkasan pelaksanaan"
                required
              >
                <textarea
                  id="rep-ringkasan"
                  className="brk-textarea"
                  value={reportRingkasan}
                  onChange={(e) => setReportRingkasan(e.target.value)}
                  required
                />
              </FieldWrapper>
              <FieldWrapper id="rep-bukti" label="Referensi nota atau dokumen">
                <input
                  id="rep-bukti"
                  className="brk-input"
                  value={reportBuktiRef}
                  onChange={(e) => setReportBuktiRef(e.target.value)}
                />
              </FieldWrapper>
              <div>
                <p className="mb-1.5 text-sm font-semibold">
                  Unggah foto nota dan dokumentasi penyaluran
                </p>
                <MediaUploadQueue
                  ownerType="program"
                  ownerUuid={reportProgramUuid.trim()}
                  guideLabel="Pastikan ada persetujuan dokumentasi dan wajah anak tidak terlihat tanpa izin wali."
                  buttonLabel="Unggah bukti nota atau foto"
                  onUploaded={(media) =>
                    setReportMedia((prev) => [...prev, media])
                  }
                />
              </div>
              <button
                type="submit"
                className="brk-btn brk-btn-daun w-full"
                disabled={reportMut.isPending}
              >
                {reportMut.isPending ? "Mengirim..." : "Kirim laporan dana"}
              </button>
            </form>
          </ConsolePanel>
        </div>
      </div>

      <ConsolePanel
        icon={HeartHandshake}
        title="Daftar program Charity wilayah Anda"
        description="Pantau saldo Dompet Program, riwayat pencairan, dan laporan penggunaan dana setiap program."
      >
        {programsQuery.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : programsQuery.error ? (
          <ErrorBanner
            message={parseBarokahiinError(programsQuery.error).message}
            onRetry={() => void programsQuery.refetch()}
          />
        ) : programs.length === 0 ? (
          <EmptyState
            title="Belum ada program Charity"
            description="Ajukan program sosial wilayah pertama Anda menggunakan formulir di atas."
          />
        ) : (
          <div className="space-y-3">
            {programs.map((prog) => (
              <article
                key={prog.uuid}
                className="rounded-xl border p-4 text-sm"
                style={{ borderColor: "var(--garis)" }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{prog.judul}</h3>
                      <StatusBadge value={prog.status} />
                    </div>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--muted-brk)" }}
                    >
                      {prog.tujuan}
                    </p>
                    <p
                      className="brk-num mt-1.5 text-xs font-semibold"
                      style={{ color: "var(--indigo)" }}
                    >
                      Saldo Dompet Program:{" "}
                      {formatRupiah(prog.wallet_balance_idr ?? prog.terkumpul_idr)}{" "}
                      / Target {formatRupiah(prog.target_idr)}
                    </p>
                    {(prog.periode_mulai || prog.periode_selesai) && (
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--muted-brk)" }}
                      >
                        Periode: {formatDateId(prog.periode_mulai)} –{" "}
                        {formatDateId(prog.periode_selesai)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="brk-btn brk-btn-secondary"
                      onClick={() => setDisbProgramUuid(prog.uuid)}
                    >
                      <ArrowDownToLine className="size-4" aria-hidden="true" />
                      <span>Pencairan</span>
                    </button>
                    <button
                      type="button"
                      className="brk-btn brk-btn-daun"
                      onClick={() => setReportProgramUuid(prog.uuid)}
                    >
                      <FileCheck2 className="size-4" aria-hidden="true" />
                      <span>Laporan</span>
                    </button>
                  </div>
                </div>
                {((prog.disbursements && prog.disbursements.length > 0) ||
                  (prog.reports && prog.reports.length > 0)) && (
                  <div
                    className="mt-3 grid grid-cols-1 gap-3 border-t pt-3 text-xs sm:grid-cols-2"
                    style={{ borderColor: "var(--garis)" }}
                  >
                    {prog.disbursements && prog.disbursements.length > 0 && (
                      <div>
                        <p className="font-bold" style={{ color: "var(--muted-brk)" }}>
                          Pencairan ({prog.disbursements.length})
                        </p>
                        <ul className="mt-1 space-y-1">
                          {prog.disbursements.map((d) => (
                            <li key={d.uuid} className="flex justify-between gap-2">
                              <span className="truncate">{d.keperluan}</span>
                              <span className="brk-num shrink-0 font-semibold">
                                {formatRupiah(d.jumlah_idr)} ({d.status})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {prog.reports && prog.reports.length > 0 && (
                      <div>
                        <p className="font-bold" style={{ color: "var(--muted-brk)" }}>
                          Laporan ({prog.reports.length})
                        </p>
                        <ul className="mt-1 space-y-1">
                          {prog.reports.map((r, i) => (
                            <li key={r.uuid ?? i} className="flex justify-between gap-2">
                              <span className="truncate">{r.ringkasan}</span>
                              <span className="brk-num shrink-0 font-semibold">
                                {formatRupiah(r.total_terpakai_idr)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        <Pager pagination={pagination} onChange={setPage} />
      </ConsolePanel>
    </div>
  );
}
