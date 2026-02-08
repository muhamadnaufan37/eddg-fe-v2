import { Select } from "@/components/global";
import type { UsersFilterPanelProps } from "@/pages/sensus/types/types";

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
}: UsersFilterPanelProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Select
          options={fetchDataDaerah}
          value={fetchDataDaerah?.find(
            (option: any) => option.value === filterDaerah,
          )}
          placeholder="Daerah"
          className="w-full text-xs"
          onChange={async (selectedOption: any) => {
            const value = selectedOption?.value;
            setFilterDaerah(value || "");
            setBalikanDataDesa([]);
            setBalikanDataKelompok([]);
            setFilterDesa("");
            setFilterKelompok("");
            if (value) {
              await fetchDesa(value);
            }
          }}
          isClearable
          isDisabled={dataLogin?.user?.akses_daerah !== null}
        />

        <Select
          options={balikanDataDesa}
          value={balikanDataDesa?.find(
            (option: any) => option.value === filterDesa,
          )}
          placeholder="Desa"
          className="w-full text-xs"
          onChange={async (selectedOption: any) => {
            const value = selectedOption?.value;
            setFilterDesa(value || "");
            setFilterKelompok("");
            setBalikanDataKelompok([]);
            if (value) {
              await fetchKelompok(value);
            }
          }}
          isClearable
          isDisabled={dataLogin?.user?.akses_desa !== null}
        />

        <Select
          options={balikanDataKelompok}
          value={balikanDataKelompok?.find(
            (option: any) => option.value === filterKelompok,
          )}
          placeholder="Kelompok"
          className="w-full text-xs"
          onChange={(selectedOption: any) =>
            setFilterKelompok(selectedOption?.value || "")
          }
          isClearable
          isDisabled={dataLogin?.user?.akses_kelompok !== null}
        />
      </div>

      {/* STATUS FILTER */}
      <div className="grid grid-cols-2 gap-2">
        <Select
          options={statusUsersOptions}
          value={statusUsersOptions?.find(
            (option: any) => option.value === status,
          )}
          placeholder="Status Users"
          className="w-full text-xs"
          onChange={(selectedOption: any) =>
            setStatus(selectedOption?.value || "")
          }
          isClearable
        />
      </div>
    </div>
  );
};

export default UsersFilterPanel;
