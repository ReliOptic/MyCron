import type { MyCronApi } from "@contract/data/api";
import type {
  AlertPreference,
  ComputeBudget,
  Cronlet,
  CronletDraft,
  InboxRequest,
  Run,
  RunState,
  WeeklyReview,
  AccountProfile,
} from "@contract/types/mycron";
import { deriveRequiredEvidence } from "@contract/data/hooks";

const iso = (day: string, time: string) => `2026-06-${day}T${time}:00+09:00`;

const policy = (states: RunState[]) => [
  { id: "ran", label: "Process completes cleanly", detail: states[0] === "verified" ? "Agent exited 0 within the timeout window." : "Process did not finish cleanly before timeout.", state: states[0], required: true, producesEvidence: true },
  { id: "sources", label: "All required sources reached", detail: states[1] === "verified" ? "Every declared source returned valid data." : "At least one declared source was partial or unreachable.", state: states[1], producesEvidence: true },
  { id: "output", label: "Output artifact generated", detail: states[2] === "verified" ? "A non-empty file or message was produced and stored." : "The output exists but could not be proven complete.", state: states[2], producesEvidence: true },
  { id: "evidence", label: "Evidence captured & linked", detail: states[3] === "verified" ? "Delivery receipts and artifact refs were recorded to the manifest." : "Manifest is missing one or more proof refs.", state: states[3], producesEvidence: true },
  { id: "goal", label: "User goal confirmed", detail: states[4] === "verified" ? "Read-back confirmed goal satisfaction." : "Waiting for explicit read-back before counting as done.", state: states[4] },
];

function run(id: string, state: RunState, summary: string, states: RunState[], errorType?: string, costLabel = "$0.04"): Run {
  return {
    id,
    state,
    startedAt: iso("08", "09:01"),
    finishedAt: state === "failed" ? undefined : iso("08", "09:01:05"),
    durationLabel: state === "failed" ? "30s" : "4.2s",
    exitCode: state === "failed" ? 124 : 0,
    errorType,
    summary,
    donePolicy: policy(states),
    evidence: [
      { type: "file", label: state === "failed" ? "snapshot-check.txt" : "summary.pdf", meta: state === "failed" ? "0 KB · timeout before write" : "182 KB · generated 09:01:04", ref: state === "failed" ? "missing" : "stored", warn: state === "failed" },
      { type: "links", label: "Source manifest", meta: state === "unverified" ? "4 of 5 sources — 1 partial" : "5 of 5 sources reached", ref: state === "unverified" ? "partial" : "200 OK", warn: state === "unverified" },
      { type: "deliver", label: "Delivery receipt", meta: "MyCron Inbox + Telegram", ref: state === "failed" ? "not sent" : "receipt ✓", warn: state === "failed" },
      { type: "log", label: "Run log", meta: state === "failed" ? "84 lines · UpstreamTimeout" : "42 lines · 0 warnings", ref: "tail" },
    ],
    readbackCommand: `mycron verify ${id} --evidence`,
    costLabel,
  };
}

const cronletsSeed: Cronlet[] = [
  {
    id: "cl_backup",
    name: "Backup Health Check",
    icon: "shield",
    intent: "Probe storage backends and verify last snapshot is recent and restorable.",
    binding: { agent: "SafeAgent", runtime: "K8s CronJob" },
    scheduleLabel: "Daily · 10:30",
    cron: "30 10 * * *",
    timezone: "Asia/Seoul",
    nextRunLabel: "Retry queued · 10:45 KST",
    lastRunLabel: "Today · 10:30 KST",
    lastSuccessLabel: "2 days ago · Jun 6, 10:30",
    state: "failed",
    health: ["verified", "verified", "failed", "verified", "stale", "verified", "failed"],
    verifiedRate: 0.61,
    costLabel: "$0.12",
    latestRun: run("run_e09a7f3", "failed", "Storage health endpoint did not respond within 30s. No snapshot verified today.", ["failed", "failed", "failed", "failed", "unverified"], "UpstreamTimeout", "$0.02"),
  },
  {
    id: "cl_repo",
    name: "Weekly Repo Digest",
    icon: "git",
    intent: "Compile merged PRs, new issues and contributor stats into a weekly digest.",
    binding: { agent: "RepoAgent", runtime: "GitHub Actions" },
    scheduleLabel: "Mondays · 09:00",
    cron: "0 9 * * 1",
    timezone: "Asia/Seoul",
    nextRunLabel: "Overdue · expected 9 days ago",
    lastRunLabel: "9 days ago · May 30",
    lastSuccessLabel: "9 days ago · May 30",
    state: "stale",
    health: ["verified", null, null, null, null, null, null],
    verifiedRate: 0.33,
    costLabel: "$0.03",
    latestRun: run("run_a1b88c0", "stale", "The schedule did not fire on the expected Monday interval.", ["verified", "verified", "verified", "verified", "stale"], undefined, "$0.01"),
  },
  {
    id: "cl_oss",
    name: "OSS Trend Watch",
    icon: "git",
    intent: "Scan tracked repositories and release feeds, surface notable adoption shifts.",
    binding: { agent: "ResearchAgent", runtime: "Hermes Cloud" },
    scheduleLabel: "Daily · 14:00",
    cron: "0 14 * * *",
    timezone: "Asia/Seoul",
    nextRunLabel: "Tomorrow · 14:00 KST",
    lastRunLabel: "Today · 14:00 KST",
    state: "unverified",
    health: ["verified", "verified", "unverified", "verified", "verified", "unverified", "verified"],
    verifiedRate: 0.71,
    costLabel: "$0.08",
    latestRun: run("run_b710d4e", "unverified", "Run completed, but one upstream feed returned partial responses so the trend summary remains unproven.", ["verified", "unverified", "verified", "verified", "unverified"], undefined, "$0.05"),
  },
  {
    id: "cl_portfolio",
    name: "Daily Portfolio Brief",
    icon: "trend",
    intent: "Summarize overnight market moves and reconcile portfolio drift before the open.",
    binding: { agent: "FinAgent", runtime: "Hermes Cloud" },
    scheduleLabel: "Every weekday · 09:00",
    cron: "0 9 * * 1-5",
    timezone: "Asia/Seoul",
    nextRunLabel: "Tomorrow · 09:00 KST",
    lastRunLabel: "Today · 09:01 KST",
    state: "verified",
    health: ["verified", "verified", "verified", "verified", "verified", "stale", "verified"],
    verifiedRate: 0.92,
    costLabel: "$0.09",
    latestRun: run("run_8f2a91c", "verified", "Indices closed mixed; portfolio drift +0.4% vs target. Brief delivered with source refs.", ["verified", "verified", "verified", "verified", "verified"], undefined, "$0.04"),
  },
  {
    id: "cl_planning",
    name: "Morning Planning Reminder",
    icon: "sparkle",
    intent: "Assemble today's priorities from Obsidian + calendar and send a short agenda.",
    binding: { agent: "FocusAgent", runtime: "Local runner" },
    scheduleLabel: "Every weekday · 08:00",
    cron: "0 8 * * 1-5",
    timezone: "Asia/Seoul",
    nextRunLabel: "Tomorrow · 08:00 KST",
    lastRunLabel: "Today · 08:00 KST",
    state: "verified",
    health: ["verified", "verified", "verified", "verified", "verified", "verified", "verified"],
    verifiedRate: 1,
    costLabel: "$0.04",
    latestRun: run("run_3c5e120", "verified", "Agenda assembled from calendar, task notes and today's pinned priorities.", ["verified", "verified", "verified", "verified", "verified"], undefined, "$0.01"),
  },
  {
    id: "cl_inbox",
    name: "Inbox Triage",
    icon: "inbox",
    intent: "Classify new mail, draft replies for routine threads, flag anything needing human review.",
    binding: { agent: "MailAgent", runtime: "Hermes Cloud" },
    scheduleLabel: "Daily · 15:00",
    cron: "0 15 * * *",
    timezone: "Asia/Seoul",
    nextRunLabel: "In 38 min · 15:00 KST",
    lastRunLabel: "Today · 14:00 KST",
    state: "verified",
    health: ["verified", "verified", "verified", "stale", "verified", "verified", "verified"],
    verifiedRate: 0.86,
    costLabel: "$0.05",
    latestRun: run("run_55c1aa2", "verified", "12 messages classified; 3 replies drafted; one investor thread flagged for review.", ["verified", "verified", "verified", "verified", "verified"], undefined, "$0.03"),
  },
];

const inboxSeed: InboxRequest[] = [
  { id: "in_staging", text: "every morning check if my staging deploy is healthy and tell me", source: "Claude Code", capturedLabel: "2h ago" },
  { id: "in_pricing", text: "weekly, summarize what changed in the competitor pricing pages", source: "Telegram", capturedLabel: "1d ago" },
  { id: "in_oncall", text: "remind me to review the on-call rotation before each Monday", source: "Obsidian", capturedLabel: "3d ago" },
];

export class SeededDemoApi implements MyCronApi {
  private cronlets = structuredClone(cronletsSeed) as Cronlet[];
  private inbox = structuredClone(inboxSeed) as InboxRequest[];
  private alerts: AlertPreference[] = [
    { key: "failure", label: "Failure alerts", detail: "Notify the moment a run fails verification.", enabled: true },
    { key: "stale", label: "Stale drift warnings", detail: "Flag routines that silently stop firing on schedule.", enabled: true },
    { key: "review", label: "Weekly review digest", detail: "One honest read every Monday at 09:00.", enabled: true },
    { key: "completion", label: "Run completion summaries", detail: "A receipt when verified runs finish.", enabled: false },
  ];

  async listCronlets() { return this.cronlets; }
  async getCronlet(id: string) {
    const found = this.cronlets.find((c) => c.id === id);
    if (!found) throw new Error(`No demo cronlet ${id}`);
    return found;
  }
  async listRuns(cronletId: string) { return { runs: [(await this.getCronlet(cronletId)).latestRun] }; }
  async runNow(cronletId: string) { return { runId: (await this.getCronlet(cronletId)).latestRun.id }; }
  async pause() { return; }
  async resume() { return; }
  async retryRun(runId: string) { return { runId: `${runId}_retry` }; }
  async rearmSchedule() { return; }
  async escalate() { return; }
  async verifyRun() { return; }
  async createCronlet(draft: CronletDraft) {
    const newRun = run(`run_${Math.random().toString(16).slice(2, 9)}`, "unverified", "Created in demo mode. The next run has not produced proof yet.", ["unverified", "unverified", "unverified", "unverified", "unverified"], undefined, "$0.00");
    const cronlet: Cronlet = {
      id: `cl_${Date.now()}`,
      name: draft.name || "Untitled Cronlet",
      icon: "sparkle",
      intent: draft.intent || "No intent supplied yet.",
      binding: { agent: draft.agent || "Agent", runtime: "Demo runtime" },
      scheduleLabel: draft.scheduleLabel || "Schedule not set",
      cron: draft.cron || "",
      timezone: draft.timezone || "Asia/Seoul",
      nextRunLabel: "Preview only · not scheduled",
      lastRunLabel: "Never run",
      state: "unverified",
      health: [null, null, null, null, null, null, null],
      verifiedRate: 0,
      costLabel: "$0.00",
      latestRun: newRun,
    };
    this.cronlets = [cronlet, ...this.cronlets];
    return cronlet;
  }
  async updateCronlet(id: string, draft: Partial<CronletDraft>) {
    const c = await this.getCronlet(id);
    Object.assign(c, { name: draft.name ?? c.name, intent: draft.intent ?? c.intent });
    return c;
  }
  async previewSchedule(_cron: string, timezone: string, count: number) {
    return Array.from({ length: count }, (_, i) => `Mon Jun ${9 + i} · 08:00 · ${timezone}`);
  }
  async listInbox() { return this.inbox; }
  async dismissInbox(id: string) { this.inbox = this.inbox.filter((x) => x.id !== id); }
  async promoteInbox(id: string) {
    const req = this.inbox.find((x) => x.id === id);
    if (!req) throw new Error(`No inbox request ${id}`);
    const scheduleLabel = req.id === "in_pricing" ? "Mondays · 09:00" : "Every weekday · 08:00";
    const cron = scheduleLabel.startsWith("Mondays") ? "0 9 * * 1" : "0 8 * * 1-5";
    const donePolicy = { ran: true, sources: true, output: true, evidence: true, goal: false, noDrift: false };
    return {
      name: req.id === "in_staging" ? "Staging Deploy Watch" : req.text.split(",")[0] || "New Cronlet",
      intent: req.text,
      scheduleLabel,
      cron,
      timezone: "Asia/Seoul",
      agent: req.id === "in_staging" ? "OpsAgent" : "ResearchAgent",
      deliverTo: "MyCron Inbox + Telegram",
      donePolicy,
      requiredEvidence: deriveRequiredEvidence(donePolicy),
      seededFromInboxId: id,
    } satisfies CronletDraft;
  }
  async getWeeklyReview(): Promise<WeeklyReview> {
    return {
      rangeLabel: "Jun 2 – Jun 8",
      verifiedRuns: 18,
      totalRuns: 24,
      previousVerifiedRuns: 15,
      failed: 2,
      stale: 1,
      unverified: 3,
      costLabel: "$0.41",
      suggestions: [
        { id: "fix_backup", state: "failed", iconKey: "alert", title: "Backup Health Check failed twice", body: "Both failures were UpstreamTimeout. Add a 2× retry with backoff and auto-escalate if still failing.", actionLabel: "Apply fix", cronletId: "cl_backup" },
        { id: "fix_oss", state: "unverified", iconKey: "shield", title: "OSS Trend Watch can't prove completion", body: "github-trending returns partial responses in ~25% of runs. Mark optional or require it with a retry.", actionLabel: "Edit policy", cronletId: "cl_oss" },
        { id: "fix_repo", state: "stale", iconKey: "clock", title: "Weekly Repo Digest stopped firing 9 days ago", body: "The GitHub Actions trigger drifted with no error. Re-arm the schedule and enable silent-drift detection.", actionLabel: "Re-arm", cronletId: "cl_repo" },
      ],
      corrections: [
        { id: "corr_portfolio", title: "Confirmed Portfolio Brief output", detail: "Tue · marked goal satisfied", state: "verified" },
        { id: "corr_backup", title: "Re-ran Backup Health Check manually", detail: "Wed · escalated to on-call", state: "failed" },
      ],
    };
  }
  async applySuggestion() { return; }
  async getAccount(): Promise<AccountProfile> { return { id: "acct_demo", name: "Jiho Kang", email: "jiho@hermes.dev", plan: "PRO", avatarInitials: "JK" }; }
  async getComputeBudget(): Promise<ComputeBudget> { return { usedLabel: "$12.40", limitLabel: "$50", usedFraction: 0.25, routines: this.cronlets.length, runsPerWeek: 24, renewsLabel: "Jul 1" }; }
  async getAlertPreferences(): Promise<AlertPreference[]> { return this.alerts; }
  async setAlertPreference(key: string, enabled: boolean) {
    this.alerts = this.alerts.map((a) => a.key === key ? { ...a, enabled } : a);
  }
}
