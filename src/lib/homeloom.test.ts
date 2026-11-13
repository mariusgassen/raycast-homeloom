import { describe, expect, it, vi } from "vitest";

vi.mock("@raycast/api", () => ({
  getPreferenceValues: () => ({ url: "https://h.example" }),
  LocalStorage: {},
  OAuth: { RedirectMethod: { Web: "web" }, PKCEClient: class {} },
}));

import { forToday, pageUrl, parseEuros, type Entry } from "./homeloom";
import { issuerBase } from "./auth";
import { parseSse } from "./chat";
import { pickLang } from "./i18n";
import { catalogs } from "../i18n/locales";

const e = (p: Partial<Entry>): Entry => ({
  id: "1",
  kind: "reminder",
  visibility: "shared",
  authorId: "A",
  sealed: false,
  allDay: false,
  ...p,
});

describe("pageUrl", () => {
  it("builds app page URLs, also from the address Settings shows", () => {
    expect(pageUrl("https://h.example/mcp", "/lists")).toBe("https://h.example/lists");
    expect(pageUrl("https://h.example/")).toBe("https://h.example/");
  });
});

describe("issuerBase", () => {
  it("ends with one slash", () => {
    expect(issuerBase(" https://a.example/application/o/h ")).toBe(
      "https://a.example/application/o/h/",
    );
    expect(issuerBase("https://a.example/application/o/h//")).toBe(
      "https://a.example/application/o/h/",
    );
  });
});

describe("forToday", () => {
  const now = new Date(2026, 10, 4, 12, 0);
  it("splits overdue reminders from today's entries and drops the rest", () => {
    const r = forToday(
      [
        e({ id: "a", dueAt: new Date(2026, 10, 3, 9).toISOString() }),
        e({ id: "b", dueAt: new Date(2026, 10, 4, 18).toISOString() }),
        e({ id: "c", startsAt: new Date(2026, 10, 4, 0, 30).toISOString(), allDay: true }),
        e({ id: "d", dueAt: new Date(2026, 10, 5, 8).toISOString() }),
        e({
          id: "f",
          dueAt: new Date(2026, 10, 4, 8).toISOString(),
          doneAt: new Date(2026, 10, 4, 8, 5).toISOString(),
        }),
        e({ id: "g", startsAt: new Date(2026, 10, 3, 10).toISOString() }),
      ],
      now,
    );
    expect(r.overdue.map((x) => x.id)).toEqual(["a"]);
    expect(r.today.map((x) => x.id)).toEqual(["c", "b"]);
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

describe("parseSse", () => {
  it("returns complete events and keeps the rest", () => {
    const r = parseSse(
      'event: conversation\ndata: {"id":"c1"}\n\nevent: text\ndata: {"text":"Hi"}\n\nevent: te',
    );
    expect(r.events).toEqual([
      { event: "conversation", data: { id: "c1" } },
      { event: "text", data: { text: "Hi" } },
    ]);
    expect(r.rest).toBe("event: te");
  });
  it("skips events that are not JSON", () => {
    expect(parseSse("event: text\ndata: nope\n\n").events).toEqual([]);
  });
});

describe("parseEuros", () => {
  it("reads comma and dot amounts as cents", () => {
    expect(parseEuros("12,50")).toBe(1250);
    expect(parseEuros(" 12.5 ")).toBe(1250);
    expect(parseEuros("7")).toBe(700);
  });
  it("refuses anything else", () => {
    for (const bad of ["", "0", "-3", "1,234", "abc", "1e3"]) expect(parseEuros(bad)).toBeNull();
  });
});
