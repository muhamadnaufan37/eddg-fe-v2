import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Users, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface StatistikJenisData {
  caberawit: number;
  praremaja: number;
  remaja: number;
  mumi: number;
}

interface StatistikDaerah {
  id: number;
  nama: string;
  total: number;
  jenis_data: StatistikJenisData;
}

interface StatistikDesa {
  id: number;
  daerah_id: number;
  nama_daerah: string;
  nama: string;
  total: number;
  jenis_data: StatistikJenisData;
}

interface StatistikKelompok {
  id: number;
  daerah_id: number;
  desa_id: number;
  nama_daerah: string;
  nama_desa: string;
  nama: string;
  total: number;
  jenis_data: StatistikJenisData;
}

export interface StatistikDashboardData {
  summary: {
    total_peserta: number;
  };
  charts: {
    gender: Array<{ jenis_kelamin: string; total: number }>;
    status_pernikahan: Array<{ status_pernikahan: boolean; total: number }>;
    status_sambung: Array<{ status_sambung: number; total: number }>;
    pekerjaan: Array<{ nama_pekerjaan: string; total: number }>;
    sebaran_desa: Array<{ label: string; total: number }>;
    jenis_data: Array<{ jenis_data: string; total: number }>;
  };
  demografi_jenis_data: {
    daerah: StatistikDaerah[];
    desa: StatistikDesa[];
    kelompok: StatistikKelompok[];
  };
}

interface StatistikModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StatistikDashboardData | null;
}

interface ChartCardProps {
  title: string;
  items: Array<{ label: string; total: number }>;
}

interface DemographicTableProps {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, items }) => (
  <section className="min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <h3 className="mb-4 text-base font-bold text-slate-800 dark:text-white">
      {title}
    </h3>
    {items.length > 0 ? (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} layout="vertical" margin={{ right: 12 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#94a3b8"
              opacity={0.25}
            />
            <XAxis type="number" />
            <YAxis
              dataKey="label"
              type="category"
              width={110}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Bar dataKey="total" fill="#6366f1" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">
        Tidak ada data
      </p>
    )}
  </section>
);

const DemographicTable: React.FC<DemographicTableProps> = ({
  title,
  columns,
  rows,
}) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <h3 className="mb-4 text-base font-bold text-slate-800 dark:text-white">
      {title}
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-gray-700 dark:text-gray-400">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, valueIndex) => (
                  <td
                    key={`${rowIndex}-${valueIndex}`}
                    className="px-3 py-2 text-slate-700 dark:text-gray-300"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-slate-500 dark:text-gray-400"
              >
                Tidak ada data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const StatistikDashboardModal: React.FC<StatistikModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!data) return null;

  const { charts, demografi_jenis_data: demografi } = data;
  const jenisDataColumns = ["Caberawit", "Praremaja", "Remaja", "Mumi"];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-black/80"
          />

          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] bg-slate-50 shadow-2xl dark:bg-gray-900 sm:rounded-[2rem]"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/90 sm:px-8 sm:py-6">
              <div className="flex items-center gap-3">
                <div className="hidden rounded-xl bg-indigo-600 p-2.5 text-white shadow-lg dark:bg-indigo-500 sm:block">
                  <Users size={20} />
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white sm:text-2xl">
                  Statistik Data Peserta
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup statistik"
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-6 overflow-y-auto p-5 sm:space-y-8 sm:p-8">
              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-500 p-3 text-white">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-400">
                      Total Peserta
                    </p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">
                      {data.summary.total_peserta}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ChartCard
                  title="Jenis Kelamin"
                  items={charts.gender.map((item) => ({
                    label: item.jenis_kelamin,
                    total: item.total,
                  }))}
                />
                <ChartCard
                  title="Status Pernikahan"
                  items={charts.status_pernikahan.map((item) => ({
                    label: item.status_pernikahan ? "Menikah" : "Belum menikah",
                    total: item.total,
                  }))}
                />
                <ChartCard
                  title="Status Sambung"
                  items={charts.status_sambung.map((item) => ({
                    label: String(item.status_sambung),
                    total: item.total,
                  }))}
                />
                <ChartCard
                  title="Sebaran Desa"
                  items={charts.sebaran_desa.map((item) => ({
                    label: item.label,
                    total: item.total,
                  }))}
                />
                <ChartCard
                  title="Pekerjaan"
                  items={charts.pekerjaan.map((item) => ({
                    label: item.nama_pekerjaan,
                    total: item.total,
                  }))}
                />
                <ChartCard
                  title="Jenis Data"
                  items={charts.jenis_data.map((item) => ({
                    label: item.jenis_data,
                    total: item.total,
                  }))}
                />
              </div>

              <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                  <MapPin size={18} className="text-emerald-500" />
                  Demografi Jenis Data
                </h3>

                <DemographicTable
                  title="Daerah"
                  columns={["ID", "Nama", "Total", ...jenisDataColumns]}
                  rows={demografi.daerah.map((item) => [
                    item.id,
                    item.nama,
                    item.total,
                    item.jenis_data.caberawit,
                    item.jenis_data.praremaja,
                    item.jenis_data.remaja,
                    item.jenis_data.mumi,
                  ])}
                />
                <DemographicTable
                  title="Desa"
                  columns={[
                    "ID",
                    "ID Daerah",
                    "Nama Daerah",
                    "Nama",
                    "Total",
                    ...jenisDataColumns,
                  ]}
                  rows={demografi.desa.map((item) => [
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
                <DemographicTable
                  title="Kelompok"
                  columns={[
                    "ID",
                    "ID Daerah",
                    "ID Desa",
                    "Nama Daerah",
                    "Nama Desa",
                    "Nama",
                    "Total",
                    ...jenisDataColumns,
                  ]}
                  rows={demografi.kelompok.map((item) => [
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
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StatistikDashboardModal;
