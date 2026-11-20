import { forwardRef, type Ref } from "react";
import { STATUS_SAMBUNG_MAP } from "@/constants";
import type { StatistikDashboardData } from "./StatistikDashboard";
import "./statistik-pdf.css";

interface Props {
  data: StatistikDashboardData;
}

interface PdfTableProps {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

const PdfTable = ({ title, columns, rows }: PdfTableProps) => (
  <section className="statistik-pdf-section">
    <h2>{title}</h2>
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((value, valueIndex) => (
              <td key={`${rowIndex}-${valueIndex}`}>{value}</td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length}>Tidak ada data</td>
          </tr>
        )}
      </tbody>
    </table>
  </section>
);

const StatistikPdf = forwardRef(
  ({ data }: Props, ref: Ref<HTMLDivElement>) => {
    const demographicColumns = [
      "ID",
      "Nama",
      "Total",
      "Caberawit",
      "Praremaja",
      "Remaja",
      "Mumi",
    ];

    return (
      <main ref={ref} className="statistik-pdf">
        <h1>Statistik Data Peserta</h1>
        <PdfTable
          title="Ringkasan"
          columns={["Total Peserta"]}
          rows={[[data.summary.total_peserta]]}
        />

        <div className="statistik-pdf-chart-grid">
          <PdfTable
            title="Jenis Kelamin"
            columns={["Jenis Kelamin", "Total"]}
            rows={data.charts.gender.map((item) => [
              item.jenis_kelamin,
              item.total,
            ])}
          />
          <PdfTable
            title="Status Pernikahan"
            columns={["Status Pernikahan", "Total"]}
            rows={data.charts.status_pernikahan.map((item) => [
              item.status_pernikahan ? "Menikah" : "Belum menikah",
              item.total,
            ])}
          />
          <PdfTable
            title="Status Sambung"
            columns={["Status Sambung", "Total"]}
            rows={data.charts.status_sambung.map((item) => [
              STATUS_SAMBUNG_MAP[item.status_sambung]?.text ??
                item.status_sambung,
              item.total,
            ])}
          />
          <PdfTable
            title="Pekerjaan"
            columns={["Nama Pekerjaan", "Total"]}
            rows={data.charts.pekerjaan.map((item) => [
              item.nama_pekerjaan,
              item.total,
            ])}
          />
          <PdfTable
            title="Sebaran Desa"
            columns={["Desa", "Total"]}
            rows={data.charts.sebaran_desa.map((item) => [
              item.label,
              item.total,
            ])}
          />
          <PdfTable
            title="Jenis Data"
            columns={["Jenis Data", "Total"]}
            rows={data.charts.jenis_data.map((item) => [
              item.jenis_data,
              item.total,
            ])}
          />
        </div>

        <h2 className="statistik-pdf-heading">Demografi Jenis Data</h2>
        <PdfTable
          title="Daerah"
          columns={demographicColumns}
          rows={data.demografi_jenis_data.daerah.map((item) => [
            item.id,
            item.nama,
            item.total,
            item.jenis_data.caberawit,
            item.jenis_data.praremaja,
            item.jenis_data.remaja,
            item.jenis_data.mumi,
          ])}
        />
        <PdfTable
          title="Desa"
          columns={[
            "ID",
            "ID Daerah",
            "Nama Daerah",
            "Nama",
            "Total",
            "Caberawit",
            "Praremaja",
            "Remaja",
            "Mumi",
          ]}
          rows={data.demografi_jenis_data.desa.map((item) => [
            item.id,
            item.daerah_id,
            item.nama_daerah,
            item.nama,
            item.total,
            item.jenis_data.caberawit,
            item.jenis_data.praremaja,
            item.jenis_data.remaja,
            item.jenis_data.mumi,
          ])}
        />
        <PdfTable
          title="Kelompok"
          columns={[
            "ID",
            "ID Daerah",
            "ID Desa",
            "Nama Daerah",
            "Nama Desa",
            "Nama",
            "Total",
            "Caberawit",
            "Praremaja",
            "Remaja",
            "Mumi",
          ]}
          rows={data.demografi_jenis_data.kelompok.map((item) => [
            item.id,
            item.daerah_id,
            item.desa_id,
            item.nama_daerah,
            item.nama_desa,
            item.nama,
            item.total,
            item.jenis_data.caberawit,
            item.jenis_data.praremaja,
            item.jenis_data.remaja,
            item.jenis_data.mumi,
          ])}
        />
      </main>
    );
  },
);

StatistikPdf.displayName = "StatistikPdf";

export default StatistikPdf;
