import { getPreferenceValues } from "@raycast/api";
import { t } from "./i18n";

export type Visibility = "private" | "shared" | "reveal";

export interface Entry {
  id: string;
  text?: string;
  sealed?: boolean;
  visibility: Visibility;
  author: string;
  for?: string;
  due?: string;
  starts?: string;
  ends?: string;
  all_day?: boolean;
  done?: boolean;
}

export interface ShoppingItem {
  text: string;
  recipe?: string;
  done?: boolean;
}

export class HomeloomError extends Error {}

interface Prefs {
  url: string;
  key: string;
}

/** The server's MCP endpoint is stateless, so one POST is one tool call. */
export function endpoint(url: string): string {
  return url.trim().replace(/\/+$/, "") + "/mcp";
}

/** The answer is JSON or a one-message event stream, depending on the server. */
export function parseRpc(body: string): {
  result?: { isError?: boolean; content?: { text?: string }[] };
  error?: { message: string };
} {
  const trimmed = body.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const data = trimmed
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim())
    .filter(Boolean);
  if (data.length === 0) throw new HomeloomError(t("failed"));
  return JSON.parse(data[data.length - 1]);
}

export async function callTool<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { url, key } = getPreferenceValues<Prefs>();
  let res: Response;
  try {
    res = await fetch(endpoint(url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${key.trim()}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: args },
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new HomeloomError(t("unreachable"));
  }
  if (res.status === 401) throw new HomeloomError(t("unauthorized"));
  if (!res.ok) throw new HomeloomError(t("unreachable"));
  const rpc = parseRpc(await res.text());
  const text = rpc.result?.content?.[0]?.text ?? "";
  if (rpc.error || rpc.result?.isError)
    throw new HomeloomError(rpc.error?.message ?? (text || t("failed")));
  return (text ? JSON.parse(text) : null) as T;
}

/** Local time as the server wants it: YYYY-MM-DDTHH:MM. */
export function localStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const listEntries = (kind: "reminder" | "event" | "note") =>
  callTool<Entry[]>("list_entries", { kind });
export const addReminder = (text: string, visibility: "private" | "shared", due?: Date) =>
  callTool("add_reminder", { text, visibility, ...(due ? { due: localStamp(due) } : {}) });
export const addNote = (text: string, visibility: "private" | "shared") =>
  callTool("add_note", { text, visibility });
export const completeReminder = (id: string) => callTool("complete_reminder", { id });
export const listShopping = () => callTool<ShoppingItem[]>("list_shopping");
export const addToShopping = (items: string[]) =>
  callTool<ShoppingItem[]>("add_to_shopping_list", { items });

/** Reminders that are due today or earlier, and today's events; the rest is not for today. */
export function forToday(entries: Entry[], now: Date): { overdue: Entry[]; today: Entry[] } {
  const day = localStamp(now).slice(0, 10);
  const overdue: Entry[] = [];
  const today: Entry[] = [];
  for (const e of entries) {
    if (e.done) continue;
    const when = e.due ?? e.starts;
    if (!when) continue;
    const d = when.slice(0, 10);
    if (d < day && e.due) overdue.push(e);
    else if (d === day) today.push(e);
  }
  const byTime = (a: Entry, b: Entry) =>
    (a.due ?? a.starts ?? "").localeCompare(b.due ?? b.starts ?? "");
  return { overdue: overdue.sort(byTime), today: today.sort(byTime) };
}
