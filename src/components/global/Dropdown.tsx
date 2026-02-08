import { THEME_COLORS } from "@/config/theme";
import { useState, useRef, useEffect } from "react";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export const Dropdown = ({
  trigger,
  children,
  align = "left",
  className = "",
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignClass} mt-2 z-50 min-w-50 ${THEME_COLORS.background.card} border ${THEME_COLORS.border.default} rounded-lg shadow-lg py-1`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  className?: string;
}

export const DropdownItem = ({
  children,
  onClick,
  icon,
  danger = false,
  className = "",
}: DropdownItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 ${
        danger
          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          : `${THEME_COLORS.text.primary} ${THEME_COLORS.hover.item}`
      } transition-colors ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

interface DropdownDividerProps {
  className?: string;
}

export const DropdownDivider = ({ className = "" }: DropdownDividerProps) => {
  return (
    <div
      className={`my-1 border-t ${THEME_COLORS.border.default} ${className}`}
    />
  );
};
