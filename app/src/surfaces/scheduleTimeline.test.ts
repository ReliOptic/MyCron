import { describe, expect, it } from "vitest";
import {
  deriveSchedule,
  findScheduleContext,
  getTimelineModel,
  type ScheduleConfig,
} from "./scheduleTimeline";

const existing = [
  {
    id: "cl_planning",
    name: "Morning Planning Reminder",
    cron: "0 8 * * 1-5",
    scheduleLabel: "Every weekday · 08:00",
  },
  {
    id: "cl_repo",
    name: "Weekly Repo Digest",
    cron: "0 9 * * 1",
    scheduleLabel: "Mondays · 09:00",
  },
];

describe("schedule timeline helpers", () => {
  it("derives cron from repeat config without reading system time", () => {
    const config: ScheduleConfig = {
      mode: "weekly",
      time: "14:30",
      weekday: "3",
      intervalEvery: "1",
      intervalUnit: "hours",
      customCron: "",
    };

    expect(deriveSchedule(config)).toEqual({
      label: "Wednesdays · 14:30",
      cron: "30 14 * * 3",
    });
  });

  it("builds deterministic fire markers from injected now", () => {
    const model = getTimelineModel(
      existing,
      "0 8 * * 1-5",
      new Date("2026-06-08T00:00:00+09:00"),
    );

    expect(model.days).toEqual([
      "Mon 8",
      "Tue 9",
      "Wed 10",
      "Thu 11",
      "Fri 12",
      "Sat 13",
      "Sun 14",
    ]);
    expect(model.markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "selected-0-480",
          dayIndex: 0,
          minuteOfDay: 480,
          source: "selected",
          overlap: true,
        }),
        expect.objectContaining({
          id: "cl_planning-0-480",
          dayIndex: 0,
          source: "existing",
          overlap: true,
        }),
      ]),
    );
  });

  it("keeps overlap advisory separate from validation", () => {
    expect(findScheduleContext("0 8 * * 1-5", existing)).toEqual([
      {
        id: "cl_planning",
        name: "Morning Planning Reminder",
        label: "Every weekday · 08:00",
      },
    ]);
    expect(findScheduleContext("15 7 * * 1-5", existing)).toEqual([]);
  });
});
