import FilterDropdown from "@/components/features/FilterDropdown";
import { Input } from "@/components/global";
import type { SensusFilterPanelProps } from "@/pages/digital-data/sensus/types/types";
import { Check } from "lucide-react";

const FilterPillGroup = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string | number }[];
  value: any;
  onChange: (val: any) => void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <span className="text-xs font-medium text-gray-500 w-24 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
            !value
              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 shadow-sm"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-750"
          }`}
        >
          Semua
        </button>
        {options?.map((opt, idx) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                isSelected
                  ? "bg-blue-500 border-blue-500 text-white shadow-sm dark:bg-blue-600 dark:border-blue-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-750"
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SensusFilterPanel = ({
  rangeUmurMin,
  rangeUmurMax,
  setRangeUmurMin,
  setRangeUmurMax,
  fetchDataDaerah,
  balikanDataDesa,
  balikanDataKelompok,
  filterDaerah,
  filterDesa,
  filterKelompok,
  setFilterDaerah,
  setFilterDesa,
  setFilterKelompok,
  fetchDesa,
  fetchKelompok,
  setBalikanDataDesa,
  setBalikanDataKelompok,
  statusSambung,
  statusPernikahan,
  statusAtletAsad,
  statusGender,
  resultJenisData,
  setStatusSambung,
  setStatusPernikahan,
  setStatusAtletAsad,
  setStatusGender,
  setResultJenisData,
  statusFilterInfoSambung,
  statusFilterInfoPernikahan,
  statusFilterInfoAtletAsad,
  statusFilterInfoGender,
  statusFilterJenisData,
  dataLogin,
}: SensusFilterPanelProps) => {
  return (
    <div className="flex flex-col gap-6 p-1">
      {/* SECTION: Demografi */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">
          Demografi (Umur)
        </label>
        <div className="flex items-center gap-3">
          <div className="w-full">
            <Input
              value={rangeUmurMin}
              className="w-full text-sm"
              placeholder="Minimal (Cth: 15)"
              onChange={(e) => setRangeUmurMin(e.target.value)}
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="w-full">
            <Input
              value={rangeUmurMax}
              className="w-full text-sm"
              placeholder="Maksimal (Cth: 30)"
              onChange={(e) => setRangeUmurMax(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-gray-100 dark:bg-gray-800" />

      {/* SECTION: Lokasi */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">
          Area / Lokasi
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FilterDropdown
            options={fetchDataDaerah}
            value={filterDaerah}
            placeholder="Pilih Daerah..."
            onChange={async (value: any) => {
              setFilterDaerah(value || "");
              setBalikanDataDesa([]);
              setBalikanDataKelompok([]);
              setFilterDesa("");
              setFilterKelompok("");
              if (value) {
                await fetchDesa(value);
              }
            }}
            disabled={dataLogin?.user?.akses_daerah !== null}
          />
          <FilterDropdown
            options={balikanDataDesa}
            value={filterDesa}
            placeholder="Pilih Desa..."
            onChange={async (value: any) => {
              setFilterDesa(value || "");
              setFilterKelompok("");
              setBalikanDataKelompok([]);
              if (value) {
                await fetchKelompok(value);
              }
            }}
            disabled={dataLogin?.user?.akses_desa !== null}
          />
          <FilterDropdown
            options={balikanDataKelompok}
            value={filterKelompok}
            placeholder="Pilih Kelompok..."
            onChange={(value: any) => setFilterKelompok(value || "")}
            disabled={dataLogin?.user?.akses_kelompok !== null}
          />
        </div>
      </div>

      <div className="h-px w-full bg-gray-100 dark:bg-gray-800" />

      {/* SECTION: Status & Kategori */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">
          Status & Kategori
        </label>
        <div className="flex flex-col gap-5">
          {/* Status Gender */}
          <FilterPillGroup
            label="Gender"
            options={statusFilterInfoGender}
            value={statusGender}
            onChange={setStatusGender}
          />

          {/* Status Pernikahan */}
          <FilterPillGroup
            label="Pernikahan"
            options={statusFilterInfoPernikahan}
            value={statusPernikahan}
            onChange={setStatusPernikahan}
          />

          {/* Status Sambung */}
          <FilterPillGroup
            label="Sambung"
            options={statusFilterInfoSambung}
            value={statusSambung}
            onChange={setStatusSambung}
          />

          {/* Status Atlet */}
          <FilterPillGroup
            label="Atlet"
            options={statusFilterInfoAtletAsad}
            value={statusAtletAsad}
            onChange={setStatusAtletAsad}
          />

          {dataLogin?.user?.role_id ===
            "219bc0dd-ec72-4618-b22d-5d5ff612dcaf" && (
            <FilterPillGroup
              label="Jenis Data"
              options={statusFilterJenisData}
              value={resultJenisData}
              onChange={setResultJenisData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SensusFilterPanel;
