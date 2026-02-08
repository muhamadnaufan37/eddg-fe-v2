import { THEME_COLORS } from "@/config/theme";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table = ({ children, className = "" }: TableProps) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
};

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader = ({ children, className = "" }: TableHeaderProps) => {
  return (
    <thead className={`${THEME_COLORS.background.tableHeader} ${className}`}>
      {children}
    </thead>
  );
};

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody = ({ children, className = "" }: TableBodyProps) => {
  return <tbody className={className}>{children}</tbody>;
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const TableRow = ({
  children,
  className = "",
  hoverable = true,
}: TableRowProps) => {
  return (
    <tr
      className={`border-b ${THEME_COLORS.border.default} ${hoverable ? THEME_COLORS.hover.row : ""} ${className}`}
    >
      {children}
    </tr>
  );
};

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  colSpan?: number;
}

export const TableHead = ({
  children,
  className = "",
  align = "left",
  colSpan,
}: TableHeadProps) => {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th
      colSpan={colSpan}
      className={`px-4 py-3 font-medium ${THEME_COLORS.text.label} border-b ${THEME_COLORS.border.default} ${alignClass[align]} ${className}`}
    >
      {children}
    </th>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  colSpan?: number;
}

export const TableCell = ({
  children,
  className = "",
  align = "left",
  colSpan,
}: TableCellProps) => {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td
      colSpan={colSpan}
      className={`px-4 py-3 ${THEME_COLORS.text.primary} ${alignClass[align]} ${className}`}
    >
      {children}
    </td>
  );
};
