import { Select } from "@/components/global";

const DaerahFilterPanel = ({ status, setStatus, statusOptions }: any) => {
  return (
    <div className="flex flex-col gap-4">
      {/* STATUS FILTER */}
      <Select
        options={statusOptions}
        value={statusOptions?.find(
          (option: any) => String(option.value) === String(status ?? ""),
        )}
        placeholder="Pilih salah satu"
        className="w-full text-xs"
        onChange={(selectedOption: any) => {
          const value = selectedOption?.value;
          setStatus(value !== undefined ? value : "");
        }}
        isClearable
      />
    </div>
  );
};

export default DaerahFilterPanel;
