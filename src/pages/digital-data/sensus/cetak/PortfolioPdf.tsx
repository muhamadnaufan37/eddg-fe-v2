import { forwardRef, type ReactNode, type Ref } from "react";
import { resolvePreviewUrl } from "@/utils/previewUtils";
import type { Participant } from "../types/Participant";
import "./portfolio-pdf.css";

export type PortfolioParticipant = Partial<Participant> & {
  kelas_label?: string;
};

interface Props {
  data: PortfolioParticipant;
}

const displayValue = (value: unknown) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const formatBirthDate = (value?: Date | string | null) => {
  if (!value) return "-";

  if (typeof value === "string") {
    const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (dateParts) return `${dateParts[3]}/${dateParts[2]}/${dateParts[1]}`;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getStatusSambung = (value?: number | string | null) => {
  const numericValue = Number(value);
  if (numericValue === 1) return "Sambung";
  if (numericValue === 2) return "Pindah Sambung";
  if (
    numericValue === 0 &&
    value !== "" &&
    value !== null &&
    value !== undefined
  ) {
    return "Tidak Sambung";
  }
  return displayValue(value);
};

const isAtletAsadActive = (value: unknown) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  (typeof value === "string" && value.trim().toLowerCase() === "true");

const PortfolioPdf = forwardRef(
  ({ data }: Props, ref: Ref<HTMLDivElement>) => {
    const photo =
      resolvePreviewUrl(data.img_url) ||
      (data.jenis_kelamin === "LAKI-LAKI"
        ? "/assets/empty-img-sensus-male.svg"
        : "/assets/empty-img-sensus-female.svg");

    return (
      <div ref={ref} className="portfolio-print-root">
        <article className="portfolio-sheet">
          <header className="portfolio-header">
            <div className="portfolio-brand">
              <span className="portfolio-brand-mark" aria-hidden="true">
                DG
              </span>
              <div>
                <p className="portfolio-eyebrow">Digital Data Generus</p>
                <h1 className="portfolio-document-label">
                  Profil Generus
                </h1>
              </div>
            </div>
            <div className="portfolio-code-wrap">
              <span className="portfolio-code-label">Nomor peserta</span>
              <span className="portfolio-code">
                {displayValue(data.kode_cari_data)}
              </span>
            </div>
          </header>

          <section className="portfolio-hero">
            <div className="portfolio-photo-frame">
              <img
                className="portfolio-photo"
                src={photo}
                alt={`Foto ${data.nama_lengkap || "peserta"}`}
              />
            </div>
            <div className="portfolio-identity">
              <p className="portfolio-eyebrow">Portofolio peserta</p>
              <h2>{displayValue(data.nama_lengkap)}</h2>
              <p className="portfolio-nickname">
                {data.nama_panggilan
                  ? `Nama panggilan ${data.nama_panggilan}`
                  : "Data peserta"}
              </p>
              <div className="portfolio-tags">
                <span>{displayValue(data.jenis_data)}</span>
                <span>{displayValue(data.jenis_kelamin)}</span>
                <span>
                  {data.umur === null || data.umur === undefined
                    ? "-"
                    : `${data.umur} tahun`}
                </span>
              </div>
            </div>
            <div className="portfolio-hero-accent" aria-hidden="true" />
          </section>

          <main className="portfolio-body">
            <section className="portfolio-section">
              <h2>
                <span>01</span> Identitas pribadi
              </h2>
              <div className="portfolio-grid">
                <PortfolioField label="Tempat, tanggal lahir">
                  {[data.tempat_lahir, formatBirthDate(data.tanggal_lahir)]
                    .filter((value) => value && value !== "-")
                    .join(", ") || "-"}
                </PortfolioField>
                <PortfolioField label="Nomor telepon">
                  {displayValue(data.no_telepon)}
                </PortfolioField>
                <PortfolioField label="Alamat" wide>
                  {displayValue(data.alamat)}
                </PortfolioField>
                <PortfolioField label="Pekerjaan">
                  {displayValue(data.nm_pekerjaan)}
                </PortfolioField>
                <PortfolioField label="Kelas">
                  {displayValue(data.kelas_label)}
                </PortfolioField>
              </div>
            </section>

            <section className="portfolio-section">
              <h2>
                <span>02</span> Keluarga & minat
              </h2>
              <div className="portfolio-grid">
                <PortfolioField label="Nama ayah">
                  {displayValue(data.nama_ayah)}
                </PortfolioField>
                <PortfolioField label="Nama ibu">
                  {displayValue(data.nama_ibu)}
                </PortfolioField>
                <PortfolioField label="Hobi">
                  {displayValue(data.hoby)}
                </PortfolioField>
                <PortfolioField label="Usia menikah">
                  {displayValue(data.usia_menikah)}
                </PortfolioField>
                <PortfolioField label="Kriteria pasangan" wide>
                  {displayValue(data.kriteria_pasangan)}
                </PortfolioField>
              </div>
            </section>

            <section className="portfolio-section portfolio-section-wide">
              <h2>
                <span>03</span> Wilayah & status
              </h2>
              <div className="portfolio-grid portfolio-grid-location">
                <PortfolioField label="Daerah">
                  {displayValue(data.nm_daerah)}
                </PortfolioField>
                <PortfolioField label="Desa">
                  {displayValue(data.nm_desa)}
                </PortfolioField>
                <PortfolioField label="Kelompok">
                  {displayValue(data.nm_kelompok)}
                </PortfolioField>
                <PortfolioField label="Status sambung">
                  {getStatusSambung(data.status_sambung)}
                </PortfolioField>
                <PortfolioField label="Status pernikahan">
                  {data.status_pernikahan === true
                    ? "Sudah Menikah"
                    : data.status_pernikahan === false
                      ? "Belum Menikah"
                      : "-"}
                </PortfolioField>
                <PortfolioField label="Atlet ASAD">
                  {isAtletAsadActive(data.status_atlet_asad)
                    ? "Aktif"
                    : "Tidak"}
                </PortfolioField>
                <PortfolioField label="Petugas input" wide>
                  {displayValue(data.nm_petugas_input)}
                </PortfolioField>
              </div>
            </section>
          </main>

          <footer className="portfolio-footer">
            <div>
              <strong>Digital Data Generus</strong>
              <span> · Dokumen profil peserta</span>
            </div>
            <span className="portfolio-print-date">
              Diterbitkan{" "}
              {new Intl.DateTimeFormat("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </span>
          </footer>
        </article>
      </div>
    );
  },
);

const PortfolioField = ({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) => (
  <div className={`portfolio-field${wide ? " portfolio-field-wide" : ""}`}>
    <span>{label}</span>
    <p>{children}</p>
  </div>
);

PortfolioPdf.displayName = "PortfolioPdf";

export default PortfolioPdf;
