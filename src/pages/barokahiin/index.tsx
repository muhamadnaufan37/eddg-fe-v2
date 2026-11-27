import { useEffect, useState, type ComponentType } from "react";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Database,
  HeartHandshake,
  KeyRound,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings2,
  ShieldCheck,
  Store,
  Ticket,
  Users,
  Wallet,
  Wifi,
  WifiOff,
} from "lucide-react";
import { getRoleName } from "@/constants/roles";
import useAuth from "@/hooks/useAuth";
import "./components/ui/barokahiin.css";

import CoordinatorDashboard, {
  type CoordinatorTab,
} from "./coordinator/CoordinatorDashboard";
import CoordinatorStore from "./coordinator/CoordinatorStore";
import CoordinatorDonors from "./coordinator/CoordinatorDonors";
import CoordinatorItems from "./coordinator/CoordinatorItems";
import CoordinatorOrders from "./coordinator/CoordinatorOrders";
import CoordinatorWallet from "./coordinator/CoordinatorWallet";
import CoordinatorCharity from "./coordinator/CoordinatorCharity";
import CoordinatorGuide from "./coordinator/CoordinatorGuide";

import AdminDashboard, { type AdminTab } from "./admin/AdminDashboard";
import AdminReviewQueue from "./admin/AdminReviewQueue";
import AdminCoordinatorsStores from "./admin/AdminCoordinatorsStores";
import AdminFinanceDisputes from "./admin/AdminFinanceDisputes";
import AdminCharity from "./admin/AdminCharity";
import AdminConfigAndAudit from "./admin/AdminConfigAndAudit";
import AdminMasterData from "./admin/AdminMasterData";
import AdminVouchers from "./admin/AdminVouchers";
import Security2FAPanel from "./components/Security2FAPanel";

type WorkspaceMode = "coordinator" | "admin";

interface NavItem<T extends string> {
  id: T;
  label: string;
  shortLabel: string;
  group: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
}

const COORDINATOR_NAV: NavItem<CoordinatorTab>[] = [
  {
    id: "dashboard",
    label: "Dasbor",
    shortLabel: "Dasbor",
    group: "Operasional",
    subtitle: "Ringkasan tugas harian, pesanan SLA, dan status toko Anda.",
    icon: LayoutDashboard,
  },
  {
    id: "items",
    label: "Barang dan SOP",
    shortLabel: "Barang",
    group: "Operasional",
    subtitle: "Catat barang donasi, isi checklist SOP kamera-first, dan cetak label QR.",
    icon: Package,
  },
  {
    id: "orders",
    label: "Pesanan dan Komplain",
    shortLabel: "Pesanan",
    group: "Operasional",
    subtitle: "Siapkan pesanan dalam 48 jam, verifikasi kode ambil, atau kirim kurir.",
    icon: ClipboardList,
  },
  {
    id: "donors",
    label: "Donatur",
    shortLabel: "Donatur",
    group: "Operasional",
    subtitle: "Catat donatur wilayah serta persetujuan jual dan publikasi media.",
    icon: Users,
  },
  {
    id: "store",
    label: "Toko saya",
    shortLabel: "Toko",
    group: "Toko dan Keuangan",
    subtitle: "Kelola profil toko, verifikasi alamat V1–V8, jeda cuti, dan Skor Toko.",
    icon: Store,
  },
  {
    id: "wallet",
    label: "Dompet dan Penarikan",
    shortLabel: "Dompet",
    group: "Toko dan Keuangan",
    subtitle: "Pantau saldo Tertunda/Tersedia, atur alokasi Charity, dan tarik saldo.",
    icon: Wallet,
  },
  {
    id: "charity",
    label: "Program Charity",
    shortLabel: "Charity",
    group: "Toko dan Keuangan",
    subtitle: "Ajukan program sosial, pencairan Dompet Program, dan laporan penggunaan dana.",
    icon: HeartHandshake,
  },
  {
    id: "guide",
    label: "Panduan dan Aturan",
    shortLabel: "Panduan",
    group: "Rujukan",
    subtitle: "Standar SLA, Level 1–3, Grade A/B/C, V1–V8, dan 10 butir Kode Etik.",
    icon: BookOpen,
  },
  {
    id: "security",
    label: "Keamanan 2FA",
    shortLabel: "2FA",
    group: "Rujukan",
    subtitle: "Aktifkan autentikasi dua faktor (TOTP) dan kelola kode pemulihan akun.",
    icon: KeyRound,
  },
];

const ADMIN_NAV: NavItem<AdminTab>[] = [
  {
    id: "dashboard",
    label: "Dasbor Admin",
    shortLabel: "Dasbor",
    group: "Pengawasan",
    subtitle: "Antrean review, verifikasi alamat, komplain, penarikan, dan status ledger.",
    icon: LayoutDashboard,
  },
  {
    id: "review",
    label: "Antrean Review",
    shortLabel: "Review",
    group: "Pengawasan",
    subtitle: "Tinjau media bukti & hasil SOP berdampingan serta audit sampling.",
    icon: ClipboardCheck,
  },
  {
    id: "coordinators",
    label: "Koordinator dan Toko",
    shortLabel: "Toko",
    group: "Pengawasan",
    subtitle: "Verifikasi alamat toko V1–V8, moderasi toko, level, dan sanksi koordinator.",
    icon: Store,
  },
  {
    id: "vouchers",
    label: "Voucher Promo",
    shortLabel: "Voucher",
    group: "Keuangan dan Charity",
    subtitle: "Buat dan kelola voucher potongan tetap, persentase, atau gratis ongkir.",
    icon: Ticket,
  },
  {
    id: "finance",
    label: "Keuangan dan Komplain",
    shortLabel: "Keuangan",
    group: "Keuangan dan Charity",
    subtitle: "Proses penarikan, rekonsiliasi & koreksi ledger, serta putusan komplain.",
    icon: Wallet,
  },
  {
    id: "charity",
    label: "Charity dan Pool",
    shortLabel: "Charity",
    group: "Keuangan dan Charity",
    subtitle: "Setujui program Charity, alokasi Dana Kegiatan wilayah, dan pencairan.",
    icon: HeartHandshake,
  },
  {
    id: "master",
    label: "Master Data",
    shortLabel: "Master",
    group: "Pengaturan",
    subtitle: "Kelola kategori, template & butir SOP kurasi, panduan harga, dan tabel ongkir.",
    icon: Database,
  },
  {
    id: "config",
    label: "Konfigurasi dan Audit",
    shortLabel: "Sistem",
    group: "Pengaturan",
    subtitle: "Skema bagi hasil 5 bagian, parameter sistem, halaman statis, dan audit log.",
    icon: Settings2,
  },
  {
    id: "security",
    label: "Keamanan 2FA",
    shortLabel: "2FA",
    group: "Pengaturan",
    subtitle: "Aktifkan autentikasi dua faktor (TOTP) dan kelola kode pemulihan akun.",
    icon: KeyRound,
  },
];

export default function BarokahiinConsolePage() {
  const { user } = useAuth();
  const roleName = getRoleName(user?.role_id);
  // Strict role separation per BAROKAHIIN_FRONTEND_CONSOLE.md:
  // Admin -> /admin/* only (never calls /console/*), Koordinator -> /console/* only
  const mode: WorkspaceMode = roleName === "admin" ? "admin" : "coordinator";

  const [coordTab, setCoordTab] = useState<CoordinatorTab>("dashboard");
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const activeNavList = mode === "coordinator" ? COORDINATOR_NAV : ADMIN_NAV;
  const activeTabId = mode === "coordinator" ? coordTab : adminTab;
  const activeNavMeta =
    activeNavList.find((n) => n.id === activeTabId) ?? activeNavList[0];

  const groupedNav = activeNavList.reduce<
    Array<{ group: string; items: typeof activeNavList }>
  >((acc, item) => {
    const found = acc.find((g) => g.group === item.group);
    if (found) {
      found.items.push(item as never);
    } else {
      acc.push({ group: item.group, items: [item] as typeof activeNavList });
    }
    return acc;
  }, []);

  const primaryMobileTabs = activeNavList.slice(0, 4);
  const extraMobileTabs = activeNavList.slice(4);

  const selectTab = (id: string) => {
    if (mode === "coordinator") {
      setCoordTab(id as CoordinatorTab);
    } else {
      setAdminTab(id as AdminTab);
    }
    setMobileMoreOpen(false);
  };

  return (
    <div className="barokahiin-console min-h-[calc(100dvh-64px)] rounded-2xl border" style={{ borderColor: "var(--garis)" }}>
      <div className="flex min-h-[calc(100dvh-64px)] w-full">
        {/* Desktop Collapsible Sidebar (>= 1280px so it never cramps alongside outer app sidebar) */}
        <aside
          aria-label="Navigasi samping Barokahiin"
          className={`hidden shrink-0 flex-col border-r transition-all xl:flex ${
            sidebarCollapsed ? "w-20" : "w-60"
          }`}
          style={{
            backgroundColor: "var(--putih)",
            borderColor: "var(--garis)",
          }}
        >
          {/* Brand + Collapse button */}
          <div
            className="flex items-center justify-between gap-2 border-b px-4 py-4"
            style={{ borderColor: "var(--garis)" }}
          >
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="brk-display truncate text-lg font-bold" style={{ color: "var(--indigo)" }}>
                  Barokahiin
                </p>
                <p className="truncate text-xs" style={{ color: "var(--muted-brk)" }}>
                  {mode === "admin" ? "Konsol Admin" : "Konsol Koordinator"}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={sidebarCollapsed ? "Perluas menu" : "Ciutkan menu"}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border"
              style={{ borderColor: "var(--garis)", color: "var(--tinta)" }}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="size-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Primary CTA for Coordinator */}
          {mode === "coordinator" && (
            <div className="p-3">
              <button
                type="button"
                className="brk-btn brk-btn-primary w-full px-3"
                onClick={() => setCoordTab("items")}
                title="Tambah barang kurasi"
              >
                <Plus className="size-4 shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && <span>Tambah barang</span>}
              </button>
            </div>
          )}

          {/* Grouped navigation */}
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
            {groupedNav.map(({ group, items }) => (
              <div key={group}>
                {!sidebarCollapsed && (
                  <p
                    className="mb-1.5 px-2.5 text-xs font-semibold"
                    style={{ color: "var(--muted-brk)" }}
                  >
                    {group}
                  </p>
                )}
                <ul className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTabId === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          aria-current={active ? "page" : undefined}
                          title={sidebarCollapsed ? item.label : undefined}
                          onClick={() => selectTab(item.id)}
                          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-semibold transition-colors ${
                            sidebarCollapsed ? "justify-center" : "text-left"
                          }`}
                          style={{
                            backgroundColor: active
                              ? "var(--indigo-muda)"
                              : "transparent",
                            color: active ? "var(--indigo)" : "var(--tinta)",
                          }}
                        >
                          <Icon className="size-5 shrink-0" aria-hidden="true" />
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Bottom connection indicator */}
          <div
            className="border-t px-4 py-3 text-xs font-medium"
            style={{
              borderColor: "var(--garis)",
              color: isOnline ? "var(--daun-tua)" : "var(--peringatan-teks)",
            }}
          >
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <WifiOff className="size-4 shrink-0" aria-hidden="true" />
              )}
              {!sidebarCollapsed && (
                <span>{isOnline ? "Koneksi aktif" : "Mode offline"}</span>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Utility Header */}
          <header
            className="border-b px-4 py-4 sm:px-6"
            style={{
              backgroundColor: "var(--putih)",
              borderColor: "var(--garis)",
            }}
          >
            <div className="mx-auto flex w-full max-w-310 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--indigo-muda)",
                      color: "var(--indigo)",
                    }}
                  >
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    <span>
                      {mode === "admin"
                        ? "Mode Admin"
                        : "Mode Koordinator Wilayah"}
                    </span>
                  </span>
                  {!isOnline && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--kunyit-muda)",
                        color: "var(--peringatan-teks)",
                      }}
                    >
                      <WifiOff className="size-3.5" aria-hidden="true" />
                      <span>Offline</span>
                    </span>
                  )}
                </div>
                <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
                  {activeNavMeta.label}
                </h1>
                <p
                  className="mt-0.5 max-w-[68ch] text-sm"
                  style={{ color: "var(--muted-brk)" }}
                >
                  {activeNavMeta.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {mode === "coordinator" && (
                  <button
                    type="button"
                    className="brk-btn brk-btn-primary xl:hidden"
                    onClick={() => setCoordTab("items")}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    <span>Tambah barang</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tablet & Laptop horizontal nav (768px - 1279px) */}
            <nav
              aria-label="Navigasi tablet Barokahiin"
              className="mx-auto mt-3 hidden max-w-310 gap-1.5 overflow-x-auto pb-1 md:flex xl:hidden"
            >
              {activeNavList.map((item) => {
                const Icon = item.icon;
                const active = activeTabId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => selectTab(item.id)}
                    className="brk-btn shrink-0 px-3 text-sm"
                    style={{
                      backgroundColor: active
                        ? "var(--indigo-btn)"
                        : "var(--kertas)",
                      color: active ? "#ffffff" : "var(--tinta)",
                      borderColor: active ? "var(--indigo-btn)" : "var(--garis)",
                    }}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          </header>

          {/* Active Page Content */}
          <main className="mx-auto w-full max-w-310 flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8">
            {mode === "coordinator" ? (
              <>
                {coordTab === "dashboard" && (
                  <CoordinatorDashboard onNavigate={setCoordTab} />
                )}
                {coordTab === "store" && <CoordinatorStore />}
                {coordTab === "donors" && <CoordinatorDonors />}
                {coordTab === "items" && (
                  <CoordinatorItems onGoToStore={() => setCoordTab("store")} />
                )}
                {coordTab === "orders" && <CoordinatorOrders />}
                {coordTab === "wallet" && <CoordinatorWallet />}
                {coordTab === "charity" && <CoordinatorCharity />}
                {coordTab === "guide" && <CoordinatorGuide />}
                {coordTab === "security" && <Security2FAPanel />}
              </>
            ) : (
              <>
                {adminTab === "dashboard" && (
                  <AdminDashboard onNavigate={setAdminTab} />
                )}
                {adminTab === "review" && <AdminReviewQueue />}
                {adminTab === "coordinators" && <AdminCoordinatorsStores />}
                {adminTab === "vouchers" && <AdminVouchers />}
                {adminTab === "finance" && <AdminFinanceDisputes />}
                {adminTab === "charity" && <AdminCharity />}
                {adminTab === "master" && <AdminMasterData />}
                {adminTab === "config" && <AdminConfigAndAudit />}
                {adminTab === "security" && <Security2FAPanel />}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Sheet for "Lainnya" */}
      {mobileMoreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu lainnya"
          className="fixed inset-0 z-40 flex items-end bg-black/40 md:hidden"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            className="brk-float brk-safe-bottom w-full rounded-t-4xl border-t p-4"
            style={{
              backgroundColor: "var(--putih)",
              borderColor: "var(--garis)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-sm font-bold">Menu lainnya</p>
            <div className="grid grid-cols-2 gap-2">
              {extraMobileTabs.map((item) => {
                const Icon = item.icon;
                const active = activeTabId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="brk-btn justify-start text-sm"
                    style={{
                      backgroundColor: active
                        ? "var(--indigo-muda)"
                        : "var(--kertas)",
                      color: active ? "var(--indigo)" : "var(--tinta)",
                      borderColor: active ? "var(--indigo)" : "var(--garis)",
                    }}
                    onClick={() => selectTab(item.id)}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Tab Bar (< 768px) */}
      <nav
        aria-label="Navigasi bawah Barokahiin"
        className="brk-float brk-safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t px-1 pt-1 md:hidden"
        style={{
          backgroundColor: "var(--putih)",
          borderColor: "var(--garis)",
        }}
      >
        {primaryMobileTabs.map((item) => {
          const Icon = item.icon;
          const active = activeTabId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold"
              style={{
                color: active ? "var(--indigo)" : "var(--muted-brk)",
                backgroundColor: active ? "var(--indigo-muda)" : "transparent",
              }}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="truncate">{item.shortLabel}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileMoreOpen((prev) => !prev)}
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold"
          style={{
            color: mobileMoreOpen ? "var(--indigo)" : "var(--muted-brk)",
            backgroundColor: mobileMoreOpen
              ? "var(--indigo-muda)"
              : "transparent",
          }}
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
          <span>Lainnya</span>
        </button>
      </nav>
    </div>
  );
}
