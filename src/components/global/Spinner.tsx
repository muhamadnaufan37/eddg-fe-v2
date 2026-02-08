import { THEME_COLORS } from "@/config/theme";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Spinner = ({ size = "md", className = "" }: SpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div
      className={`inline-block ${sizeClasses[size]} border-solid rounded-full border-t-transparent border-gray-300 dark:border-gray-600 animate-spin ${className}`}
      style={{
        borderTopColor: "transparent",
      }}
    />
  );
};

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingOverlay = ({
  message = "Loading...",
  fullScreen = false,
}: LoadingOverlayProps) => {
  return (
    <div
      className={`${fullScreen ? "fixed" : "absolute"} inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm`}
    >
      <Spinner size="lg" />
      {message && (
        <p className={`mt-4 text-sm ${THEME_COLORS.text.secondary}`}>
          {message}
        </p>
      )}
    </div>
  );
};
