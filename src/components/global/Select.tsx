import { THEME_COLORS } from "@/config/theme";
import { useTheme } from "next-themes";
import ReactSelect, { type Props as ReactSelectProps } from "react-select";

interface SelectProps extends ReactSelectProps {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Select = ({ label, error, required, ...props }: SelectProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="w-full">
      {label && (
        <label
          className={`block text-sm font-medium mb-2 ${THEME_COLORS.text.label}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <ReactSelect
        {...props}
        classNamePrefix="react-select"
        styles={{
          control: (base, state) => ({
            ...base,
            backgroundColor: isDark ? "rgb(31 41 55)" : "#ffffff", // dark:bg-gray-800 : bg-white
            borderColor: error
              ? "#ef4444" // red-500
              : state.isFocused
                ? isDark
                  ? "#FBB228"
                  : "#1F2121"
                : isDark
                  ? "rgb(75 85 99)" // dark border-gray-600
                  : "#d1d5db", // light border-gray-300
            boxShadow: state.isFocused
              ? "0 0 0 1px " + (isDark ? "#FBB228" : "#1F2121")
              : "none",
            minHeight: "42px",
            "&:hover": {
              borderColor: error
                ? "#ef4444"
                : isDark
                  ? "rgb(107 114 128)" // hover border-gray-500
                  : "#9ca3af",
            },
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: isDark ? "rgb(31 41 55)" : "#ffffff",
            border: `1px solid ${isDark ? "rgb(75 85 99)" : "#e5e7eb"}`,
            boxShadow: isDark
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
              : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          }),
          menuList: (base) => ({
            ...base,
            maxHeight: "200px",
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? isDark
                ? "#FBB228" // Primary color
                : "#1F2121"
              : state.isFocused
                ? isDark
                  ? "rgb(55 65 81)" // hover bg-gray-700
                  : "#f3f4f6" // hover bg-gray-100
                : isDark
                  ? "rgb(31 41 55)"
                  : "#ffffff",
            color: state.isSelected
              ? isDark
                ? "#1F2121"
                : "#ffffff"
              : isDark
                ? "rgb(249 250 251)" // text-gray-50
                : "rgb(17 24 39)", // text-gray-900
            cursor: "pointer",
            padding: "8px 12px",
            fontSize: "0.875rem",
            "&:active": {
              backgroundColor: isDark ? "#FBB228" : "#1F2121",
            },
          }),
          singleValue: (base) => ({
            ...base,
            color: isDark ? "rgb(249 250 251)" : "rgb(17 24 39)",
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: isDark ? "rgb(55 65 81)" : "#e5e7eb",
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: isDark ? "rgb(249 250 251)" : "rgb(17 24 39)",
            fontSize: "0.875rem",
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: isDark ? "rgb(156 163 175)" : "rgb(107 114 128)",
            "&:hover": {
              backgroundColor: "#ef4444",
              color: "#ffffff",
            },
          }),
          input: (base) => ({
            ...base,
            color: isDark ? "rgb(249 250 251)" : "rgb(17 24 39)",
            "input:focus": {
              boxShadow: "none",
            },
          }),
          placeholder: (base) => ({
            ...base,
            color: isDark ? "rgb(156 163 175)" : "rgb(107 114 128)",
            fontSize: "0.875rem",
          }),
          dropdownIndicator: (base, state) => ({
            ...base,
            color: isDark ? "rgb(156 163 175)" : "rgb(107 114 128)",
            transition: "all 0.2s",
            transform: state.selectProps.menuIsOpen
              ? "rotate(180deg)"
              : "rotate(0deg)",
            "&:hover": {
              color: isDark ? "rgb(209 213 219)" : "rgb(55 65 81)",
            },
          }),
          indicatorSeparator: (base) => ({
            ...base,
            backgroundColor: isDark ? "rgb(75 85 99)" : "#d1d5db",
          }),
          clearIndicator: (base) => ({
            ...base,
            color: isDark ? "rgb(156 163 175)" : "rgb(107 114 128)",
            "&:hover": {
              color: "#ef4444",
            },
          }),
          loadingIndicator: (base) => ({
            ...base,
            color: isDark ? "#FBB228" : "#1F2121",
          }),
          noOptionsMessage: (base) => ({
            ...base,
            color: isDark ? "rgb(156 163 175)" : "rgb(107 114 128)",
            fontSize: "0.875rem",
          }),
        }}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
