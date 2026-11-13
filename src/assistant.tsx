import { Action, ActionPanel, Detail, Form, Icon, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { ask } from "./lib/chat";
import { t } from "./lib/i18n";

interface Turn {
  question: string;
  answer: string;
}

/** The whole conversation as Markdown, newest last. */
function transcript(turns: Turn[]): string {
  return turns.map((x) => `**${x.question}**\n\n${x.answer}`).join("\n\n---\n\n");
}

export default function Command() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(true);

  async function submit(v: { text: string }) {
    const question = v.text.trim();
    if (!question) return;
    const at = turns.length;
    setTurns((prev) => [...prev, { question, answer: "" }]);
    setAsking(false);
    setBusy(true);
    try {
      const chat = await ask(question, conversationId, (c) => {
        if (c.conversationId) setConversationId(c.conversationId);
        setTurns((prev) => prev.map((x, i) => (i === at ? { ...x, answer: c.text } : x)));
      });
      if (chat.conversationId) setConversationId(chat.conversationId);
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  if (asking) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm title={t("ask")} onSubmit={submit} />
          </ActionPanel>
        }
      >
        <Form.TextArea id="text" title={t("question")} autoFocus />
      </Form>
    );
  }

  const last = turns[turns.length - 1]?.answer;
  return (
    <Detail
      isLoading={busy}
      markdown={transcript(turns)}
      actions={
        <ActionPanel>
          {!busy && (
            <Action title={t("followUp")} icon={Icon.Message} onAction={() => setAsking(true)} />
          )}
          {last && <Action.CopyToClipboard title={t("copyAnswer")} content={last} />}
        </ActionPanel>
      }
    />
  );
}
