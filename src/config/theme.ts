/**
 * Global Theme Configuration
 * Centralized color scheme for light and dark modes
 *
 * Usage:
 * import { THEME_COLORS } from '@/config/theme';
 * className={THEME_COLORS.background.primary}
 */

export const THEME_COLORS = {
  // Background colors
  background: {
    primary: "bg-[#EEEEEE] dark:bg-[#212121]", // Main background
    card: "bg-white dark:bg-[#2a2a2a]", // Card background
    tableHeader: "bg-gray-50 dark:bg-[#1a1a1a]", // Table header
    input: "bg-white dark:bg-[#2a2a2a]", // Input fields
  },

  // Button colors
  button: {
    primary:
      "bg-[#1F2121] hover:bg-gray-800 dark:bg-[#457b9d] dark:hover:bg-[#5a91b3]",
    primaryText: "text-white dark:text-white",
  },

  // Badge colors
  badge: {
    primary: "bg-[#1F2121] dark:bg-[#457b9d]",
    primaryText: "text-white dark:text-white",
  },

  // Active/Selected states
  active: {
    background: "bg-[#1F2121] dark:bg-[#457b9d]",
    text: "text-white dark:text-white",
  },

  // Text colors
  text: {
    primary: "text-gray-900 dark:text-white",
    secondary: "text-gray-700 dark:text-gray-300",
    muted: "text-gray-600 dark:text-gray-400",
    label: "text-gray-700 dark:text-gray-300",
  },

  // Border colors
  border: {
    default: "border-gray-200 dark:border-gray-700",
    input: "border-gray-300 dark:border-gray-600",
  },

  // Hover states
  hover: {
    background: "hover:bg-gray-50 dark:hover:bg-gray-900",
    row: "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
    tableRow: "hover:bg-gray-100 dark:hover:bg-gray-700",
    item: "hover:bg-gray-50 dark:hover:bg-[#2a2a2a]",
    text: "hover:text-gray-900 dark:hover:text-gray-100",
  },

  // Focus states
  focus: {
    ring: "focus:ring-[#1F2121] dark:focus:ring-[#457b9d]",
  },
} as const;

/**
 * Raw color values for use in JavaScript/inline styles
 * (e.g., for chart libraries like recharts)
 */
export const THEME_COLORS_RAW = {
  light: {
    background: "#EEEEEE",
    card: "#FFFFFF",
    button: "#1F2121",
    buttonText: "#FFFFFF",
    text: "#111827",
    textSecondary: "#374151",
    textMuted: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    background: "#212121",
    card: "#2a2a2a",
    button: "#457b9d",
    buttonText: "#FFFFFF",
    text: "#FFFFFF",
    textSecondary: "#D1D5DB",
    textMuted: "#9CA3AF",
    border: "#374151",
  },
} as const;

/**
 * Select component theme generator for react-select
 */
export const getSelectTheme = (isDark: boolean) => ({
  control: {
    backgroundColor: isDark ? "#2a2a2a" : "white",
    borderColor: isDark ? "#4B5563" : "#D1D5DB",
    focusBorderColor: "#9CA3AF",
  },
  menu: {
    backgroundColor: isDark ? "#2a2a2a" : "white",
  },
  option: {
    selected: isDark ? "#374151" : "#F3F4F6",
    focused: isDark ? "#1f2937" : "#F9FAFB",
    default: isDark ? "#2a2a2a" : "white",
    active: isDark ? "#4B5563" : "#E5E7EB",
  },
  text: {
    default: isDark ? "#F3F4F6" : "#111827",
  },
});

/**
 * Chart colors
 */
export const CHART_COLORS = {
  pie: {
    belumVerifikasi: "#10B981", // Green
    ditolak: "#F87171", // Red
    disetujui: "#60A5FA", // Blue
  },
  bar: {
    primary: "#E5E7EB", // Light gray for bars
  },
  axis: "#6B7280", // Gray for axis
} as const;
