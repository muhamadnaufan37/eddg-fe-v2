import { useState } from "react";
import { getFrontendVersion } from "@/services/versionService";

interface VersionDisplayProps {
  className?: string;
}

export function VersionDisplay({ className = "" }: VersionDisplayProps) {
  const [frontendVersion] = useState(getFrontendVersion());

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          Version:
        </span>
        <span className="font-mono text-zinc-600 dark:text-zinc-400">
          v{frontendVersion}
        </span>
      </div>
    </div>
  );
}
