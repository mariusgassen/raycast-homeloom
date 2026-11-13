import { getPreferenceValues, LocalStorage } from "@raycast/api";
import { accessToken } from "./auth";
import { t } from "./i18n";

export type Visibility = "private" | "shared" | "reveal";

export interface Entry {
  id: string;
  kind: "note" | "reminder" | "event";
  text?: string;
  title?: string;
  sealed: boolean;
  visibility: Visibility;
  authorId: string;
  assigneeId?: string;
  dueAt?: string;
  startsAt?: string;
  endsAt?: string;
  allDay: boolean;
  doneAt?: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  recipe?: string;
  done: boolean;
}

interface Member {
  user: { id: string; name: string };
}

export class HomeloomError extends Error {}

interface Prefs {
  url: string;
}

/** Settings shows the address with /mcp on the end, so a pasted one is taken as it is. */
function base(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/mcp$/, "");
}

/** A page inside the Homeloom web app. */
export function pageUrl(url: string, path = "/"): string {
  return base(url) + path;
}

/** One call to the REST API as the signed-in person. */
export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { url } = getPreferenceValues<Prefs>();
  const token = await accessToken();
  let res: Response;
  try {
    res = await fetch(base(url) + "/v1" + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new HomeloomError(t("unreachable"));
  }
  if (res.status === 401) throw new HomeloomError(t("unauthorized"));
  if (!res.ok) {
    const e = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new HomeloomError(e?.message ?? t("failed"));
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

/** The same request, but the answer is left to the caller (a stream, say). */
export async function apiRaw(method: string, path: string, body?: unknown): Promise<Response> {
  const { url } = getPreferenceValues<Prefs>();
  const token = await accessToken();
  let res: Response;
  try {
    res = await fetch(base(url) + "/v1" + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream, application/json",
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new HomeloomError(t("unreachable"));
  }
  if (res.status === 401) throw new HomeloomError(t("unauthorized"));
  if (!res.ok) {
    const e = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new HomeloomError(e?.message ?? t("failed"));
  }
  return res;
}

const HOUSEHOLD = "household";

/** The household the person acts in: the one they belong to, or the first of several. */
export async function householdId(): Promise<string> {
  const cached = await LocalStorage.getItem<string>(HOUSEHOLD);
  if (cached) return cached;
  const all = await api<{ id: string }[]>("GET", "/households");
  if (all.length === 0) throw new HomeloomError(t("noHousehold"));
  await LocalStorage.setItem(HOUSEHOLD, all[0].id);
  return all[0].id;
}

/** The household's members, in the order Homeloom lists them. */
export async function members(): Promise<{ id: string; name: string }[]> {
  const h = await api<{ members: Member[] }>("GET", `/households/${await householdId()}`);
  return h.members.map((m) => m.user);
}

/** Member names by id, to say who a reminder is for. */
export async function memberNames(): Promise<Record<string, string>> {
  return Object.fromEntries((await members()).map((m) => [m.id, m.name]));
}

export const me = () => api<{ id: string; name: string }>("GET", "/me");

export const CATEGORIES = [
  "groceries",
  "dining",
  "home",
  "utilities",
  "transport",
  "travel",
  "fun",
  "health",
  "gifts",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Balance {
  members: { userId: string; cents: number }[];
  transfers: { from: string; to: string; cents: number }[];
}

/** "12,50" or "12.5" as cents; null when it isn't a positive amount. */
export function parseEuros(input: string): number | null {
  const s = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 ? cents : null;
}

export const euros = (cents: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(cents / 100);

export const inHousehold = async (path: string) => `/households/${await householdId()}${path}`;

export const listEntries = async (kind: "reminder" | "event" | "note") =>
  api<Entry[]>("GET", await inHousehold(`/entries?kind=${kind}`));
export const addReminder = async (text: string, visibility: "private" | "shared", due?: Date) =>
  api<Entry>("POST", await inHousehold("/entries"), {
    kind: "reminder",
    text,
    visibility,
    ...(due ? { dueAt: due.toISOString() } : {}),
  });
export const addEvent = async (
  text: string,
  visibility: "private" | "shared",
  starts: Date,
  ends?: Date,
  allDay = false,
) =>
  api<Entry>("POST", await inHousehold("/entries"), {
    kind: "event",
    text,
    visibility,
    startsAt: starts.toISOString(),
    allDay,
    ...(ends ? { endsAt: ends.toISOString() } : {}),
  });
export const addNote = async (text: string, visibility: "private" | "shared") =>
  api<Entry>("POST", await inHousehold("/entries"), { kind: "note", text, visibility });
export const completeReminder = (id: string) => api<Entry>("PUT", `/entries/${id}/done`);
export const listShopping = async () =>
  api<ShoppingItem[]>("GET", await inHousehold("/shopping-list"));
export const addToShopping = async (items: string[]) => {
  for (const text of items) {
    await api<ShoppingItem>("POST", await inHousehold("/shopping-list/items"), { text });
  }
  return listShopping();
};

/** Rewrites a note's text. A note that opens later keeps its time, so only plain ones are edited. */
export const updateNote = (id: string, text: string, visibility: "private" | "shared") =>
  api<Entry>("PUT", `/entries/${id}`, { text, visibility });

export const addExpense = async (e: {
  cents: number;
  category: Category;
  paidBy: string;
  note?: string;
}) => api<unknown>("POST", await inHousehold("/expenses"), e);
export const getBalance = async () => api<Balance>("GET", await inHousehold("/balance"));
export const settleUp = async (from: string, to: string, cents: number) =>
  api<unknown>("POST", await inHousehold("/settlements"), { from, to, cents });

export type Repeat = "never" | "daily" | "weekly" | "monthly" | "yearly";

export interface Chore {
  id: string;
  title: string;
  points: number;
  repeat: Repeat;
  assigneeId?: string;
  dueOn: string;
}

export const listChores = async () => api<Chore[]>("GET", await inHousehold("/chores"));
export const addChore = async (c: { title: string; points: number; repeat: Repeat }) =>
  api<Chore>("POST", await inHousehold("/chores"), c);
export const completeChore = async (id: string) =>
  api<unknown>("POST", await inHousehold(`/chores/${id}/done`));

export interface Wish {
  id: string;
  title: string;
  note: string;
  url: string;
  priceCents?: number;
  hearts: number;
  gotAt?: string;
}

export interface GiftIdea {
  id: string;
  forId: string;
  text: string;
  given: boolean;
}

export const listWishes = async () => api<Wish[]>("GET", await inHousehold("/wishes"));
export const addWish = async (w: {
  title: string;
  note?: string;
  url?: string;
  priceCents?: number;
}) => api<Wish>("POST", await inHousehold("/wishes"), w);
export const wishGot = async (id: string, got: boolean) =>
  api<Wish>(got ? "PUT" : "DELETE", await inHousehold(`/wishes/${id}/got`));
export const voteWish = async (id: string, hearts: number) =>
  api<Wish>("PUT", await inHousehold(`/wishes/${id}/vote`), { hearts });

/** Your own gift ideas, open ones first; nobody else ever sees them. */
export const listGiftIdeas = async () =>
  (await api<{ ideas: GiftIdea[] }>("GET", await inHousehold("/gifts"))).ideas;
export const addGiftIdea = async (forId: string, text: string) =>
  api<GiftIdea>("POST", await inHousehold("/gifts/ideas"), { forId, text });
export const giftGiven = async (id: string, given: boolean) =>
  api<GiftIdea>("PATCH", await inHousehold(`/gifts/ideas/${id}`), { given });

/** Ticks a shopping item off, or puts it back. */
export const tickShopping = async (id: string, done: boolean) =>
  api<ShoppingItem>(done ? "PUT" : "DELETE", await inHousehold(`/shopping-list/items/${id}/done`));

/** The local calendar day of a timestamp, YYYY-MM-DD. */
export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Reminders that are due today or earlier, and today's events; the rest is not for today. */
export function forToday(entries: Entry[], now: Date): { overdue: Entry[]; today: Entry[] } {
  const day = localDay(now);
  const overdue: Entry[] = [];
  const today: Entry[] = [];
  for (const e of entries) {
    if (e.doneAt) continue;
    const when = e.dueAt ?? e.startsAt;
    if (!when) continue;
    const d = localDay(new Date(when));
    if (d < day && e.dueAt) overdue.push(e);
    else if (d === day) today.push(e);
  }
  const byTime = (a: Entry, b: Entry) =>
    (a.dueAt ?? a.startsAt ?? "").localeCompare(b.dueAt ?? b.startsAt ?? "");
  return { overdue: overdue.sort(byTime), today: today.sort(byTime) };
}
