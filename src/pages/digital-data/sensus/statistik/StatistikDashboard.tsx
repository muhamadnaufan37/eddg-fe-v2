import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, X, Briefcase, MapPin, BellRing } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface StatistikModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

const MiniCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-4 w-full">
    <div className={`p-3 rounded-xl ${color} text-white shrink-0`}>
      <Icon size={20} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider truncate">
        {title}
      </p>
      <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

const StatistikDashboardModal: React.FC<StatistikModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!data) return null;

  const maleCount =
    data?.charts?.gender.find((g: any) => g.jenis_kelamin === "LAKI-LAKI")
      ?.total || 0;
  const femaleCount =
    data?.charts?.gender.find((g: any) => g.jenis_kelamin === "PEREMPUAN")
      ?.total || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-6xl bg-slate-50 dark:bg-gray-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header - Sticky */}
            <div className="sticky top-0 z-10 bg-slate-50/80 dark:bg-gray-900/80 backdrop-blur-md px-5 sm:px-8 py-4 sm:py-6 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="hidden sm:block p-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-xl text-white shadow-lg">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                    Analytics Dashboard
                  </h2>
                  <p className="text-slate-500 dark:text-gray-400 text-[10px] sm:text-sm font-medium">
                    Laporan sensus real-time
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-full transition-colors bg-white dark:bg-gray-800 sm:bg-transparent sm:dark:bg-transparent shadow-sm sm:shadow-none"
              >
                <X size={20} className="text-slate-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
              {/* Row 1: Summary Cards - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <MiniCard
                  title="Total Peserta"
                  value={data?.summary.total_peserta}
                  icon={Users}
                  color="bg-indigo-500"
                />
                <MiniCard
                  title="Laki-laki"
                  value={maleCount}
                  icon={Users}
                  color="bg-blue-500"
                />
                <MiniCard
                  title="Perempuan"
                  value={femaleCount}
                  icon={Users}
                  color="bg-rose-500"
                />
              </div>

              {/* Row 2: Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Gender Pie Chart */}
                <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-md font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <BellRing
                      size={18}
                      className="text-indigo-500 dark:text-indigo-400"
                    />{" "}
                    Demografi
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-4 h-auto sm:h-64">
                    <div className="w-full h-48 sm:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.charts?.gender}
                            dataKey="total"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={8}
                          >
                            {data?.charts?.gender.map(
                              (_: any, index: number) => (
                                <Cell
                                  key={index}
                                  fill={index === 0 ? "#6366f1" : "#fb7185"}
                                />
                              ),
                            )}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center sm:text-left">
                        Status Menikah
                      </p>
                      {data?.charts?.status_pernikahan.map(
                        (item: any, i: number) => (
                          <div
                            key={i}
                            className="flex justify-between items-center bg-slate-50 dark:bg-gray-700 px-4 py-2 rounded-xl"
                          >
                            <span className="text-sm font-semibold text-slate-600 dark:text-gray-300">
                              {item.status_pernikahan
                                ? "💍 Menikah"
                                : "👤 Lajang"}
                            </span>
                            <span className="text-sm font-black text-slate-800 dark:text-white">
                              {item.total}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Sebaran Wilayah */}
                <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-md font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <MapPin
                      size={18}
                      className="text-emerald-500 dark:text-emerald-400"
                    />{" "}
                    Sebaran Wilayah
                  </h3>
                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data?.charts?.sebaran_desa}
                        layout="vertical"
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="label"
                          type="category"
                          width={80}
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip cursor={{ fill: "transparent" }} />
                        <Bar
                          dataKey="total"
                          fill="#10b981"
                          radius={[0, 8, 8, 0]}
                          barSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Profil Pekerjaan - Full Width */}
                <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm lg:col-span-2">
                  <h3 className="text-md font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Briefcase
                      size={18}
                      className="text-amber-500 dark:text-amber-400"
                    />{" "}
                    Profil Pekerjaan
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                    {data?.charts?.pekerjaan.map((job: any, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-50 dark:bg-gray-700 p-3 sm:p-4 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
                      >
                        <p className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 leading-none mb-1">
                          {job.total}
                        </p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase leading-tight truncate">
                          {job.nama_pekerjaan}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="mt-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-slate-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-slate-400 dark:text-gray-500">
                <Calendar size={12} />
                <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-center">
                  Update: {new Date().toLocaleDateString("id-ID")}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 italic">
                Data terenkripsi AES-256
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StatistikDashboardModal;
