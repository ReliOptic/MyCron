import { describe, expect, it } from "vitest";
import { conciseEnglishKeys, copy, primaryCopyKeys, t, type Language } from "./copy";

describe("copy dictionary", () => {
  it("exposes English and Korean labels for primary UI keys", () => {
    const languages: Language[] = ["en", "ko"];

    for (const lang of languages) {
      expect(copy[lang]).toBeDefined();
      for (const key of primaryCopyKeys) {
        expect(t(lang, key), `${lang}.${key}`).toEqual(expect.any(String));
        expect(t(lang, key).trim(), `${lang}.${key}`).not.toHaveLength(0);
      }
    }

    expect(t("en", "nav.today")).toBe("Today");
    expect(t("ko", "nav.today")).toBe("오늘");
    expect(t("ko", "nav.inbox")).toBe("요청함");
    expect(t("ko", "status.verified")).toBe("확인됨");
  });

  it("keeps English primary copy concise", () => {
    for (const key of conciseEnglishKeys.labels) {
      expect(t("en", key).length, key).toBeLessThanOrEqual(24);
    }

    for (const key of conciseEnglishKeys.statuses) {
      expect(t("en", key).length, key).toBeLessThanOrEqual(20);
    }

    for (const key of conciseEnglishKeys.summaries) {
      expect(t("en", key).length, key).toBeLessThanOrEqual(80);
    }
  });
});
