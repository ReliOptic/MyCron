import type { Cronlet, CronletStagedInput } from "@contract/types/mycron";

export type ScheduleMode = "weekday" | "daily" | "weekly" | "interval" | "custom";
export type IntervalUnit = "minutes" | "hours";

export interface ScheduleConfig {
  mode: ScheduleMode;
  time: string;
  weekday: string;
  intervalEvery: string;
  intervalUnit: IntervalUnit;
  customCron: string;
}

export interface ScheduleContextItem {
  id: string;
  name: string;
  label: string;
}

export interface TimelineMarker {
  id: string;
  dayIndex: number;
  dayLabel: string;
  minuteOfDay: number;
  topPct: number;
  label: string;
  source: "existing" | "selected";
  overlap: boolean;
}

export interface TimelineBand {
  id: string;
  label: string;
  source: "existing" | "selected";
  overlap: boolean;
}

export interface TimelineModel {
  days: string[];
  markers: TimelineMarker[];
  bands: TimelineBand[];
}

export const weekdayOptions = [
  { value: "1", label: "Monday", short: "Mon" },
  { value: "2", label: "Tuesday", short: "Tue" },
  { value: "3", label: "Wednesday", short: "Wed" },
  { value: "4", label: "Thursday", short: "Thu" },
  { value: "5", label: "Friday", short: "Fri" },
  { value: "6", label: "Saturday", short: "Sat" },
  { value: "0", label: "Sunday", short: "Sun" },
];

const dayOrder = ["1", "2", "3", "4", "5", "6", "0"];
const fallbackNow = new Date("2026-06-08T00:00:00+09:00");

export function blankSchedule(): ScheduleConfig {
  return {
    mode: "weekday",
    time: "",
    weekday: "1",
    intervalEvery: "1",
    intervalUnit: "hours",
    customCron: "",
  };
}

export function scheduleFromInput(input: CronletStagedInput): ScheduleConfig {
  if (input.cron === "0 8 * * 1-5") {
    return { ...blankSchedule(), mode: "weekday", time: "08:00" };
  }
  if (input.cron === "0 9 * * 1") {
    return { ...blankSchedule(), mode: "weekly", time: "09:00", weekday: "1" };
  }
  return input.cron
    ? { ...blankSchedule(), mode: "custom", customCron: input.cron }
    : blankSchedule();
}

export function deriveSchedule(config: ScheduleConfig) {
  if (config.mode === "custom") {
    const cron = config.customCron.trim();
    return { label: cron ? `Custom cron · ${cron}` : "", cron };
  }

  if (config.mode === "interval") {
    const every = Number(config.intervalEvery);
    if (!Number.isInteger(every) || every < 1) return { label: "", cron: "" };
    if (config.intervalUnit === "minutes") {
      if (every > 59) return { label: "", cron: "" };
      return {
        label: `Every ${every} minute${every === 1 ? "" : "s"}`,
        cron: `*/${every} * * * *`,
      };
    }
    if (every > 23) return { label: "", cron: "" };
    return {
      label: `Every ${every} hour${every === 1 ? "" : "s"}`,
      cron: `0 */${every} * * *`,
    };
  }

  const parsed = parseTime(config.time);
  if (!parsed) return { label: "", cron: "" };
  const { hour, minute } = parsed;
  if (config.mode === "daily") {
    return { label: `Daily · ${config.time}`, cron: `${minute} ${hour} * * *` };
  }
  if (config.mode === "weekly") {
    const day = weekdayOptions.find((option) => option.value === config.weekday) ?? weekdayOptions[0];
    return { label: `${day.label}s · ${config.time}`, cron: `${minute} ${hour} * * ${day.value}` };
  }
  return { label: `Every weekday · ${config.time}`, cron: `${minute} ${hour} * * 1-5` };
}

export function findScheduleContext(
  cron: string,
  cronlets: Pick<Cronlet, "id" | "name" | "cron" | "scheduleLabel">[],
): ScheduleContextItem[] {
  if (!cron.trim()) return [];
  const selected = parseCron(cron);
  return cronlets
    .map((cronlet) => ({ cronlet, parsed: parseCron(cronlet.cron) }))
    .filter(({ parsed }) => isScheduleOverlap(selected, parsed))
    .slice(0, 4)
    .map(({ cronlet }) => ({
      id: cronlet.id,
      name: cronlet.name,
      label: cronlet.scheduleLabel,
    }));
}

export function getTimelineModel(
  cronlets: Pick<Cronlet, "id" | "name" | "cron" | "scheduleLabel">[],
  selectedCron: string,
  now: Date = fallbackNow,
): TimelineModel {
  const days = weekLabels(now);
  const selected = parseCron(selectedCron);
  const selectedOverlaps = findScheduleContext(selectedCron, cronlets).map((item) => item.id);
  const markers: TimelineMarker[] = [];
  const bands: TimelineBand[] = [];

  for (const cronlet of cronlets) {
    const parsed = parseCron(cronlet.cron);
    if (!parsed) continue;
    if (isIntervalCron(parsed)) {
      bands.push({
        id: cronlet.id,
        label: `${cronlet.name} · ${cronlet.scheduleLabel}`,
        source: "existing",
        overlap: selectedOverlaps.includes(cronlet.id),
      });
      continue;
    }
    markers.push(
      ...cronToMarkers(parsed, cronlet.id, cronlet.name, "existing", selectedOverlaps.includes(cronlet.id), days),
    );
  }

  if (selected) {
    if (isIntervalCron(selected)) {
      bands.unshift({
        id: "selected",
        label: labelForCron(selectedCron),
        source: "selected",
        overlap: selectedOverlaps.length > 0,
      });
    } else {
      markers.push(
        ...cronToMarkers(selected, "selected", labelForCron(selectedCron), "selected", selectedOverlaps.length > 0, days),
      );
    }
  }

  return { days, markers, bands };
}

export function parseCron(cron: string) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cron.trim().split(/\s+/);
  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) return null;
  return { minute, hour, dayOfMonth, month, dayOfWeek };
}

export function isScheduleOverlap(
  selected: ReturnType<typeof parseCron>,
  existing: ReturnType<typeof parseCron>,
) {
  if (!selected || !existing) return false;
  if (selected.minute === existing.minute && selected.hour === existing.hour) {
    return dayOfWeekOverlap(selected.dayOfWeek, existing.dayOfWeek);
  }
  if (selected.minute.startsWith("*/") || existing.minute.startsWith("*/")) {
    return hourOverlap(selected.hour, existing.hour);
  }
  if (selected.hour.startsWith("*/") || existing.hour.startsWith("*/")) {
    return minuteOverlap(selected.minute, existing.minute);
  }
  return false;
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function cronToMarkers(
  parsed: NonNullable<ReturnType<typeof parseCron>>,
  id: string,
  label: string,
  source: "existing" | "selected",
  overlap: boolean,
  days: string[],
): TimelineMarker[] {
  if (!isExactTime(parsed.minute) || !isExactTime(parsed.hour)) return [];
  const minute = Number(parsed.minute);
  const hour = Number(parsed.hour);
  const minuteOfDay = hour * 60 + minute;
  return expandDayOfWeek(parsed.dayOfWeek)
    .map((day) => dayOrder.indexOf(day))
    .filter((dayIndex) => dayIndex >= 0)
    .map((dayIndex) => ({
      id: `${id}-${dayIndex}-${minuteOfDay}`,
      dayIndex,
      dayLabel: days[dayIndex] ?? "",
      minuteOfDay,
      topPct: Math.max(4, Math.min(96, (minuteOfDay / 1440) * 100)),
      label,
      source,
      overlap,
    }));
}

function labelForCron(cron: string) {
  const parsed = parseCron(cron);
  if (!parsed) return cron;
  if (parsed.minute.startsWith("*/")) return `Every ${parsed.minute.slice(2)} minutes`;
  if (parsed.hour.startsWith("*/")) return `Every ${parsed.hour.slice(2)} hours`;
  return cron;
}

function isIntervalCron(parsed: NonNullable<ReturnType<typeof parseCron>>) {
  return parsed.minute.startsWith("*/") || parsed.hour.startsWith("*/");
}

function isExactTime(value: string) {
  return /^\d+$/.test(value);
}

function minuteOverlap(a: string, b: string) {
  if (a === "*" || b === "*") return true;
  if (a.startsWith("*/") || b.startsWith("*/")) return true;
  return a === b;
}

function hourOverlap(a: string, b: string) {
  if (a === "*" || b === "*") return true;
  if (a.startsWith("*/") || b.startsWith("*/")) return true;
  return a === b;
}

function dayOfWeekOverlap(a: string, b: string) {
  const left = expandDayOfWeek(a);
  const right = expandDayOfWeek(b);
  return left.some((day) => right.includes(day));
}

function expandDayOfWeek(value: string) {
  if (value === "*" || value === "?") return ["0", "1", "2", "3", "4", "5", "6"];
  if (value.includes("-")) {
    const [start, end] = value.split("-").map(Number);
    if (Number.isInteger(start) && Number.isInteger(end)) {
      return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
    }
  }
  return value.split(",");
}

function weekLabels(now: Date) {
  // The injected date anchors labels only; fire calculation stays cron-derived.
  const anchor = new Date(now.getTime());
  return dayOrder.map((day, index) => {
    const option = weekdayOptions.find((item) => item.value === day);
    const dayNumber = anchor.getDate() + index;
    return `${option?.short ?? day} ${dayNumber}`;
  });
}
