import { THEME_COLORS } from "@/config/theme";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

interface AlertProps {
  type?: "success" | "warning" | "danger" | "info";
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert = ({
  type = "info",
  title,
  message,
  onClose,
  className = "",
}: AlertProps) => {
  const variants = {
    success: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-800 dark:text-green-200",
      icon: CheckCircle,
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-800 dark:text-yellow-200",
      icon: AlertTriangle,
    },
    danger: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
      icon: AlertCircle,
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
      icon: Info,
    },
  };

  const variant = variants[type];
  const Icon = variant.icon;

  return (
    <div
      className={`rounded-lg border ${variant.bg} ${variant.border} p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className={`flex-shrink-0 mt-0.5 ${variant.text}`} />
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold mb-1 ${variant.text}`}>{title}</h3>
          )}
          <p className={`text-sm ${variant.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${variant.text} hover:opacity-70 transition-opacity`}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
