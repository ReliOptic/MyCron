import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiProvider, EmptyApi } from "@contract/data/provider";
import { App } from "./app";
import { SeededDemoApi } from "./demo/seededDemoApi";

beforeEach(() => {
  window.localStorage.clear();
});

function renderApp(options: { demo?: boolean; empty?: boolean; route?: string } = {}) {
  const demo = options.demo ?? true;
  const empty = options.empty ?? false;
  const route = options.route ?? (demo ? "/?demo=1" : "/");
  window.history.replaceState({}, "", route);
  return render(
    <ApiProvider api={empty ? EmptyApi : new SeededDemoApi()}>
      <App demoMode={demo} />
    </ApiProvider>
  );
}

describe("language toggle", () => {
  it("switches visible navigation labels between English and Korean", async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findAllByRole("link", { name: /Today/i });
    expect(screen.getAllByRole("link", { name: /Inbox/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Review/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Account/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Switch language to Korean/i }));

    expect((await screen.findAllByRole("link", { name: "오늘" })).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /요청함/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "검토" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "계정" })).toBeInTheDocument();
  });
});

describe("localized empty and not-found states", () => {
  it("supports English and Korean EmptyApi copy", async () => {
    const user = userEvent.setup();
    renderApp({ demo: false, empty: true, route: "/" });

    expect(await screen.findByRole("link", { name: /View demo/i })).toHaveAttribute("href", "/?demo=1");

    await user.click(screen.getByRole("button", { name: /Switch language to Korean/i }));
    expect(await screen.findByRole("link", { name: "데모 보기" })).toHaveAttribute("href", "/?demo=1");
  });

  it("supports English and Korean route not-found copy", async () => {
    const user = userEvent.setup();
    renderApp({ demo: true, route: "/not-a-real-route?demo=1" });

    expect(await screen.findByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Today/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Switch language to Korean/i }));
    expect(await screen.findByText("페이지를 찾을 수 없음")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "오늘로 돌아가기" })).toBeInTheDocument();
  });
});

describe("localized demo action feedback", () => {
  it("renders feedback copy in both languages", async () => {
    const user = userEvent.setup();
    renderApp({ route: "/review?demo=1" });

    await user.click(await screen.findByRole("button", { name: /Export/i }));
    expect(await screen.findByText("Export not available")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Switch language to Korean/i }));
    await user.click(await screen.findByRole("button", { name: "내보내기" }));
    expect(await screen.findByText("내보내기는 아직 준비 중입니다")).toBeInTheDocument();
  });
});
