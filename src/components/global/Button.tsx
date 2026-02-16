import { THEME_COLORS } from "@/config/theme";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles = "font-semibold rounded-md transition-colors duration-200";

  const variantStyles = {
    primary: `${THEME_COLORS.button.primary} ${THEME_COLORS.button.primaryText}`,
    secondary: `${THEME_COLORS.background.card} ${THEME_COLORS.text.secondary} ${THEME_COLORS.border.default} border`,
    outline: `border ${THEME_COLORS.border.input} ${THEME_COLORS.text.secondary} ${THEME_COLORS.hover.background}`,
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:text-gray-500 disabled:dark:text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
