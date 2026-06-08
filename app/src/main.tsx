import React from "react";
import { createRoot } from "react-dom/client";
import { ApiProvider, EmptyApi } from "@contract/data/provider";
import { SeededDemoApi } from "./demo/seededDemoApi";
import { App } from "./app";
import "./styles.css";

function isDemoMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "1" || import.meta.env.VITE_DEMO_MODE === "true";
}

const api = isDemoMode() ? new SeededDemoApi() : EmptyApi;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApiProvider api={api}>
      <App demoMode={isDemoMode()} />
    </ApiProvider>
  </React.StrictMode>
);
