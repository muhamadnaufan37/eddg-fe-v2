import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Clock,
  Database,
  Globe,
  LogIn,
  LogOut,
  Monitor,
  Smartphone,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { THEME_COLORS } from "@/config/theme";
import { axiosServices } from "@/services/axios";
import { toast } from "sonner";
import {
  getLocalStorage,
  removeLocalStorage,
} from "@/services/localStorageService";
import BottomSheet from "./components/BottomSheet";
import RippleButton from "./components/RippleButton";
import Badge from "./components/Badge";

interface ActivityRecord {
  id: number;
  user: {
    nama_lengkap: string;
    username: string;
  };
  activity_type: string;
  description: string;
  ip_address: string;
  user_agent: string;
  time_ago: string;
  created_at: string;
}

const BerandaPage = () => {
  const hasFetched = useRef(false);
  const [openSheet, setOpenSheet] = useState(false);
  const [now, setNow] = useState(new Date());
  const [activitiesRecent, setActivitiesRecent] = useState<any[]>([]);
  const [activitiesMyActivity, setActivitiesMyActivity] = useState<any[]>([]);
  const [activitiesStatistics, setActivitiesStatistics] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [shouldRender2, setShouldRender2] = useState(false);
  const [selectedAct, setSelectedAct] = useState<ActivityRecord | null>(null);
  const [isModalOpenDetail, setIsModalOpenDetail] = useState(false);
  const [shouldRenderDetail, setShouldRenderDetail] = useState(false);

  // Loading states
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingMyActivity, setLoadingMyActivity] = useState(true);
  const [loadingStatistics, setLoadingStatistics] = useState(true);

  // Error states
  const [errorRecent, setErrorRecent] = useState(false);
  const [errorMyActivity, setErrorMyActivity] = useState(false);
  const [errorStatistics, setErrorStatistics] = useState(false);

  // Fungsi untuk membuka detail dengan transisi
  const openDetail = (act: any) => {
    setSelectedAct(act);
    setShouldRenderDetail(true);
    setTimeout(() => setIsModalOpenDetail(true), 10);
  };

  // Fungsi untuk menutup detail dengan transisi
  const closeDetail = () => {
    setIsModalOpenDetail(false);
    setTimeout(() => {
      setShouldRenderDetail(false);
      setSelectedAct(null);
    }, 300);
  };

  // Fungsi untuk menangani transisi saat menutup
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setShouldRender(false), 300); // Tunggu durasi animasi selesai (300ms)
  };

  // Fungsi untuk menangani transisi saat membuka
  const openModal = () => {
    setShouldRender(true);
    setTimeout(() => setIsModalOpen(true), 10); // Delay kecil agar browser sempat merender DOM sebelum animasi mulai
  };

  // Fungsi untuk menangani transisi saat menutup
  const closeModal2 = () => {
    setIsModalOpen2(false);
    setTimeout(() => setShouldRender2(false), 300); // Tunggu durasi animasi selesai (300ms)
  };

  // Fungsi untuk menangani transisi saat membuka
  const openModal2 = () => {
    setShouldRender2(true);
    setTimeout(() => setIsModalOpen2(true), 10); // Delay kecil agar browser sempat merender DOM sebelum animasi mulai
  };

  const deleteUserInfo = () => {
    removeLocalStorage("userData");
  };

  const userData = getLocalStorage("userData");

  const getActivityStyle = (type: string) => {
    switch (type) {
      case "login":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "logout":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-blue-50 text-blue-600 border-blue-100";
    }
  };

  const pageSensus = () => {
    window.location.href = "/sensus";
  };

  const pageAuthUsers = () => {
    window.location.href = "/auth/users";
  };

  const pageSambungDaerah = () => {
    window.location.href = "/tempat-sambung/daerah";
  };

  const pageLogs = () => {
    window.location.href = "/auth/logs";
  };

  const pagePengaduan = () => {
    window.location.href = "/pengaduan";
  };

  const pageAbsen = () => {
    window.location.href = "/presensi";
  };

  const fetchActivitiesRecent = async () => {
    try {
      setLoadingRecent(true);
      setErrorRecent(false);
      const response = await axiosServices().get("/api/v1/activities/recent");
      setActivitiesRecent(response.data.data);
    } catch (error: any) {
      setErrorRecent(true);
      if (error.response) {
        const { status, data } = error.response;
        if (
          [
            400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413,
            414, 415, 416, 417, 418, 422, 423, 424, 425, 426, 428, 429, 431,
            451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
          ].includes(status)
        ) {
          toast.error("Error!", {
            description: data.message || "Terjadi kesalahan",
            duration: 3000,
          });
        }

        if (status === 401) {
          try {
            deleteUserInfo();
            window.location.href = "/";
          } catch {
            toast.error("Error!", {
              description: "Oops.. ada kesalahan sistem, silahkan coba lagi.",
              duration: 3000,
            });
          }
        }
      }
    } finally {
      setLoadingRecent(false);
    }
  };

  const fetchActivitiesMyActivity = async () => {
    try {
      setLoadingMyActivity(true);
      setErrorMyActivity(false);
      const response = await axiosServices().get(
        "/api/v1/activities/my-activity",
      );
      setActivitiesMyActivity(response.data.data);
    } catch (error: any) {
      if (error.response) {
        const { status, data } = error.response;
        if (
          [
            400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413,
            414, 415, 416, 417, 418, 422, 423, 424, 425, 426, 428, 429, 431,
            451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
          ].includes(status)
        ) {
          toast.error("Error!", {
            description: data.message || "Terjadi kesalahan",
            duration: 3000,
          });
        }

        if (status === 401) {
          try {
            deleteUserInfo();
            window.location.href = "/";
          } catch {
            toast.error("Error!", {
              description: "Oops.. ada kesalahan sistem, silahkan coba lagi.",
              duration: 3000,
            });
          }
        }
      }
    } finally {
      setLoadingMyActivity(false);
    }
  };

  const fetchActivitiesStatistics = async () => {
    try {
      setLoadingStatistics(true);
      setErrorStatistics(false);
      const response = await axiosServices().get(
        "/api/v1/activities/statistics",
      );
      setActivitiesStatistics(response.data.data);
    } catch (error: any) {
      if (error.response) {
        const { status, data } = error.response;
        if (
          [
            400, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413,
            414, 415, 416, 417, 418, 422, 423, 424, 425, 426, 428, 429, 431,
            451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
          ].includes(status)
        ) {
          toast.error("Error!", {
            description: data.message || "Terjadi kesalahan",
            duration: 3000,
          });
        }

        if (status === 401) {
          try {
            deleteUserInfo();
            window.location.href = "/";
          } catch {
            toast.error("Error!", {
              description: "Oops.. ada kesalahan sistem, silahkan coba lagi.",
              duration: 3000,
            });
          }
        }
      }
    } finally {
      setLoadingStatistics(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchActivitiesRecent();
      fetchActivitiesMyActivity();
      if (userData?.user?.role_id === "219bc0dd-ec72-4618-b22d-5d5ff612dcaf") {
        fetchActivitiesStatistics();
      }
      hasFetched.current = true;
    }
  }, []);

  const formatDate = (date: Date) => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const dayName = days[date.getDay()];
    const dayDate = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${dayDate} - ${monthName} - ${year}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const menus = [
    {
      label: "Pengaturan Users",
      icon: "/assets/logo-dashboard-1.svg",
      roles: ["219bc0dd-ec72-4618-b22d-5d5ff612dcaf"],
      onClick: pageAuthUsers,
    },
    {
      label: "Tempat Sambung",
      icon: "/assets/logo-dashboard-3.svg",
      roles: ["219bc0dd-ec72-4618-b22d-5d5ff612dcaf"],
      onClick: pageSambungDaerah,
    },
    {
      label: "Sensus",
      icon: "/assets/logo-dashboard-7.svg",
      roles: [
        "219bc0dd-ec72-4618-b22d-5d5ff612dcaf",
        "aba1b06f-846a-414b-b223-b002a50c5722",
      ],
      onClick: pageSensus,
    },
    {
      label: "Logs",
      icon: "/assets/logo-dashboard-10.svg",
      roles: [
        "219bc0dd-ec72-4618-b22d-5d5ff612dcaf",
        "7352e0d6-f5d0-45f2-8eb4-4880cc72bad6",
      ],
      onClick: pageLogs,
    },
    {
      label: "Pengaduan",
      icon: "/assets/logo-dashboard-11.svg",
      roles: [
        "219bc0dd-ec72-4618-b22d-5d5ff612dcaf",
        "7352e0d6-f5d0-45f2-8eb4-4880cc72bad6",
      ],
      onClick: pagePengaduan,
    },
    {
      label: "Absensi",
      icon: "/assets/logo-dashboard-9.svg",
      roles: [
        "219bc0dd-ec72-4618-b22d-5d5ff612dcaf",
        "aba1b06f-846a-414b-b223-b002a50c5722",
        "b511748b-ef40-4999-b4e9-b8ab575ec958",
      ],
      onClick: pageAbsen,
    },
  ];

  const InfoRow = ({ label, value }: any) => (
    <div
      className={`flex justify-between ${THEME_COLORS.border.default} border-b pb-2`}
    >
      <span className={THEME_COLORS.text.muted}>{label}</span>
      <span className={`font-medium ${THEME_COLORS.text.primary}`}>
        {value}
      </span>
    </div>
  );

  const recentData = activitiesMyActivity.slice(0, 5);

  const getPlatformInfo = (ua: any) => {
    if (ua.includes("Postman"))
      return {
        name: "Postman",
        icon: <Database size={14} />,
        color:
          "text-orange-500 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
      };
    if (ua.includes("Windows"))
      return {
        name: "Windows",
        icon: <Monitor size={14} />,
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
      };
    if (ua.includes("Android"))
      return {
        name: "Android",
        icon: <Smartphone size={14} />,
        color:
          "text-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
      };
    return {
      name: "Web Device",
      icon: <Globe size={14} />,
      color: "text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-400",
    };
  };

  document.title = "Beranda";

  return (
    <>
      <div className="flex flex-col gap-4">
        <div
          className={`flex flex-col gap-3 p-4 ${THEME_COLORS.background.card} border ${THEME_COLORS.border.default} rounded-2xl`}
        >
          <div>
            <p className="font-normal text-sm leading-6">
              {formatDate(now)}, {formatTime(now)}
            </p>
            <span
              className={`font-medium text-xl leading-7 ${THEME_COLORS.text.primary}`}
            >
              Wilujeung Sumping, {userData?.user?.nama_lengkap}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-base">Beranda</h2>
              <button
                className="text-xs text-blue-600"
                onClick={() => setOpenSheet(true)}
              >
                See All
              </button>
            </div>

            {/* Grid Menu - Tampilkan hanya 6 menu utama */}
            <div className="grid grid-cols-3 gap-y-5 gap-x-3">
              {menus
                .filter((menu) => menu.roles.includes(userData?.user?.role_id))
                .slice(0, 6)
                .map((menu: any) => (
                  <RippleButton
                    key={menu.label}
                    onClick={menu.onClick}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="relative w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                      <img
                        src={menu.icon}
                        className="w-6 h-6"
                        alt={menu.label}
                      />
                      {menu.badge && <Badge count={menu.badge} />}
                    </div>
                    <span
                      className={`text-xs text-center ${THEME_COLORS.text.secondary}`}
                    >
                      {menu.label}
                    </span>
                  </RippleButton>
                ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {userData?.user?.role_id ===
            "219bc0dd-ec72-4618-b22d-5d5ff612dcaf" && (
            <div className="w-full overflow-x-auto scrollbar-hide">
              <div className="flex md:grid md:grid-cols-3 gap-4 min-w-187.5 md:min-w-full">
                {loadingStatistics ? (
                  // Loading skeleton for statistics
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 ${THEME_COLORS.background.card} p-5 rounded-xl shadow-sm ${THEME_COLORS.border.default} border animate-pulse`}
                    >
                      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2 mb-3" />
                      <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded w-20 mb-4" />
                      <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded w-2/3" />
                    </div>
                  ))
                ) : errorStatistics ? (
                  // Error state
                  <div
                    className={`flex-1 ${THEME_COLORS.background.card} p-5 rounded-xl shadow-sm ${THEME_COLORS.border.default} border text-center`}
                  >
                    <p className={`text-sm ${THEME_COLORS.text.muted}`}>
                      Gagal memuat statistik
                    </p>
                    <button
                      onClick={fetchActivitiesStatistics}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Card 1: Total Aktivitas */}
                    <div
                      className={`flex-1 ${THEME_COLORS.background.card} p-5 rounded-xl shadow-sm ${THEME_COLORS.border.default} border relative overflow-hidden group hover:shadow-md transition-all`}
                    >
                      <div className="relative z-10">
                        <p
                          className={`text-[10px] font-bold ${THEME_COLORS.text.muted} uppercase tracking-widest`}
                        >
                          Total Aktivitas
                        </p>
                        <h3
                          className={`text-3xl font-black ${THEME_COLORS.text.primary} mt-1`}
                        >
                          {activitiesStatistics?.total_activities}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-emerald-500 dark:text-emerald-400 text-xs font-bold">
                          <TrendingUp size={14} /> <span>Bulan Ini</span>
                        </div>
                      </div>
                      <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-50 dark:text-slate-900 opacity-[0.03] group-hover:scale-110 transition-transform" />
                    </div>

                    {/* Card 2: Login Berhasil */}
                    <div
                      className={`flex-1 ${THEME_COLORS.background.card} p-5 rounded-xl shadow-sm ${THEME_COLORS.border.default} border group hover:shadow-md transition-all`}
                    >
                      <p
                        className={`text-[10px] font-bold ${THEME_COLORS.text.muted} uppercase tracking-widest`}
                      >
                        Login Berhasil
                      </p>
                      <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mt-1">
                        {activitiesStatistics?.activity_by_type?.login}
                      </h3>
                      <div
                        className={`mt-4 w-full ${THEME_COLORS.background.tableHeader} h-1.5 rounded-full overflow-hidden`}
                      >
                        <div
                          className="bg-emerald-500 h-full transition-all duration-1000"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                    </div>

                    {/* Card 3: User Paling Aktif */}
                    <div
                      className={`flex-1 ${THEME_COLORS.background.card} p-5 rounded-xl shadow-sm ${THEME_COLORS.border.default} border group hover:shadow-md transition-all`}
                    >
                      <p
                        className={`text-[10px] font-bold ${THEME_COLORS.text.muted} uppercase tracking-widest`}
                      >
                        User Paling Aktif
                      </p>
                      <h3
                        className={`text-xl font-black ${THEME_COLORS.text.primary} mt-1 truncate max-w-37.5 md:max-w-full`}
                      >
                        {
                          activitiesStatistics?.most_active_users?.[0]
                            ?.nama_lengkap
                        }
                      </h3>
                      <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mt-2 uppercase tracking-tighter flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        {
                          activitiesStatistics?.most_active_users?.[0]
                            ?.total_aktivitas
                        }{" "}
                        Aktivitas
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div
              className={`${THEME_COLORS.background.card} rounded-xl p-4 shadow-sm ${THEME_COLORS.border.default} border overflow-hidden transition-all`}
            >
              <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 dark:bg-blue-500 rounded-full" />
                  <h2
                    className={`text-sm font-black ${THEME_COLORS.text.primary} uppercase tracking-widest`}
                  >
                    Aktivitas Saya
                  </h2>
                </div>
                <button
                  onClick={openModal}
                  className="group flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-all"
                >
                  Semua{" "}
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>

              <div className="space-y-1">
                {loadingMyActivity ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-4 p-3 ${THEME_COLORS.background.tableHeader} rounded-2xl animate-pulse`}
                    >
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-3/4" />
                        <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : errorMyActivity ? (
                  // Error state
                  <div
                    className={`text-center py-8 ${THEME_COLORS.text.muted}`}
                  >
                    <p className="text-sm">Gagal memuat aktivitas</p>
                    <button
                      onClick={fetchActivitiesMyActivity}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : recentData.length === 0 ? (
                  // Empty state
                  <div
                    className={`text-center py-8 ${THEME_COLORS.text.muted}`}
                  >
                    <p className="text-sm">Belum ada aktivitas</p>
                  </div>
                ) : (
                  recentData.map((act) => (
                    <div
                      key={act.id}
                      className={`flex items-center gap-4 p-3 ${THEME_COLORS.hover.item} rounded-2xl transition-all group`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all group-hover:rotate-6 ${getActivityStyle(act.activity_type)}`}
                      >
                        {act.activity_type === "login" ? (
                          <LogIn size={16} />
                        ) : (
                          <LogOut size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-bold ${THEME_COLORS.text.secondary} truncate`}
                        >
                          {act.description}
                        </p>
                        <div
                          className={`flex items-center gap-1 text-[9px] ${THEME_COLORS.text.muted} font-bold mt-1 uppercase`}
                        >
                          <Clock
                            size={10}
                            className="text-blue-400 dark:text-blue-500"
                          />{" "}
                          {act.time_ago}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AKTIVITAS GLOBAL (Kanan) */}
            {userData?.user?.role_id ===
              "219bc0dd-ec72-4618-b22d-5d5ff612dcaf" && (
              <div
                className={`${THEME_COLORS.background.card} rounded-xl ${THEME_COLORS.border.default} border shadow-sm flex flex-col gap-4`}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4">
                  <h2
                    className={`text-sm font-semibold ${THEME_COLORS.text.primary}`}
                  >
                    Aktivitas Terkini
                  </h2>

                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* List */}
                <div className={`divide-y ${THEME_COLORS.border.default}`}>
                  {loadingRecent ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-3 animate-pulse"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3" />
                            <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="w-16 h-3 bg-slate-200 dark:bg-slate-600 rounded" />
                      </div>
                    ))
                  ) : errorRecent ? (
                    // Error state
                    <div
                      className={`text-center py-8 px-4 ${THEME_COLORS.text.muted}`}
                    >
                      <p className="text-sm">Gagal memuat aktivitas terkini</p>
                      <button
                        onClick={fetchActivitiesRecent}
                        className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Coba lagi
                      </button>
                    </div>
                  ) : activitiesRecent.length === 0 ? (
                    // Empty state
                    <div
                      className={`text-center py-8 px-4 ${THEME_COLORS.text.muted}`}
                    >
                      <p className="text-sm">Belum ada aktivitas terkini</p>
                    </div>
                  ) : (
                    activitiesRecent.slice(0, 5).map((act) => {
                      const platform = getPlatformInfo(act.user_agent);

                      return (
                        <div
                          key={act.id}
                          onClick={() => openDetail(act)}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer ${THEME_COLORS.hover.item} transition-colors`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Icon */}
                            <div
                              className={`w-10 h-10 rounded-lg ${THEME_COLORS.background.tableHeader} flex items-center justify-center shrink-0`}
                            >
                              <User
                                size={18}
                                className={THEME_COLORS.text.muted}
                              />
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-medium ${THEME_COLORS.text.primary} truncate`}
                              >
                                {act.user.nama_lengkap}
                              </p>

                              <div
                                className={`flex items-center gap-2 text-xs ${THEME_COLORS.text.muted}`}
                              >
                                <span className="truncate">
                                  {act.description}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] ${platform.color}`}
                                >
                                  {platform.name}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Time */}
                          <div
                            className={`text-right text-xs ${THEME_COLORS.text.muted} whitespace-nowrap ml-3`}
                          >
                            {act.time_ago.replace(" yang lalu", "")}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 pb-4">
                  <button
                    onClick={openModal2}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium ${THEME_COLORS.text.muted} ${THEME_COLORS.hover.text} ${THEME_COLORS.hover.item} transition`}
                  >
                    Lihat Semua Log
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomSheet open={openSheet} onClose={() => setOpenSheet(false)}>
        <div className="mb-4">
          <h3 className={`font-bold text-lg ${THEME_COLORS.text.primary}`}>
            Semua Menu
          </h3>
          <p className={`text-xs ${THEME_COLORS.text.muted} mt-1`}>
            Pilih menu yang ingin Anda akses
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto pb-2">
          {menus
            .filter((menu) => menu.roles.includes(userData?.user?.role_id))
            .map((menu) => (
              <RippleButton
                key={menu.label}
                onClick={() => {
                  setOpenSheet(false);
                  menu.onClick();
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                  <img src={menu.icon} className="w-6 h-6" alt={menu.label} />
                </div>
                <span
                  className={`text-xs text-center ${THEME_COLORS.text.secondary}`}
                >
                  {menu.label}
                </span>
              </RippleButton>
            ))}
        </div>
      </BottomSheet>

      {/* MODAL BOTTOM SHEET WITH TRANSITION */}
      {shouldRender && (
        <div className="fixed inset-0 z-100 flex items-end justify-center overflow-hidden">
          {/* Backdrop (Fade Effect) */}
          <div
            className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${isModalOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeModal}
          />

          {/* Modal Content (Slide Up Effect) */}
          <div
            className={`relative ${THEME_COLORS.background.card} w-full max-w-lg rounded-t-2.5xl shadow-dark transform transition-transform duration-300 ease-out flex flex-col ${isModalOpen ? "translate-y-0" : "translate-y-full"}`}
          >
            {/* Handle Bar */}
            <div
              className="flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
              onClick={closeModal}
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors" />
            </div>

            <div
              className={`p-4 flex justify-between items-center ${THEME_COLORS.border.default} border-b`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Activity size={18} />
                </div>
                <h3
                  className={`text-lg font-black ${THEME_COLORS.text.primary} tracking-tight`}
                >
                  Riwayat Aktivitas
                </h3>
              </div>
              <button
                onClick={closeModal}
                className={`p-2 ${THEME_COLORS.hover.item} rounded-full transition-colors ${THEME_COLORS.text.muted}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scroll Area */}
            <div className="overflow-y-auto max-h-[65vh] p-4 scrollbar-hide">
              <div className="space-y-6">
                {activitiesMyActivity.map((act, idx) => (
                  <div key={act.id} className="flex gap-4 relative group">
                    {idx !== activitiesMyActivity.length - 1 && (
                      <div
                        className={`absolute left-4.75 top-10 -bottom-6 w-0.5 ${THEME_COLORS.background.tableHeader}`}
                      />
                    )}
                    <div
                      className={`z-10 w-10 h-10 rounded-full shrink-0 flex items-center justify-center border-4 ${THEME_COLORS.background.card} shadow-sm transition-transform group-hover:scale-110 ${getActivityStyle(act.activity_type)}`}
                    >
                      {act.activity_type === "login" ? (
                        <LogIn size={14} />
                      ) : (
                        <LogOut size={14} />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p
                        className={`text-[13px] font-bold ${THEME_COLORS.text.primary}`}
                      >
                        {act.description}
                      </p>
                      <div
                        className={`flex items-center gap-3 mt-1.5 text-[10px] ${THEME_COLORS.text.muted} font-medium`}
                      >
                        <span className="flex items-center gap-1 italic">
                          <Clock size={10} /> {act.time_ago}
                        </span>
                        <span>•</span>
                        <span
                          className={`font-mono ${THEME_COLORS.background.tableHeader} px-1.5 py-0.5 rounded uppercase tracking-tighter`}
                        >
                          {new Date(act.created_at).toLocaleTimeString(
                            "id-ID",
                            { hour: "2-digit", minute: "2-digit" },
                          )}{" "}
                          WIB
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Safe Area Padding (for Mobile) */}
            <div
              className={`p-4 ${THEME_COLORS.background.card} ${THEME_COLORS.border.default} border-t`}
            >
              <button
                onClick={closeModal}
                className={`w-full py-4 ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText} rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all`}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BOTTOM SHEET */}
      {shouldRender2 && (
        <div className="fixed inset-0 z-100 flex items-end justify-center">
          {/* Backdrop */}
          <div
            onClick={closeModal2}
            className={`absolute inset-0 bg-black/40 transition-opacity ${
              isModalOpen2 ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Sheet */}
          <div
            className={`relative w-full max-w-2xl ${THEME_COLORS.background.card} rounded-t-3xl shadow-xl transition-transform duration-300 ${isModalOpen2 ? "translate-y-0" : "translate-y-full"}`}
          >
            {/* Handle */}
            <div
              onClick={closeModal2}
              className="mx-auto my-3 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-600 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            />

            {/* Header */}
            <div
              className={`flex items-center justify-between px-5 pb-4 ${THEME_COLORS.border.default} border-b`}
            >
              <div>
                <h3
                  className={`text-lg font-semibold ${THEME_COLORS.text.primary}`}
                >
                  Global Activity
                </h3>
                <p className={`text-xs ${THEME_COLORS.text.muted}`}>
                  Log aktivitas sistem
                </p>
              </div>

              <button
                onClick={closeModal2}
                className={`p-2 rounded-full ${THEME_COLORS.hover.item} ${THEME_COLORS.text.muted} transition-colors`}
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[65vh] overflow-y-auto px-4 py-3 space-y-1">
              {activitiesRecent.map((act) => (
                <button
                  key={act.id}
                  onClick={() => openDetail(act)}
                  className={`w-full flex items-start justify-between gap-3 p-3 rounded-xl text-left ${THEME_COLORS.hover.item} transition`}
                >
                  {/* Left */}
                  <div className="flex gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg ${THEME_COLORS.background.tableHeader} flex items-center justify-center shrink-0`}
                    >
                      <Activity size={14} className={THEME_COLORS.text.muted} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${THEME_COLORS.text.primary} truncate`}
                      >
                        {act.user.nama_lengkap}
                      </p>
                      <p
                        className={`text-xs ${THEME_COLORS.text.muted} truncate`}
                      >
                        {act.description}
                      </p>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-medium ${THEME_COLORS.text.secondary} whitespace-nowrap`}
                    >
                      {act.time_ago.replace(" yang lalu", "")}
                    </p>
                    <p
                      className={`text-[10px] ${THEME_COLORS.text.muted} mt-0.5`}
                    >
                      {new Date(act.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {shouldRenderDetail && selectedAct && (
        <div className="fixed inset-0 z-100 flex items-end justify-center">
          {/* Backdrop */}
          <div
            onClick={closeDetail}
            className={`absolute inset-0 bg-black/40 transition-opacity ${
              isModalOpenDetail ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Sheet */}
          <div
            className={`relative w-full max-w-xl ${THEME_COLORS.background.card} rounded-t-3xl p-4 shadow-xl transition-transform duration-300 ${isModalOpenDetail ? "translate-y-0" : "translate-y-full"}`}
          >
            {/* Handle */}
            <div
              onClick={closeDetail}
              className="mx-auto mb-6 h-1.5 w-14 rounded-full bg-slate-200 dark:bg-slate-600 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className={`text-lg font-semibold ${THEME_COLORS.text.primary}`}
                >
                  {selectedAct.user.nama_lengkap}
                </h3>
                <p className={`text-xs ${THEME_COLORS.text.muted}`}>
                  ID #{selectedAct.id}
                </p>
              </div>

              <button
                onClick={closeDetail}
                className={`p-2 rounded-full ${THEME_COLORS.hover.item} ${THEME_COLORS.text.muted} transition-colors`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Info */}
            <div className="space-y-4 text-sm">
              <InfoRow label="Aktivitas" value={selectedAct.activity_type} />
              <InfoRow label="IP Address" value={selectedAct.ip_address} />
              <InfoRow label="Waktu" value={selectedAct.time_ago} />
              <InfoRow
                label="Device"
                value={getPlatformInfo(selectedAct.user_agent).name}
              />
            </div>

            {/* User Agent */}
            <div className="mt-6">
              <p className={`text-xs ${THEME_COLORS.text.muted} mb-2`}>
                User Agent
              </p>
              <div
                className={`${THEME_COLORS.background.tableHeader} p-3 rounded-xl text-xs font-mono ${THEME_COLORS.text.muted} break-all`}
              >
                {selectedAct.user_agent}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={closeDetail}
              className={`w-full mt-8 py-4 ${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText} rounded-2xl text-sm font-semibold active:scale-95 transition-all`}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BerandaPage;
