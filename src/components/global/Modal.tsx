import { THEME_COLORS } from "@/config/theme";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClasses[size]} ${THEME_COLORS.background.card} rounded-lg shadow-xl border ${THEME_COLORS.border.default} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={`flex items-center justify-between px-6 py-4 border-b ${THEME_COLORS.border.default}`}
          >
            {title && (
              <h2
                className={`text-xl font-semibold ${THEME_COLORS.text.primary}`}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`${THEME_COLORS.text.secondary} ${THEME_COLORS.hover.text} transition-colors p-1 rounded`}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalHeader = ({ children, className = "" }: ModalHeaderProps) => {
  return (
    <div
      className={`px-6 py-4 border-b ${THEME_COLORS.border.default} ${className}`}
    >
      {children}
    </div>
  );
};

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody = ({ children, className = "" }: ModalBodyProps) => {
  return (
    <div className={`px-6 py-4 flex-1 overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter = ({ children, className = "" }: ModalFooterProps) => {
  return (
    <div
      className={`px-6 py-4 border-t ${THEME_COLORS.border.default} flex items-center justify-end gap-3 ${className}`}
    >
      {children}
    </div>
  );
};
