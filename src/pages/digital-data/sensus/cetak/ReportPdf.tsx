import { Ref, forwardRef } from "react";
import "../../../../styles/convertPdfSensus.css";

interface props {
  data: any;
}

const ReportPdf = forwardRef(({ data }: props, ref: Ref<any>) => {
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
            {data.map((rowData: any, index: any) => (
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
                <td style={{ textAlign: "center" }}>
                  {rowData?.umur || rowData?.usia || "-"}
                </td>
                <td>
                  Ayah: {rowData?.nama_ayah || "-"}
                  <br />
                  Ibu: {rowData?.nama_ibu || "-"}
                </td>
                <td>
                  {rowData?.pekerjaan_relation?.nama_pekerjaan ||
                    rowData?.pekerjaan ||
                    "-"}
                </td>
                <td style={{ textAlign: "center" }}>
                  {rowData?.status_kelas || "-"}
                </td>
                <td>
                  {rowData?.kelompok?.nama_kelompok ||
                    rowData?.nama_kelompok ||
                    "-"}
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
                  {rowData?.status_pernikahan === true ||
                  rowData?.status_pernikahan === "Sudah Menikah"
                    ? "Sudah Menikah"
                    : rowData?.status_pernikahan === false ||
                        rowData?.status_pernikahan === "Belum Menikah"
                      ? "Belum Menikah"
                      : rowData?.status_pernikahan || "-"}
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
