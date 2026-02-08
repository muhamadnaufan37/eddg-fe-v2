import { THEME_COLORS } from "@/config/theme";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = ({
  label,
  error,
  containerClassName = "",
  className = "",
  ...props
}: InputProps) => {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className={`text-sm font-medium ${THEME_COLORS.text.label}`}>
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 text-sm ${THEME_COLORS.background.input} border ${THEME_COLORS.border.input} rounded-md focus:outline-none focus:ring-2 ${THEME_COLORS.focus.ring} ${THEME_COLORS.text.primary} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  rows?: number;
  containerClassName?: string;
}

export const Textarea = ({
  label,
  error,
  rows = 3,
  containerClassName = "",
  className = "",
  ...props
}: TextareaProps) => {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className={`text-sm font-medium ${THEME_COLORS.text.label}`}>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-3 py-2 text-sm ${THEME_COLORS.background.input} border ${THEME_COLORS.border.input} rounded-md focus:outline-none focus:ring-2 ${THEME_COLORS.focus.ring} ${THEME_COLORS.text.primary} resize-none ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
