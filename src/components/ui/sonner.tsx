import { useTheme } from "@/components/theme-provider";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme === "system" ? "light" : (theme as ToasterProps["theme"])}
      className="toaster group"
      position="top-right"
      expand={true}
      richColors
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "toast-custom group-[.toaster]:bg-white group-[.toaster]:dark:bg-gray-800 group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:dark:border-gray-700 group-[.toaster]:shadow-lg",
          title:
            "group-[.toast]:text-gray-900 group-[.toast]:dark:text-gray-100 group-[.toast]:text-sm group-[.toast]:font-semibold",
          description:
            "group-[.toast]:text-gray-600 group-[.toast]:dark:text-gray-400 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          closeButton:
            "group-[.toast]:bg-white group-[.toast]:dark:bg-gray-700 group-[.toast]:border group-[.toast]:border-gray-200 group-[.toast]:dark:border-gray-600 group-[.toast]:hover:bg-gray-50 group-[.toast]:dark:hover:bg-gray-600",
          success:
            "group-[.toast]:bg-green-50 group-[.toast]:dark:bg-green-950 group-[.toast]:border-green-200 group-[.toast]:dark:border-green-800 group-[.toast]:text-green-800 group-[.toast]:dark:text-green-200",
          error:
            "group-[.toast]:bg-red-50 group-[.toast]:dark:bg-red-950 group-[.toast]:border-red-200 group-[.toast]:dark:border-red-800 group-[.toast]:text-red-800 group-[.toast]:dark:text-red-200",
          warning:
            "group-[.toast]:bg-yellow-50 group-[.toast]:dark:bg-yellow-950 group-[.toast]:border-yellow-200 group-[.toast]:dark:border-yellow-800 group-[.toast]:text-yellow-800 group-[.toast]:dark:text-yellow-200",
          info: "group-[.toast]:bg-blue-50 group-[.toast]:dark:bg-blue-950 group-[.toast]:border-blue-200 group-[.toast]:dark:border-blue-800 group-[.toast]:text-blue-800 group-[.toast]:dark:text-blue-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
