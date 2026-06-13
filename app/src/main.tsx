import React from "react";
import { createRoot } from "react-dom/client";
import { ApiProvider } from "@contract/data/provider";
import { AuthProvider, useAuth } from "./backend/auth";
import { resolveApi } from "./backend/resolveApi";
import { createSupabaseBrowserClient } from "./backend/supabase";
import { App } from "./app";
import "./styles.css";

function isDemoMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "1" || import.meta.env.VITE_DEMO_MODE === "true";
}

const demoMode = isDemoMode();
const supabaseClient = createSupabaseBrowserClient(import.meta.env);

function ApiBootstrap() {
  const auth = useAuth();
  const api = React.useMemo(
    () => resolveApi({ demoMode, env: import.meta.env, session: auth.session, client: supabaseClient }),
    [auth.session],
  );
  return (
    <ApiProvider api={api}>
      <App demoMode={demoMode} />
    </ApiProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider client={supabaseClient}>
      <ApiBootstrap />
    </AuthProvider>
  </React.StrictMode>
);
