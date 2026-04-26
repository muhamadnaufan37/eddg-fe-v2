import { forwardRef, type Ref } from "react";
import "../../../../styles/convertPdfSensus.css";

export interface Root {
  success: boolean;
  message: string;
  data: Daum[];
}

export interface Daum {
  id: number;
  kode_cari_data: string;
  nama_lengkap: string;
  nama_panggilan: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  umur: number;
  alamat: string;
  jenis_kelamin: string;
  no_telepon: string;
  nama_ayah: string;
  nama_ibu: string;
  hoby: string;
  kd_pekerjaan: number;
  nm_pekerjaan: string;
  usia_menikah: string;
  kriteria_pasangan: string;
  status_pernikahan: boolean;
  status_sambung: number;
  status_atlet_asad: boolean;
  kd_daerah: number;
  nm_daerah: string;
  kd_desa: number;
  nm_desa: string;
  kd_kelompok: number;
  nm_kelompok: string;
  jenis_data: string;
  id_petugas_input: number;
  nm_petugas_input: string;
  kelas_label: string;
}

interface Props {
  data: Daum[];
}

const ReportPdf = forwardRef(({ data }: Props, ref: Ref<any>) => {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div ref={ref}>
      <div className="flex flex-col gap-3 p-5">
        <div className="print-title text-center text-2xl font-bold mb-3">
          REKAP DATA SENSUS
        </div>

        <table>
          <thead>
            <tr>
              <th>NO</th>
              <th>NAMA LENGKAP</th>
              <th>TTL</th>
              <th>JENIS KELAMIN</th>
              <th>USIA</th>
              <th>NAMA ORANG TUA</th>
              <th>PEKERJAAN</th>
              <th>KELAS</th>
              <th>TEMPAT SAMBUNG</th>
              <th>STATUS SAMBUNG</th>
              <th>STATUS MENIKAH</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((rowData: Daum, index: number) => (
              <tr key={index}>
                <td style={{ textAlign: "center" }}>{index + 1}</td>
                <td>{rowData?.nama_lengkap || "-"}</td>
                <td>
                  {rowData?.tempat_lahir || "-"},{" "}
                  {rowData?.tanggal_lahir || "-"}
                </td>
                <td style={{ textAlign: "center" }}>
                  {rowData?.jenis_kelamin || "-"}
                </td>
                <td style={{ textAlign: "center" }}>{rowData?.umur || "-"}</td>
                <td>
                  Ayah: {rowData?.nama_ayah || "-"}
                  <br />
                  Ibu: {rowData?.nama_ibu || "-"}
                </td>
                <td>{rowData?.nm_pekerjaan || "-"}</td>
                <td style={{ textAlign: "center" }}>
                  {rowData?.kelas_label || "-"}
                </td>
                <td>
                  {rowData?.nm_daerah || "-"}
                  <br />
                  {rowData?.nm_desa || "-"}
                  <br />
                  {rowData?.nm_kelompok || "-"}
                </td>
                <td style={{ textAlign: "center" }}>
                  {rowData?.status_sambung === 1
                    ? "Sambung"
                    : rowData?.status_sambung === 2
                      ? "Tidak Sambung"
                      : rowData?.status_sambung === 3
                        ? "Pindah Sambung"
                        : rowData?.status_sambung || "-"}
                </td>
                <td style={{ textAlign: "center" }}>
                  {rowData?.status_pernikahan === true
                    ? "Sudah Menikah"
                    : rowData?.status_pernikahan === false
                      ? "Belum Menikah"
                      : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default ReportPdf;
