import { BrowserRouter as Router } from "react-router-dom";

import { AuthContextProvider } from "./contexts/AuthContext";
import renderRoutes, { routes } from "./routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const queryClient = new QueryClient();

  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <AuthContextProvider>{renderRoutes(routes)}</AuthContextProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
