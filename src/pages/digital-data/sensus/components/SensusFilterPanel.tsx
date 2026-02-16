import { Select, Input } from "@/components/global";
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
          options={statusFilterInfoSambung}
          value={statusFilterInfoSambung?.find(
            (option: any) => option.value === statusSambung,
          )}
          placeholder="Status Sambung"
          className="w-full text-xs"
          onChange={(selectedOption: any) =>
            setStatusSambung(selectedOption?.value || "")
          }
          isClearable
        />
        <Select
          options={statusFilterInfoPernikahan}
          value={statusFilterInfoPernikahan?.find(
            (option: any) => option.value === statusPernikahan,
          )}
          placeholder="Status Pernikahan"
          className="w-full text-xs"
          onChange={(selectedOption: any) =>
            setStatusPernikahan(selectedOption?.value || "")
          }
          isClearable
        />
        <Select
          options={statusFilterInfoAtletAsad}
          value={statusFilterInfoAtletAsad?.find(
            (option: any) => option.value === statusAtletAsad,
          )}
          placeholder="Status Atlet"
          className="w-full text-xs"
          onChange={(selectedOption: any) =>
            setStatusAtletAsad(selectedOption?.value || "")
          }
          isClearable
        />
        <Select
          options={statusFilterInfoGender}
          value={statusFilterInfoGender?.find(
            (option: any) => option.value === statusGender,
          )}
          placeholder="Status Gender"
          className="w-full text-xs"
          onChange={(selectedOption: any) =>
            setStatusGender(selectedOption?.value || "")
          }
          isClearable
        />

        {dataLogin?.user?.role_id ===
          "219bc0dd-ec72-4618-b22d-5d5ff612dcaf" && (
          <Select
            options={statusFilterJenisData}
            value={statusFilterJenisData?.find(
              (option: any) => option.value === resultJenisData,
            )}
            placeholder="Jenis Data"
            className="w-full text-xs"
            onChange={(selectedOption: any) =>
              setResultJenisData(selectedOption?.value || "")
            }
            isClearable
          />
        )}
      </div>
    </div>
  );
};

export default SensusFilterPanel;
