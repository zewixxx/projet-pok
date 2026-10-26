import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import App from "./App";
import { applyPreferences } from "./ui/preferences";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/shell.css";
import "./styles/dashboard.css";
import "./styles/table.css";
import "./styles/review.css";
import "./styles/pages.css";

// Thème et taille du texte appliqués avant le premier rendu : pas de flash blanc.
applyPreferences();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
