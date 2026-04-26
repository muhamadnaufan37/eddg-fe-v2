import { ChevronDown, ChevronUp, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type FilterOption = {
  value: any;
  label: string;
};

type FilterDropdownProps = {
  options: FilterOption[];
  value: any;
  placeholder: string;
  onChange: (value: any) => void;
  disabled?: boolean;
  emptyLabel?: string;
};

const FilterDropdown = ({
  options,
  value,
  placeholder,
  onChange,
  disabled = false,
  emptyLabel = "Tidak ada data",
}: FilterDropdownProps) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 208,
    placement: "bottom" as "bottom" | "top",
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedWrapper = wrapperRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);

      if (
        wrapperRef.current &&
        menuRef.current &&
        !clickedWrapper &&
        !clickedMenu
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (!wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const estimatedHeight = 208;
      const openTop =
        spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove
          ? rect.bottom + 4
          : Math.max(8, rect.top - Math.min(estimatedHeight, spaceAbove) - 4);
      const placement =
        spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove
          ? "bottom"
          : "top";

      setMenuStyle({
        top: openTop,
        left: rect.left,
        width: rect.width,
        maxHeight:
          placement === "bottom"
            ? Math.max(120, Math.min(estimatedHeight, spaceBelow))
            : Math.max(120, Math.min(estimatedHeight, spaceAbove)),
        placement,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const selectedOption = useMemo(
    () =>
      options?.find(
        (option: FilterOption) => String(option.value) === String(value ?? ""),
      ),
    [options, value],
  );

  const hasValue = String(value ?? "") !== "";

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-xs text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${
          disabled
            ? "cursor-not-allowed bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500"
            : "hover:border-gray-400 dark:hover:border-gray-600"
        }`}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <span className="flex items-center gap-2">
          {hasValue && !disabled && (
            <X
              className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
                setOpen(false);
              }}
            />
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
        </span>
      </button>

      {open &&
        !disabled &&
        createPortal(
          <div className="fixed inset-0 z-70">
            <div
              ref={menuRef}
              className="fixed overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
              style={{
                top:
                  menuStyle.placement === "bottom"
                    ? menuStyle.top
                    : Math.max(8, menuStyle.top),
                left: menuStyle.left,
                width: menuStyle.width,
                maxHeight: menuStyle.maxHeight,
              }}
            >
              {options?.length ? (
                options.map((option: FilterOption) => {
                  const isSelected =
                    String(option.value) ===
                    String(selectedOption?.value ?? "");

                  return (
                    <button
                      key={`${String(option.value)}-${option.label}`}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-gray-900 text-white dark:bg-amber-400 dark:text-gray-900"
                          : "text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  {emptyLabel}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default FilterDropdown;
