import React, { useState, useEffect } from "react";
import Select, { type StylesConfig } from "react-select";
import {
  type FilterField,
  type FilterValue,
  type FilterOption,
} from "../../types/type";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FilterField[];
  initialValues: FilterValue;
  onApply: (values: FilterValue) => void;
  onFieldChange?: (fieldId: string, value: any, values: FilterValue) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  fields,
  initialValues,
  onApply,
  onFieldChange,
}) => {
  const [currentFilters, setCurrentFilters] =
    useState<FilterValue>(initialValues);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Deteksi jika document mengandung class 'dark' untuk tema React Select
  useEffect(() => {
    if (isOpen) {
      setCurrentFilters(initialValues);
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleFilterChange = (
    fieldId: string,
    value: any,
    type: string,
    isMulti?: boolean,
  ) => {
    let nextFilters: FilterValue = {};

    setCurrentFilters((prev) => {
      const updated = { ...prev };

      if (type === "checkbox") {
        // Ambil data array saat ini, jika belum ada buat array kosong
        const currentValues = Array.isArray(updated[fieldId])
          ? updated[fieldId]
          : [];

        if (isMulti) {
          // --- KASUS 1: BISA PILIH LEBIH DARI 1 (MULTI-SELECT) ---
          if (currentValues.includes(value)) {
            // Jika sudah dicentang, hapus dari list (uncheck)
            updated[fieldId] = currentValues.filter((v: any) => v !== value);
          } else {
            // Jika belum dicentang, masukkan ke list
            updated[fieldId] = [...currentValues, value];
          }
        } else {
          // --- KASUS 2: HANYA BISA PILIH 1 (SINGLE-SELECT) ---
          if (currentValues.includes(value)) {
            // Jika mengklik opsi yang sama, hapus centang (opsional, jadi kosong)
            updated[fieldId] = [];
          } else {
            // Jika mengklik opsi lain, ganti array hanya dengan nilai baru tersebut
            updated[fieldId] = [value];
          }
        }
      } else {
        updated[fieldId] = value;
      }

      nextFilters = updated;
      return updated;
    });

    onFieldChange?.(fieldId, value, nextFilters);
  };

  const handleReset = () => {
    const resetValues = fields.reduce((acc, field) => {
      if (
        field.type === "checkbox" ||
        (field.type === "select" && field.isMulti)
      ) {
        acc[field.id] = [];
      } else {
        acc[field.id] = field.type === "range" ? field.min || 0 : "";
      }
      return acc;
    }, {} as FilterValue);
    setCurrentFilters(resetValues);
  };

  // Kustomisasi Styling React Select agar Sinkron dengan Tailwind Light/Dark Mode
  const customSelectStyles: StylesConfig<FilterOption, boolean> = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff", // bg-gray-800 : bg-white
      borderColor: state.isFocused
        ? "#6366f1"
        : isDarkMode
          ? "#374151"
          : "#e5e7eb", // border-indigo-500 : border-gray-700/border-gray-200
      borderRadius: "0.75rem", // rounded-xl
      padding: "2px",
      boxShadow: state.isFocused ? "0 0 0 1px #6366f1" : "none",
      "&:hover": {
        borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
      borderRadius: "0.75rem",
      overflow: "hidden",
      zIndex: 60,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#4f46e5" // indigo-600
        : state.isFocused
          ? isDarkMode
            ? "#374151"
            : "#f3f4f6" // gray-700 : gray-100
          : "transparent",
      color: state.isSelected ? "#ffffff" : isDarkMode ? "#e5e7eb" : "#374151",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#4f46e5",
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? "#374151" : "#e0e7ff", // gray-700 : indigo-100
      borderRadius: "0.375rem",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDarkMode ? "#f3f4f6" : "#4338ca", // gray-100 : indigo-700
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDarkMode ? "#9ca3af" : "#6366f1",
      "&:hover": {
        backgroundColor: isDarkMode ? "#4b5563" : "#c7d2fe",
        color: isDarkMode ? "#ffffff" : "#4338ca",
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? "#f3f4f6" : "#1f2937",
    }),
    placeholder: (base) => ({
      ...base,
      color: isDarkMode ? "#6b7280" : "#9ca3af",
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4 transition-opacity">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Main Container dengan support Dark Mode (.dark) */}
      <div className="flex flex-col w-full max-h-[90vh] sm:max-h-[85vh] max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Filter Parameter
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-4 overflow-y-auto space-y-6">
          {fields.map((field) => (
            <div
              key={field.id}
              className="border-b border-gray-100 dark:border-gray-800 pb-5 last:border-none"
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {field.label}
              </label>

              {/* DROPDOWN (REACT SELECT) */}
              {field.type === "select" && (
                <Select
                  isMulti={field.isMulti}
                  options={field.options}
                  styles={customSelectStyles}
                  placeholder="Pilih opsi..."
                  value={
                    field.isMulti
                      ? field.options?.filter((opt) =>
                          (currentFilters[field.id] as any[])?.includes(
                            opt.value,
                          ),
                        )
                      : field.options?.find(
                          (opt) => opt.value === currentFilters[field.id],
                        ) || null
                  }
                  onChange={(selected: any) => {
                    const value = field.isMulti
                      ? selected
                        ? selected.map((item: any) => item.value)
                        : []
                      : selected
                        ? selected.value
                        : "";
                    handleFilterChange(field.id, value, "select");
                  }}
                />
              )}

              {/* CHECKBOX */}
              {field.type === "checkbox" && (
                <div className="grid grid-cols-2 gap-3">
                  {field.options?.map((opt) => {
                    // Pastikan dicek dari array
                    const isChecked = Array.isArray(currentFilters[field.id])
                      ? (currentFilters[field.id] as any[]).includes(opt.value)
                      : false;

                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          // Kirim parameter field.isMulti ke fungsi handler
                          onChange={() =>
                            handleFilterChange(
                              field.id,
                              opt.value,
                              "checkbox",
                              field.isMulti,
                            )
                          }
                          className="w-4 h-4 text-indigo-600 ...args"
                        />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* RADIO */}
              {field.type === "radio" && (
                <div className="space-y-2">
                  {field.options?.map((opt) => {
                    const isSelected = currentFilters[field.id] === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name={field.id}
                          checked={isSelected}
                          onChange={() =>
                            handleFilterChange(field.id, opt.value, "radio")
                          }
                          className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-700 focus:ring-indigo-500 dark:bg-gray-800"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* RANGE SLIDER */}
              {field.type === "range" && (
                <div className="space-y-2 px-1">
                  <input
                    type="range"
                    min={field.min ?? 0}
                    max={field.max ?? 100}
                    value={currentFilters[field.id] ?? field.min ?? 0}
                    onChange={(e) =>
                      handleFilterChange(
                        field.id,
                        Number(e.target.value),
                        "range",
                      )
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>{field.min ?? 0}</span>
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                      {currentFilters[field.id] ?? field.min ?? 0}
                    </span>
                    <span>{field.max ?? 100}</span>
                  </div>
                </div>
              )}

              {/* TOGGLE */}
              {field.type === "toggle" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Aktifkan opsi ini
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange(
                        field.id,
                        !currentFilters[field.id],
                        "toggle",
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      currentFilters[field.id]
                        ? "bg-indigo-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        currentFilters[field.id]
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-950/40 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-2.5 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
          >
            Riset Semua
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(currentFilters);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
};
