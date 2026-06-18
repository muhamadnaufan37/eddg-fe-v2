import { BrowserRouter as Router } from "react-router-dom";

import { AuthContextProvider } from "./contexts/AuthContext";
import renderRoutes, { routes } from "./routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import GlobalImagePreview from "@/components/global/GlobalImagePreview";
import ScrollToTop from "@/components/global/ScrollToTop";
import PrivacyAgreementGate from "./components/global/PrivacyAgreementGate";
import useAuth from "./hooks/useAuth";

function App() {
  const queryClient = new QueryClient();

  const AppRoutes = () => {
    const { isNdaPending } = useAuth();

    if (isNdaPending) {
      return <div className="min-h-screen bg-[#EEEEEE] dark:bg-[#212121]" />;
    }

    return renderRoutes(routes);
  };

  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <GlobalImagePreview />
          <ScrollToTop />
          <AuthContextProvider>
            <PrivacyAgreementGate />
            <AppRoutes />
            {renderRoutes(routes)}
          </AuthContextProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
