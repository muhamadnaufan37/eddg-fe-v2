import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const formatLabel = (key: string) => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const RenderValue = ({ value, depth = 0 }: { value: any; depth?: number }) => {
  const [open, setOpen] = useState(depth < 1);

  // null / undefined
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">-</span>;
  }

  // boolean
  if (typeof value === "boolean") {
    return (
      <span
        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
          value
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        }`}
      >
        {value ? "True" : "False"}
      </span>
    );
  }

  // primitive
  if (typeof value !== "object") {
    return (
      <span className="text-sm text-gray-900 dark:text-white break-all">
        {String(value)}
      </span>
    );
  }

  // array
  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <RenderValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  // object
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        {open ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}

        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Object ({Object.keys(value).length} fields)
        </span>
      </button>

      {open && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="grid grid-cols-12 gap-3 px-3 py-3">
              <div className="col-span-4">
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {formatLabel(key)}
                </span>
              </div>

              <div className="col-span-8">
                <RenderValue value={val} depth={depth + 1} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RenderValue;
