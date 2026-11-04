import { describe, expect, it, vi } from "vitest";

vi.mock("@raycast/api", () => ({
  getPreferenceValues: () => ({ url: "https://h.example", key: "hlp_x" }),
}));

import { endpoint, forToday, localStamp, parseRpc, type Entry } from "./homeloom";
import { pickLang } from "./i18n";
import { catalogs } from "../i18n/locales";

const e = (p: Partial<Entry>): Entry => ({ id: "1", visibility: "shared", author: "A", ...p });

describe("endpoint", () => {
  it("adds /mcp once", () => {
    expect(endpoint("https://h.example/")).toBe("https://h.example/mcp");
    expect(endpoint(" https://h.example ")).toBe("https://h.example/mcp");
  });
});

describe("parseRpc", () => {
  it("reads plain JSON", () => {
    expect(parseRpc('{"result":{"content":[{"text":"[]"}]}}').result?.content?.[0].text).toBe("[]");
  });
  it("reads an event stream", () => {
    const body = 'event: message\ndata: {"result":{"content":[{"text":"[1]"}]}}\n\n';
    expect(parseRpc(body).result?.content?.[0].text).toBe("[1]");
  });
});

describe("forToday", () => {
  const now = new Date(2026, 10, 4, 12, 0);
  it("splits overdue reminders from today's entries and drops the rest", () => {
    const r = forToday(
      [
        e({ id: "a", due: "2026-11-03T09:00" }),
        e({ id: "b", due: "2026-11-04T18:00" }),
        e({ id: "c", starts: "2026-11-04", all_day: true }),
        e({ id: "d", due: "2026-11-05T08:00" }),
        e({ id: "f", due: "2026-11-04T08:00", done: true }),
        e({ id: "g", starts: "2026-11-03T10:00" }),
      ],
      now,
    );
    expect(r.overdue.map((x) => x.id)).toEqual(["a"]);
    expect(r.today.map((x) => x.id)).toEqual(["c", "b"]);
  });
});

describe("localStamp", () => {
  it("formats local time", () => {
    expect(localStamp(new Date(2026, 0, 2, 3, 4))).toBe("2026-01-02T03:04");
  });
});

describe("i18n", () => {
  it("picks German only for German locales", () => {
    expect(pickLang("de-DE")).toBe("de");
    expect(pickLang("en-US")).toBe("en");
    expect(pickLang("fr-FR")).toBe("en");
  });
  it("has the same keys in both catalogs", () => {
    expect(Object.keys(catalogs.de).sort()).toEqual(Object.keys(catalogs.en).sort());
  });
});
