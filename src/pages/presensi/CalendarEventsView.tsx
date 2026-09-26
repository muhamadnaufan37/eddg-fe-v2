import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import type { PresensiKegiatanItem } from "@/services/presensiKegiatanService";

export type PresensiEventAction = "presensi" | "detail" | "edit" | "delete";

interface CalendarEventsViewProps {
  events: PresensiKegiatanItem[];
  isFetching: boolean;
  isLoadingDetail: boolean;
  isSubmitting: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onReset: () => void;
  onCreate: () => void;
  onAction: (event: PresensiKegiatanItem, action: PresensiEventAction) => void;
}

const getEventDate = (value?: string | null) => {
  if (!value) return null;
  const date = parseISO(value.slice(0, 10));
  return isValid(date) ? date : null;
};

const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function CalendarEventsView({
  events,
  isFetching,
  isLoadingDetail,
  isSubmitting,
  search,
  onSearchChange,
  onRefresh,
  onReset,
  onCreate,
  onAction,
}: CalendarEventsViewProps) {
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 }),
      }),
    [calendarMonth],
  );
  const eventsByDay = useMemo(() => {
    const groupedEvents = new Map<string, PresensiKegiatanItem[]>();

    events.forEach((event) => {
      const eventDate = getEventDate(event.tgl_kegiatan);
      if (!eventDate) return;

      const key = format(eventDate, "yyyy-MM-dd");
      groupedEvents.set(key, [...(groupedEvents.get(key) || []), event]);
    });

    return groupedEvents;
  }, [events]);
  const monthEvents = useMemo(
    () =>
      events.filter((event) => {
        const eventDate = getEventDate(event.tgl_kegiatan);
        return eventDate ? isSameMonth(eventDate, calendarMonth) : false;
      }),
    [calendarMonth, events],
  );
  const selectedEvents =
    eventsByDay.get(format(selectedDate, "yyyy-MM-dd")) || [];
  const activeDays = new Set(
    monthEvents
      .map((event) => getEventDate(event.tgl_kegiatan))
      .filter((eventDate): eventDate is Date => Boolean(eventDate))
      .map((eventDate) => format(eventDate, "yyyy-MM-dd")),
  ).size;
  const monthAttendance = monthEvents.reduce(
    (total, event) => total + (event.total_presensi || 0),
    0,
  );

  const changeMonth = (amount: number) => {
    const nextMonth = addMonths(calendarMonth, amount);
    setCalendarMonth(nextMonth);
    setSelectedDate(nextMonth);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    if (!isSameMonth(date, calendarMonth)) {
      setCalendarMonth(startOfMonth(date));
    }
  };

  return (
    <main className="space-y-4 pb-5 text-zinc-900 dark:text-zinc-100">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 sm:flex-row sm:items-center sm:p-5 dark:border-emerald-900 dark:bg-[#173b32] dark:text-white">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-emerald-200 text-emerald-950 dark:bg-lime-300 dark:text-[#173b32]">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-lime-200">
              Presensi / Kalender
            </p>
            <h1 className="truncate text-xl font-bold sm:text-2xl">
              Agenda kegiatan
            </h1>
            <p className="mt-0.5 text-xs text-emerald-900/75 sm:text-sm dark:text-white/70">
              Jadwal kegiatan dan kehadiran peserta
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={isFetching || isSubmitting}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 sm:shrink-0 dark:bg-lime-300 dark:text-[#173b32] dark:hover:bg-lime-200"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah kegiatan
        </button>
      </header>

      <section
        aria-label="Ringkasan kegiatan bulan ini"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        <div className="flex min-w-0 items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-lime-100 text-emerald-900 dark:bg-lime-950 dark:text-lime-300">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              Kegiatan bulan ini
            </p>
            <p className="text-lg font-bold leading-6">{monthEvents.length}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300">
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              Total presensi
            </p>
            <p className="text-lg font-bold leading-6">{monthAttendance}</p>
          </div>
        </div>
        <div className="col-span-2 flex min-w-0 items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:col-span-1">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              Hari dengan agenda
            </p>
            <p className="text-lg font-bold leading-6">{activeDays}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:p-2.5">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Cari nama atau kode kegiatan</span>
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onRefresh()}
            placeholder="Cari nama atau kode kegiatan"
            className="h-10 w-full rounded border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-lime-400"
          />
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={!search || isFetching}
            className="min-h-10 flex-1 rounded border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:flex-none"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            title="Muat ulang kegiatan"
            aria-label="Muat ulang kegiatan"
            className="grid h-10 w-10 shrink-0 place-items-center rounded border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      {(isLoadingDetail || isSubmitting) && (
        <div
          role="status"
          className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
          {isSubmitting ? "Menyimpan kegiatan..." : "Memuat detail kegiatan..."}
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
        <section className="min-w-0 overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-3 py-3 dark:border-zinc-800 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                title="Bulan sebelumnya"
                aria-label="Bulan sebelumnya"
                className="grid h-9 w-9 shrink-0 place-items-center rounded border border-zinc-200 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                title="Bulan berikutnya"
                aria-label="Bulan berikutnya"
                className="grid h-9 w-9 shrink-0 place-items-center rounded border border-zinc-200 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="min-w-0 pl-1">
                <h2 className="truncate text-base font-bold capitalize sm:text-lg">
                  {format(calendarMonth, "MMMM yyyy", { locale: id })}
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {monthEvents.length} agenda ditampilkan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="min-h-9 rounded border border-emerald-800 px-3 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-50 dark:border-lime-400 dark:text-lime-300 dark:hover:bg-lime-950"
            >
              Hari ini
            </button>
          </div>

          <div className="grid grid-cols-7 border-l border-zinc-200 dark:border-zinc-800">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="border-b border-r border-zinc-200 bg-zinc-50 py-2 text-center text-[10px] font-bold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 sm:text-xs"
              >
                {label}
              </div>
            ))}
            {calendarDays.map((day) => {
              const dayEvents =
                eventsByDay.get(format(day, "yyyy-MM-dd")) || [];
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, calendarMonth);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${format(day, "EEEE d MMMM", { locale: id })}, ${dayEvents.length} kegiatan`}
                  onClick={() => selectDate(day)}
                  className={`min-h-[64px] min-w-0 border-b border-r border-zinc-200 p-1.5 text-left align-top transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 dark:border-zinc-800 sm:min-h-[108px] sm:p-2 ${
                    isSelected
                      ? "bg-lime-50 dark:bg-lime-950/40"
                      : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/70"
                  } ${!isCurrentMonth ? "text-zinc-400 dark:text-zinc-600" : ""}`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 ${
                      isSelected
                        ? "bg-[#173b32] text-white"
                        : isToday(day)
                          ? "border border-emerald-700 text-emerald-800 dark:border-lime-400 dark:text-lime-300"
                          : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <span className="mt-1 hidden space-y-1 sm:block">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        className="flex min-w-0 items-center gap-1 rounded-sm bg-emerald-100 px-1 py-0.5 text-[10px] leading-4 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700 dark:bg-lime-400" />
                        <span className="truncate">{event.nama_kegiatan}</span>
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="block truncate pl-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                        +{dayEvents.length - 2} lainnya
                      </span>
                    )}
                  </span>
                  {dayEvents.length > 0 && (
                    <span
                      className="mt-1 flex gap-1 sm:hidden"
                      aria-hidden="true"
                    >
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className="h-1.5 w-1.5 rounded-full bg-emerald-700 dark:bg-lime-400"
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="min-w-0 rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-lime-300">
                Agenda terpilih
              </p>
              <h2 className="mt-1 truncate text-base font-bold capitalize">
                {format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
              </h2>
            </div>
            <span className="shrink-0 rounded bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {selectedEvents.length}
            </span>
          </div>

          {selectedEvents.length > 0 ? (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 xl:max-h-[680px] xl:overflow-y-auto">
              {selectedEvents.map((event) => (
                <article key={event.id} className="p-3.5 sm:p-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="mt-1 h-9 w-1 shrink-0 rounded-full bg-lime-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="min-w-0 flex-1 text-sm font-bold leading-5">
                          {event.nama_kegiatan}
                        </h3>
                        <span className="rounded-sm bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-orange-900 dark:bg-orange-950 dark:text-orange-300">
                          {event.category || event.type_kegiatan || "Kegiatan"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {event.kode_kegiatan}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                          {event.jam_kegiatan?.slice(0, 5) || "--:--"}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <MapPin
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            {event.tmpt_kegiatan ||
                              event.nm_kelompok ||
                              event.nm_desa ||
                              event.nm_daerah ||
                              "Lokasi belum diisi"}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {event.total_presensi || 0} peserta tercatat
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAction(event, "presensi")}
                          title="Buka presensi peserta"
                          aria-label={`Buka presensi peserta: ${event.nama_kegiatan}`}
                          className="grid h-8 w-8 place-items-center rounded border border-emerald-800 text-emerald-900 transition hover:bg-emerald-50 dark:border-lime-400 dark:text-lime-300 dark:hover:bg-lime-950"
                        >
                          <Users className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onAction(event, "detail")}
                          title="Detail kegiatan"
                          aria-label={`Detail kegiatan: ${event.nama_kegiatan}`}
                          className="grid h-8 w-8 place-items-center rounded border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onAction(event, "edit")}
                          title="Ubah kegiatan"
                          aria-label={`Ubah kegiatan: ${event.nama_kegiatan}`}
                          className="grid h-8 w-8 place-items-center rounded border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onAction(event, "delete")}
                          title="Hapus kegiatan"
                          aria-label={`Hapus kegiatan: ${event.nama_kegiatan}`}
                          className="grid h-8 w-8 place-items-center rounded border border-rose-200 text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center px-5 py-8 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold">Belum ada kegiatan</p>
              <p className="mt-1 max-w-56 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Pilih tanggal lain atau tambahkan kegiatan baru untuk mengisi
                kalender.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
