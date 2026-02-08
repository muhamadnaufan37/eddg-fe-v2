import { THEME_COLORS } from "@/config/theme";

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export const Label = ({
  children,
  htmlFor,
  required = false,
  className = "",
}: LabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium ${THEME_COLORS.text.label} ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};
