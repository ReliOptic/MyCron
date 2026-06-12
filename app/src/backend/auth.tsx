import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SupabaseSession } from "./supabaseApi";

type AuthError = { message: string };
export type SupabaseAuthClient = {
  auth: {
    getSession(): Promise<{ data: { session: SupabaseSession | null }; error: AuthError | null }>;
    onAuthStateChange(
      callback: (event: string, session: SupabaseSession | null) => void,
    ): { data: { subscription: { unsubscribe(): void } } };
    signInWithOAuth(input: { provider: "google" }): Promise<{ error: AuthError | null }>;
    signOut(input?: { scope: "local" }): Promise<{ error: AuthError | null }>;
  };
};

export type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: SupabaseSession | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const defaultAuth: AuthContextValue = {
  configured: false,
  loading: false,
  session: null,
  signIn: async () => {
    throw new Error("Supabase Auth is not configured.");
  },
  signOut: async () => undefined,
};

const AuthContext = createContext<AuthContextValue>(defaultAuth);

export function AuthProvider({
  client,
  children,
}: {
  client: SupabaseAuthClient | null;
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(Boolean(client));

  useEffect(() => {
    if (!client) {
      setLoading(false);
      setSession(null);
      return undefined;
    }
    let alive = true;
    client.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) console.error(error.message);
      setSession(data.session);
      setLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(client),
    loading,
    session,
    signIn: async () => {
      if (!client) throw new Error("Supabase Auth is not configured.");
      const { error } = await client.auth.signInWithOAuth({ provider: "google" });
      if (error) throw new Error(error.message);
    },
    signOut: async () => {
      if (!client) return;
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw new Error(error.message);
    },
  }), [client, loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
