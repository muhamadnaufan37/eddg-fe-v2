import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  parseBarokahiinError,
  requestProgramDisbursement,
  submitProgramReport,
  type BarokahiinMedia,
  type CharityProgram,
  type WilayahValue,
} from "@/services/barokahiin";
import {
  ConsolePanel,
  ErrorBanner,
  FieldWrapper,
  StatusBadge,
  WilayahCascader,
} from "../components/ui/ConsoleUi";
import { MediaUploadQueue } from "../components/ui/MediaUploadQueue";
import { formatRupiah } from "../components/ui/utils";

export default function CoordinatorCharity() {
  // Session-created programs
  const [createdPrograms, setCreatedPrograms] = useState<CharityProgram[]>([]);

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
      if (created) {
        setCreatedPrograms((prev) => [created, ...prev]);
        if (created.uuid) {
          setDisbProgramUuid(created.uuid);
          setReportProgramUuid(created.uuid);
        }
      }
      setJudul("");
      setTujuan("");
      setPenerima("");
      setAnggaran("");
      toast.success("Program Charity diajukan untuk persetujuan Admin");
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
              <FieldWrapper id="disb-prog-uuid" label="UUID program" required>
                <input
                  id="disb-prog-uuid"
                  className="brk-input"
                  value={disbProgramUuid}
                  onChange={(e) => setDisbProgramUuid(e.target.value)}
                  placeholder="Masukkan UUID program yang disetujui"
                  required
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
              <FieldWrapper id="rep-prog-uuid" label="UUID program" required>
                <input
                  id="rep-prog-uuid"
                  className="brk-input"
                  value={reportProgramUuid}
                  onChange={(e) => setReportProgramUuid(e.target.value)}
                  placeholder="Masukkan UUID program"
                  required
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

      {createdPrograms.length > 0 && (
        <ConsolePanel
          icon={HeartHandshake}
          title="Program yang baru diajukan pada sesi ini"
          description="Klik UUID program untuk menggunakannya pada formulir pencairan atau laporan."
        >
          <div className="space-y-2.5">
            {createdPrograms.map((prog) => (
              <div
                key={prog.uuid}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3.5 text-sm"
                style={{ borderColor: "var(--garis)" }}
              >
                <div>
                  <p className="font-bold">{prog.judul}</p>
                  <p
                    className="brk-num text-xs"
                    style={{ color: "var(--muted-brk)" }}
                  >
                    UUID: {prog.uuid}, Target {formatRupiah(prog.target_idr)}
                  </p>
                </div>
                <StatusBadge value={prog.status} />
              </div>
            ))}
          </div>
        </ConsolePanel>
      )}
    </div>
  );
}
