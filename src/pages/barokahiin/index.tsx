import { useState } from "react";
import {
  BadgeCheck,
  ClipboardList,
  FileClock,
  HandCoins,
  LayoutDashboard,
  PackageSearch,
  Settings2,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Dashboard from "./components/Dashboard";
import DonorsAndCategories from "./components/DonorsAndCategories";
import ItemsManagement from "./components/ItemsManagement";
import OrdersAndFinance from "./components/OrdersAndFinance";
import ContentAndSettings from "./components/ContentAndSettings";
import AuditLogs from "./components/AuditLogs";

type AdminSection =
  | "overview"
  | "people"
  | "items"
  | "orders"
  | "content"
  | "audit";

const sections: {
  id: AdminSection;
  title: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "overview", title: "Ringkasan", icon: LayoutDashboard },
  { id: "people", title: "Donatur & Kategori", icon: UsersRound },
  { id: "items", title: "Barang & Kurasi", icon: PackageSearch },
  { id: "orders", title: "Permintaan & Keuangan", icon: HandCoins },
  { id: "content", title: "Kegiatan & Pengaturan", icon: Settings2 },
  { id: "audit", title: "Audit Log", icon: FileClock },
];

export default function BarokahiinAdminPage() {
  const [activeSection, setActiveSection] =
    useState<AdminSection>("overview");

  return (
    <main className="mx-auto w-full max-w-360 space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <header className="relative isolate overflow-hidden rounded-[1.75rem] bg-linear-to-br from-emerald-50 via-white to-teal-100 px-5 py-6 text-emerald-950 shadow-lg shadow-emerald-950/5 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-900 dark:text-white dark:shadow-slate-950/10 sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-20 size-64 rounded-full border-28 border-emerald-900/6 dark:border-white/5"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-emerald-800/10 bg-white/70 dark:border-white/15 dark:bg-white/10">
              <BadgeCheck className="size-5 text-emerald-700 dark:text-emerald-200" />
            </div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Pusat pengelolaan donasi barang
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Barokahiin Admin
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-200 sm:text-base">
              Kelola donatur, kurasi barang, proses permintaan, dan pantau
              transparansi penyaluran dalam satu dashboard.
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-emerald-900/10 bg-white/70 px-3.5 py-3 text-xs leading-5 text-emerald-900 dark:border-emerald-200/15 dark:bg-emerald-100/10 dark:text-emerald-50 sm:max-w-64">
            <UsersRound className="mt-0.5 size-4 shrink-0" />
            Data kontak dan catatan internal hanya tampil untuk admin berwenang.
          </div>
        </div>
      </header>

      <nav
        aria-label="Navigasi administrasi Barokahiin"
        className="flex gap-1.5 overflow-x-auto rounded-2xl border border-border/70 bg-card p-1.5 shadow-sm"
      >
        {sections.map(({ id, title, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            variant={activeSection === id ? "default" : "ghost"}
            aria-pressed={activeSection === id}
            onClick={() => setActiveSection(id)}
            className={`h-10 shrink-0 rounded-xl px-3 text-sm sm:px-4 ${
              activeSection === id
                ? "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {title}
          </Button>
        ))}
      </nav>

      {activeSection === "overview" && <Dashboard />}
      {activeSection === "people" && <DonorsAndCategories />}
      {activeSection === "items" && <ItemsManagement />}
      {activeSection === "orders" && <OrdersAndFinance />}
      {activeSection === "content" && <ContentAndSettings />}
      {activeSection === "audit" && <AuditLogs />}

      <footer className="flex items-start gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3 text-xs leading-5 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-100">
        <ClipboardList className="mt-0.5 size-4 shrink-0" />
        Perubahan pada data admin tercatat pada audit log. Periksa kembali
        detail sebelum mengonfirmasi pembayaran, koreksi penjualan, atau
        menganonimkan donatur.
      </footer>
    </main>
  );
}
