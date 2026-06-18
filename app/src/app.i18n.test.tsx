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

function renderApp(
  options: { demo?: boolean; empty?: boolean; route?: string } = {},
) {
  const demo = options.demo ?? true;
  const empty = options.empty ?? false;
  const route = options.route ?? (demo ? "/?demo=1" : "/");
  window.history.replaceState({}, "", route);
  return render(
    <ApiProvider api={empty ? EmptyApi : new SeededDemoApi()}>
      <App demoMode={demo} />
    </ApiProvider>,
  );
}

describe("language toggle", () => {
  it("switches visible navigation labels between English and Korean", async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findAllByRole("link", { name: /Today/i });
    expect(
      screen.getAllByRole("link", { name: /Inbox/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /Review/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Account/i })).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Switch language to Korean/i }),
    );

    expect(
      (await screen.findAllByRole("link", { name: "오늘" })).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /요청함/ }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "검토" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "계정" })).toBeInTheDocument();
  });
});

describe("localized empty and not-found states", () => {
  it("supports English and Korean empty-provider copy", async () => {
    const user = userEvent.setup();
    renderApp({ demo: false, empty: true, route: "/" });

    expect(
      await screen.findByRole("link", { name: /Open demo control plane/i }),
    ).toHaveAttribute("href", "/?demo=1");

    await user.click(
      screen.getByRole("button", { name: /Switch language to Korean/i }),
    );
    expect(
      await screen.findByRole("link", { name: "데모 control plane 열기" }),
    ).toHaveAttribute("href", "/?demo=1");
  });

  it("supports English and Korean route not-found copy", async () => {
    const user = userEvent.setup();
    renderApp({ demo: true, route: "/not-a-real-route?demo=1" });

    expect(await screen.findByText("Page not found")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to Today/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Switch language to Korean/i }),
    );
    expect(
      await screen.findByText("페이지를 찾을 수 없음"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "오늘로 돌아가기" }),
    ).toBeInTheDocument();
  });
});

describe("localized demo action feedback", () => {
  it("renders feedback copy in both languages", async () => {
    const user = userEvent.setup();
    renderApp({ route: "/review?demo=1" });

    await user.click(await screen.findByRole("button", { name: /Export/i }));
    expect(await screen.findByText("Export not available")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Switch language to Korean/i }),
    );
    await user.click(await screen.findByRole("button", { name: "내보내기" }));
    expect(
      await screen.findByText("내보내기는 아직 준비 중입니다"),
    ).toBeInTheDocument();
  });
});

describe("control-plane vocabulary surfaces", () => {
  it("shows Today actor/runtime and evidence columns", async () => {
    renderApp({ route: "/?demo=1" });

    expect(await screen.findByText("Actor / Runtime")).toBeInTheDocument();
    expect(screen.getByText("Evidence status")).toBeInTheDocument();
    expect(screen.getByText("Last evidence")).toBeInTheDocument();
    expect(screen.getAllByText("host_agent").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/runtime_attested|rejected|self_reported/).length,
    ).toBeGreaterThan(0);
  });

  it("shows Detail provenance, evidence ledger, and Retry confirmation", async () => {
    const user = userEvent.setup();
    renderApp({ route: "/cronlets/cl_backup?demo=1" });

    expect(await screen.findByText("Created by")).toBeInTheDocument();
    expect(screen.getByText("Last edited by")).toBeInTheDocument();
    expect(screen.getByText("Run actor")).toBeInTheDocument();
    expect(screen.getByText("Approval actor")).toBeInTheDocument();
    expect(screen.getByText("Evidence ledger")).toBeInTheDocument();
    expect(
      screen.getAllByText(/runtime_attested|rejected/).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Retry preview")).toBeInTheDocument();
    expect(
      screen.getByText("External action requires user approval before execution."),
    ).toBeInTheDocument();
  });

  it("locks Builder validation and visual contract composer", async () => {
    const user = userEvent.setup();
    renderApp({ route: "/builder?demo=1" });

    expect(await screen.findByText("Cronlet contract summary")).toBeInTheDocument();
    expect(screen.getByText("Weekly fire-time map")).toBeInTheDocument();
    expect(screen.getByText("Markers are fire times, not run duration.")).toBeInTheDocument();
    expect(screen.queryByText(".mc preview")).toBeNull();
    const create = screen.getByRole("button", { name: "Create Cronlet" });
    expect(create).toBeDisabled();
    expect(screen.getByText("Cronlet name is required.")).toBeInTheDocument();
    expect(screen.getByText("Actor/runtime is required.")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Name the Cronlet"),
      "Deploy Health Watch",
    );
    await user.type(
      screen.getByPlaceholderText("Describe the outcome and source limits"),
      "Check staging health and attach runtime evidence.",
    );
    await user.click(screen.getByRole("button", { name: "08:00" }));
    await user.selectOptions(
      screen.getByLabelText("Agent / runtime"),
      "k8s-cronjob",
    );

    expect(create).toBeEnabled();
    expect(screen.getByText("Runtime")).toBeInTheDocument();
    expect(screen.getByText("K8s CronJob")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Deploy Health Watch|0 8 \* \* 1-5/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Possible overlap: Morning Planning Reminder/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View contract" }));
    expect(await screen.findByText(".mc preview")).toBeInTheDocument();
    expect(document.body.textContent).toContain('"schema": "mycron/v0"');
    expect(document.body.textContent).toContain('"kind": "Cronlet"');
    expect(document.body.textContent).toContain('"schedule": "0 8 * * 1-5"');
    expect(document.body.textContent).toContain(
      '"client_ref": "k8s:deploy-health-watch"',
    );
    expect(document.body.textContent).toContain('"runtime_binding"');
    expect(document.body.textContent).toContain('"required_capabilities"');

    await user.click(screen.getByRole("button", { name: "Every interval" }));
    expect(document.body.textContent).toContain('"schedule": "0 */1 * * *"');
    expect(screen.getByText("Every 1 hour")).toBeInTheDocument();
    expect(screen.getByText(/Pattern: Every 1 hours?/)).toBeInTheDocument();
  });

  it("shows Inbox parsed contracts and Create Cronlet action", async () => {
    renderApp({ route: "/inbox?demo=1" });

    expect(await screen.findAllByText("Parsed contract")).toHaveLength(3);
    expect(screen.getByText("Every weekday · 08:00")).toBeInTheDocument();
    expect(screen.getByText(/host_agent:k8s-cronjob/)).toBeInTheDocument();
    expect(screen.getByText("Approval Gate required")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Create Cronlet/ }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Stage Cronlet/ })).toBeNull();
  });

  it("keeps seeded demo provenance in ADR-0006 DomainEvent shape", async () => {
    const [cronlet] = await new SeededDemoApi().listCronlets();

    expect(cronlet.createdEvent).toMatchObject({
      id: expect.stringMatching(/^aud_/),
      ts: expect.any(String),
      actor: { kind: "user", id: expect.any(String) },
      resource: "cronlet",
      action: "create",
      target_id: cronlet.id,
      outcome: expect.any(String),
    });
    expect(cronlet.latestRun.provenanceEvent).toMatchObject({
      id: expect.stringMatching(/^aud_/),
      ts: expect.any(String),
      actor: { kind: "host_agent", id: expect.any(String) },
      resource: "run",
      target_id: cronlet.latestRun.id,
      outcome: cronlet.latestRun.state,
    });
    expect(cronlet.latestRun.evidence[0]?.provenance).toMatch(
      /self_reported|runtime_attested|verified|rejected/,
    );
  });
});
