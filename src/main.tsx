import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.tsx";
import { ConfigContextProvider } from "./contexts/configContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigContextProvider>
      <App />
    </ConfigContextProvider>
  </StrictMode>,
);
