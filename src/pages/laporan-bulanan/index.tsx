import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

// --- Types (Berdasarkan Struktur JSON API) ---

type ReportStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Report {
  id: number;
  bulan: number;
  tahun: number;
  catatan: string;
  status: ReportStatus;
  tanggal_submit: string;
  keterangan_reject?: string;
}

interface SubmitPayload {
  bulan: number;
  tahun: number;
  catatan: string;
}

// --- Mock Data (Simulasi Database) ---
const MOCK_DATA: Report[] = [
  {
    id: 1,
    bulan: 1,
    tahun: 2026,
    catatan: "Data penjualan Q1 lengkap",
    status: "PENDING",
    tanggal_submit: "2026-02-01",
  },
  {
    id: 2,
    bulan: 12,
    tahun: 2025,
    catatan: "Laporan akhir tahun",
    status: "APPROVED",
    tanggal_submit: "2026-01-05",
  },
  {
    id: 3,
    bulan: 11,
    tahun: 2025,
    catatan: "Data HR belum lengkap",
    status: "REJECTED",
    tanggal_submit: "2025-12-02",
    keterangan_reject: "Mohon lengkapi data absensi",
  },
];

// --- Utility Functions ---

const getMonthName = (month: number) => {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleString("id-ID", { month: "long" });
};

const getStatusBadge = (status: ReportStatus) => {
  switch (status) {
    case "APPROVED":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Disetujui
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" /> Ditolak
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" /> Menunggu
        </span>
      );
  }
};

// --- Main Component ---

export default function LaporanBulananPage() {
  // State
  const [reports, setReports] = useState<Report[]>(MOCK_DATA);
  const [isLoading, setIsLoading] = useState(false);

  // Filter State
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  // Form State
  const [newReport, setNewReport] = useState<SubmitPayload>({
    bulan: new Date().getMonth() + 1,
    tahun: 2026,
    catatan: "",
  });
  const [rejectReason, setRejectReason] = useState("");

  // --- API Handlers (Simulasi) ---

  const handleFetchHistory = async () => {
    setIsLoading(true);
    // Simulasi: GET /api/v1/laporan-bulanan/history?tahun=...
    console.log(
      `Fetching history with filters: Year=${filterYear}, Status=${filterStatus}`,
    );
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulasi: POST /api/v1/laporan-bulanan/submit
    setTimeout(() => {
      const newEntry: Report = {
        id: Math.random(),
        ...newReport,
        status: "PENDING",
        tanggal_submit: new Date().toISOString().split("T")[0],
      };
      setReports([newEntry, ...reports]);
      setIsSubmitModalOpen(false);
      setNewReport({ bulan: 1, tahun: 2026, catatan: "" }); // Reset
      setIsLoading(false);
    }, 800);
  };

  const handleApprove = (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menyetujui laporan ini?")) return;
    // Simulasi: POST /api/v1/laporan-bulanan/{id}/approve
    setReports(
      reports.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r)),
    );
  };

  const openRejectModal = (id: number) => {
    setSelectedReportId(id);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedReportId) return;
    // Simulasi: POST /api/v1/laporan-bulanan/{id}/reject
    setReports(
      reports.map((r) =>
        r.id === selectedReportId
          ? { ...r, status: "REJECTED", keterangan_reject: rejectReason }
          : r,
      ),
    );
    setIsRejectModalOpen(false);
  };

  // --- UI Render ---

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Laporan Bulanan
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola dan pantau status laporan kinerja bulanan Anda.
            </p>
          </div>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Laporan Baru
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 w-full md:w-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tahun
              </label>
              <input
                type="number"
                placeholder="2026"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Semua Status</option>
                <option value="PENDING">Menunggu</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFetchHistory}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
              >
                <Filter className="w-4 h-4 mr-2" /> Terapkan Filter
              </button>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Periode
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Tanggal Submit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Catatan
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                      Belum ada laporan ditemukan.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getMonthName(report.bulan)} {report.tahun}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.tanggal_submit}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {report.catatan}
                        {report.keterangan_reject && (
                          <div className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {report.keterangan_reject}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {report.status === "PENDING" && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleApprove(report.id)}
                              className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(report.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {report.status !== "PENDING" && (
                          <span className="text-gray-400 italic text-xs">
                            Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (Static Demo) */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Menampilkan <span className="font-medium">1</span> sampai{" "}
                  <span className="font-medium">{reports.length}</span> dari{" "}
                  <span className="font-medium">{reports.length}</span> hasil
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL: Submit Report --- */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Submit Laporan Bulanan
              </h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bulan
                  </label>
                  <select
                    value={newReport.bulan}
                    onChange={(e) =>
                      setNewReport({
                        ...newReport,
                        bulan: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={newReport.tahun}
                    onChange={(e) =>
                      setNewReport({
                        ...newReport,
                        tahun: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  rows={4}
                  required
                  value={newReport.catatan}
                  onChange={(e) =>
                    setNewReport({ ...newReport, catatan: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ringkasan laporan..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? "Mengirim..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Reject Report --- */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                Tolak Laporan
              </h3>
              <p className="text-sm text-center text-gray-500 mb-6">
                Mohon berikan alasan penolakan agar user dapat memperbaiki
                datanya.
              </p>

              <div className="space-y-4">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                  rows={3}
                  placeholder="Keterangan reject (cth: Data tidak lengkap)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRejectConfirm}
                    disabled={!rejectReason}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Tolak Laporan
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
