import { NotImplementedError } from "@contract/data/provider";
import type { MyCronApi } from "@contract/data/api";
import type {
  AccountProfile,
  AlertPreference,
  ComputeBudget,
  Cronlet,
  CronletStagedInput,
  Run,
  WeeklyReview,
} from "@contract/types/mycron";
import { mapCronletRow, type CronletRow } from "./supabaseCronletMapper";

export type SupabaseSession = {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
};

type DbError = { message: string };
type SelectResult<T> = PromiseLike<{ data: T | null; error: DbError | null }>;
type CronletQuery = {
  eq(column: string, value: string): CronletQuery;
  order(column: string, opts: { ascending: boolean }): SelectResult<CronletRow[]>;
  maybeSingle(): SelectResult<CronletRow>;
};
export type SupabaseReadClient = {
  from(table: string): { select(columns: string): CronletQuery };
};

export class SupabaseApi implements MyCronApi {
  constructor(
    private readonly client: unknown,
    private readonly session: SupabaseSession,
  ) {}

  async listCronlets(): Promise<Cronlet[]> {
    const { data, error } = await readClient(this.client)
      .from("cronlets")
      .select("*")
      .eq("account_id", this.session.user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCronletRow);
  }

  async getCronlet(id: string): Promise<Cronlet> {
    const { data, error } = await readClient(this.client)
      .from("cronlets")
      .select("*")
      .eq("account_id", this.session.user.id)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error(`No cronlet "${id}" in this account`);
    return mapCronletRow(data);
  }

  async listRuns(): Promise<{ runs: Run[] }> {
    return { runs: [] };
  }

  async getAccount(): Promise<AccountProfile> {
    const name = stringMeta(this.session.user.user_metadata, "full_name");
    const email = this.session.user.email ?? "";
    return {
      id: this.session.user.id,
      name: name || email || "MyCron Account",
      email,
      plan: "FREE",
      avatarInitials: initials(name || email || "M"),
    };
  }

  async getComputeBudget(): Promise<ComputeBudget | null> {
    return null;
  }

  async getAlertPreferences(): Promise<AlertPreference[]> {
    return [];
  }

  async getWeeklyReview(): Promise<WeeklyReview> {
    return {
      rangeLabel: "",
      verifiedRuns: 0,
      totalRuns: 0,
      previousVerifiedRuns: 0,
      failed: 0,
      stale: 0,
      unverified: 0,
      costLabel: "",
      corrections: [],
      suggestions: [],
    };
  }

  async previewSchedule(): Promise<string[]> {
    return [];
  }

  runNow = () => unimplemented("runNow");
  pause = () => unimplemented("pause");
  resume = () => unimplemented("resume");
  retryRun = () => unimplemented("retryRun");
  rearmSchedule = () => unimplemented("rearmSchedule");
  notify = () => unimplemented("notify");
  verifyRun = () => unimplemented("verifyRun");
  createCronlet = (_input: CronletStagedInput) => unimplemented("createCronlet");
  updateCronlet = (_id: string, _input: Partial<CronletStagedInput>) =>
    unimplemented("updateCronlet");
  promoteInbox = () => unimplemented("promoteInbox");
  dismissInbox = () => unimplemented("dismissInbox");
  applySuggestion = () => unimplemented("applySuggestion");
  setAlertPreference = (_key: string, _enabled: boolean) =>
    unimplemented("setAlertPreference");
  listInbox = async () => [];
}

function stringMeta(value: Record<string, unknown> | undefined, key: string): string {
  const found = value?.[key];
  return typeof found === "string" ? found : "";
}

function initials(value: string): string {
  return value
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

function readClient(client: unknown): SupabaseReadClient {
  return client as SupabaseReadClient;
}

async function unimplemented(method: string): Promise<never> {
  throw new NotImplementedError(method);
}
