import FilterDropdown from "@/components/features/FilterDropdown";
import type { UsersFilterPanelProps } from "@/pages/digital-data/sensus/types/types";

const UsersFilterPanel = ({
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
  dataLogin,
  status,
  setStatus,
  statusUsersOptions,
  statusNda,
  setStatusNda,
  statusNdaOptions,
}: UsersFilterPanelProps) => {
  return (
    <div className="flex flex-col gap-4">
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
          options={statusUsersOptions}
          value={status}
          placeholder="Status Users"
          onChange={(value: any) => {
            setStatus(value !== undefined ? value : "");
          }}
        />
        <FilterDropdown
          options={statusNdaOptions}
          value={statusNda}
          placeholder="Status NDA"
          onChange={(value: any) => {
            setStatusNda(value !== undefined ? value : "");
          }}
        />
      </div>
    </div>
  );
};

export default UsersFilterPanel;
