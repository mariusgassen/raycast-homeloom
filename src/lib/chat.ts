import { apiRaw, HomeloomError, inHousehold } from "./homeloom";
import { t } from "./i18n";

export interface ChatEvent {
  event: string;
  data: unknown;
}

/** Splits an event stream into complete events; what is left over waits for more bytes. */
export function parseSse(buffer: string): { events: ChatEvent[]; rest: string } {
  const events: ChatEvent[] = [];
  const blocks = buffer.replace(/\r\n/g, "\n").split("\n\n");
  const rest = blocks.pop() ?? "";
  for (const block of blocks) {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    if (data.length === 0) continue;
    try {
      events.push({ event, data: JSON.parse(data.join("\n")) });
    } catch {
      // Not JSON: skip it rather than break the answer.
    }
  }
  return { events, rest };
}

export interface Chat {
  conversationId?: string;
  /** The answer so far. */
  text: string;
  done: boolean;
}

/** Asks the assistant and reports the answer as it grows. */
export async function ask(
  text: string,
  conversationId: string | undefined,
  onUpdate: (chat: Chat) => void,
): Promise<Chat> {
  const res = await apiRaw("POST", await inHousehold("/chat"), {
    text,
    ...(conversationId ? { conversationId } : {}),
  });
  if (!res.body) throw new HomeloomError(t("failed"));
  const chat: Chat = { conversationId, text: "", done: false };
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    const parsed = parseSse(buffer);
    buffer = parsed.rest;
    for (const { event, data } of parsed.events) {
      const d = data as { id?: string; text?: string; message?: string };
      if (event === "conversation" && d.id) chat.conversationId = d.id;
      else if (event === "text" && d.text) chat.text += d.text;
      else if (event === "done" && d.text) {
        chat.text = d.text;
        chat.done = true;
      } else if (event === "error") throw new HomeloomError(d.message ?? t("failed"));
    }
    onUpdate({ ...chat });
  }
  chat.done = true;
  onUpdate({ ...chat });
  return chat;
}
