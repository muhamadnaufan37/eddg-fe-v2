import { THEME_COLORS } from "@/config/theme";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export const Badge = ({
  children,
  variant = "primary",
  className = "",
}: BadgeProps) => {
  const variantStyles = {
    primary: `${THEME_COLORS.badge.primary} ${THEME_COLORS.badge.primaryText}`,
    success:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
