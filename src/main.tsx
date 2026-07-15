import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { KeycloakProvider } from "./providers/KeycloakProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <App />
);
// createRoot(document.getElementById("root")!).render(
