import { BookOpen, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { ConsolePanel } from "../components/ui/ConsoleUi";
import {
  ADDRESS_CHECKS_SPEC,
  CODE_OF_ETHICS_10,
  GRADE_GUIDELINES,
} from "../components/ui/utils";

export default function CoordinatorGuide() {
  return (
    <div className="space-y-5">
      <ConsolePanel
        icon={BookOpen}
        title="Standar layanan (SLA) dan Level Koordinator"
        description="Ringkasan operasional dari Peraturan Koordinator Barang Wilayah (aturan-koordinator.md v0.1)."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <h3 className="text-base font-bold">Batas waktu layanan (SLA)</h3>
            <ul className="mt-2.5 space-y-2 text-sm">
              <li className="rounded-lg border p-3" style={{ borderColor: "var(--garis)" }}>
                <strong>Menyiapkan atau mengirim pesanan:</strong> maksimal 48 jam setelah dibayar. Lewat 96 jam dibatalkan otomatis dan refund.
              </li>
              <li className="rounded-lg border p-3" style={{ borderColor: "var(--garis)" }}>
                <strong>Jendela ambil di tempat:</strong> 7 hari sejak siap diambil.
              </li>
              <li className="rounded-lg border p-3" style={{ borderColor: "var(--garis)" }}>
                <strong>Balas pertanyaan atau tanggapi komplain:</strong> maksimal 24 jam.
              </li>
              <li className="rounded-lg border p-3" style={{ borderColor: "var(--garis)" }}>
                <strong>Perbaikan setelah revisi review:</strong> maksimal 3 hari kerja.
              </li>
              <li className="rounded-lg border p-3" style={{ borderColor: "var(--garis)" }}>
                <strong>Laporan program Charity:</strong> maksimal 14 hari setelah program selesai.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold">Level koordinator dan kenaikan</h3>
            <ul className="mt-2.5 space-y-2 text-sm">
              <li className="rounded-lg border p-3" style={{ borderColor: "var(--garis)" }}>
                <strong>Level 1, Baru:</strong> Lolos verifikasi dan ujian SOP. Semua barang wajib review Admin, kunjungan lapangan V8 wajib.
              </li>
              <li className="rounded-lg border p-3" style={{ borderColor: "var(--garis)" }}>
                <strong>Level 2, Terpercaya:</strong> Minimal 20 pesanan selesai, Skor Toko ≥ 80, komplain valid ≤ 5%. Batas barang dan program Charity lebih tinggi.
              </li>
              <li className="rounded-lg border p-3" style={{ borderColor: "var(--garis)" }}>
                <strong>Level 3, Utama:</strong> Minimal 100 pesanan selesai, Skor Toko ≥ 88, komplain valid ≤ 3%, tanpa sanksi berat 6 bulan. Dapat menjadi Koordinator Utama wilayah.
              </li>
            </ul>
          </div>
        </div>
      </ConsolePanel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ConsolePanel
          icon={ShieldCheck}
          title="Grade kondisi baku dan pedoman harga"
          description="Semua cacat wajib difoto dekat (close-up) dan ditulis jujur pada kolom kekurangan."
        >
          <ul className="space-y-2.5 text-sm">
            {(["A", "B", "C"] as const).map((g) => (
              <li
                key={g}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--garis)" }}
              >
                <p className="font-bold">
                  {GRADE_GUIDELINES[g].label} ({Math.round(GRADE_GUIDELINES[g].minPct * 100)}–{Math.round(GRADE_GUIDELINES[g].maxPct * 100)}% harga baru)
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--muted-brk)" }}>
                  {GRADE_GUIDELINES[g].desc}
                </p>
              </li>
            ))}
          </ul>
        </ConsolePanel>

        <ConsolePanel
          icon={ShieldAlert}
          title="Kode etik koordinator (10 butir)"
          description="Seluruh transaksi hanya melalui Barokahiin. Dilarang menerima pembayaran tunai atau di luar platform."
        >
          <ol className="space-y-2 text-sm">
            {CODE_OF_ETHICS_10.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: "var(--daun)" }}
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </ConsolePanel>
      </div>

      <ConsolePanel
        icon={ShieldCheck}
        title="Kriteria verifikasi alamat toko (V1 sampai V8)"
        description="Alamat tidak diverifikasi bila ada butir wajib yang gagal."
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ADDRESS_CHECKS_SPEC.map((spec) => (
            <div
              key={spec.kode}
              className="rounded-lg border p-3 text-sm"
              style={{ borderColor: "var(--garis)" }}
            >
              <p className="font-bold">
                {spec.kode} — {spec.judul}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--muted-brk)" }}>
                {spec.deskripsi}
              </p>
            </div>
          ))}
        </div>
      </ConsolePanel>
    </div>
  );
}
