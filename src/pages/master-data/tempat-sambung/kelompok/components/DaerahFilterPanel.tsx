import FilterDropdown from "@/components/features/FilterDropdown";

const DaerahFilterPanel = ({ status, setStatus, statusOptions }: any) => {
  return (
    <div className="flex flex-col gap-4">
      {/* STATUS FILTER */}
      <FilterDropdown
        options={statusOptions}
        value={status}
        placeholder="Pilih salah satu"
        onChange={(value: any) => {
          setStatus(value !== undefined ? value : "");
        }}
      />
    </div>
  );
};

export default DaerahFilterPanel;
