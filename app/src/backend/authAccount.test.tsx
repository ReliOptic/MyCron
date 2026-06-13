import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiProvider, EmptyApi } from "@contract/data/provider";
import { App } from "../app";
import { AuthProvider, type SupabaseAuthClient } from "./auth";

function fakeClient(signInWithOAuth = vi.fn(async () => ({ error: null }))) {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithOAuth,
      signOut: async () => ({ error: null }),
    },
  } satisfies SupabaseAuthClient;
}

describe("Account auth surface", () => {
  it("offers Google sign-in only when Supabase auth is configured", async () => {
    const user = userEvent.setup();
    const signInWithOAuth = vi.fn(async () => ({ error: null }));
    window.history.replaceState({}, "", "/account");

    render(
      <AuthProvider client={fakeClient(signInWithOAuth)}>
        <ApiProvider api={EmptyApi}>
          <App demoMode={false} />
        </ApiProvider>
      </AuthProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Sign in with Google" }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({ provider: "google" });
    });
  });
});
