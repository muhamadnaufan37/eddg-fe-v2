import FilterDropdown from "@/components/features/FilterDropdown";
import { Input } from "@/components/global";
import type { SensusFilterPanelProps } from "@/pages/digital-data/sensus/types/types";

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={rangeUmurMin}
            className="w-full p-inputtext-sm text-xs"
            placeholder="Umur min"
            onChange={(e) => setRangeUmurMin(e.target.value)}
          />
          <Input
            value={rangeUmurMax}
            className="w-full p-inputtext-sm text-xs"
            placeholder="Umur max"
            onChange={(e) => setRangeUmurMax(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <FilterDropdown
          options={fetchDataDaerah}
          value={filterDaerah}
          placeholder="Daerah"
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
          placeholder="Desa"
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
          placeholder="Kelompok"
          onChange={(value: any) => setFilterKelompok(value || "")}
          disabled={dataLogin?.user?.akses_kelompok !== null}
        />
      </div>

      {/* STATUS FILTER */}
      <div className="grid grid-cols-2 gap-2">
        <FilterDropdown
          options={statusFilterInfoSambung}
          value={statusSambung}
          placeholder="Status Sambung"
          onChange={(value: any) => setStatusSambung(value || "")}
        />
        <FilterDropdown
          options={statusFilterInfoPernikahan}
          value={statusPernikahan}
          placeholder="Status Pernikahan"
          onChange={(value: any) => setStatusPernikahan(value || "")}
        />
        <FilterDropdown
          options={statusFilterInfoAtletAsad}
          value={statusAtletAsad}
          placeholder="Status Atlet"
          onChange={(value: any) => setStatusAtletAsad(value || "")}
        />
        <FilterDropdown
          options={statusFilterInfoGender}
          value={statusGender}
          placeholder="Status Gender"
          onChange={(value: any) => setStatusGender(value || "")}
        />

        {dataLogin?.user?.role_id ===
          "219bc0dd-ec72-4618-b22d-5d5ff612dcaf" && (
          <FilterDropdown
            options={statusFilterJenisData}
            value={resultJenisData}
            placeholder="Jenis Data"
            onChange={(value: any) => setResultJenisData(value || "")}
          />
        )}
      </div>
    </div>
  );
};

export default SensusFilterPanel;
