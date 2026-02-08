const StatusTableBadge = ({
  label,
  color = "gray",
}: {
  label: string;
  color?:
    | "green"
    | "blue"
    | "red"
    | "yellow"
    | "gray"
    | "pink"
    | "violet"
    | "teal"
    | "indigo"
    | "slate"
    | "orange";
}) => {
  const colors = {
    // Elegant Modern Color Palette
    green: "bg-emerald-50 text-emerald-800 border-emerald-300",
    blue: "bg-[#DBE2EF] text-[#3F72AF] border-[#3F72AF]/30", // Primary theme color
    red: "bg-rose-50 text-rose-800 border-rose-300",
    yellow: "bg-amber-50 text-amber-800 border-amber-300",
    gray: "bg-[#F9F7F7] text-[#112D4E] border-[#DBE2EF]", // Neutral theme
    pink: "bg-pink-50 text-pink-800 border-pink-300",
    violet: "bg-violet-50 text-violet-800 border-violet-300",
    teal: "bg-teal-50 text-teal-900 border-teal-300",
    indigo: "bg-[#3F72AF]/10 text-[#112D4E] border-[#3F72AF]/40 dark:bg-white", // Secondary theme
    slate: "bg-slate-100 text-slate-900 border-slate-400",
    orange: "bg-orange-50 text-orange-900 border-orange-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase rounded-lg border shadow-sm transition-all ${colors[color]}`}
    >
      {label}
    </span>
  );
};

export default StatusTableBadge;
