import {
  Action,
  ActionPanel,
  Detail,
  Form,
  Icon,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import { ask, type Chat } from "./lib/chat";
import { t } from "./lib/i18n";

function Answer({ question, conversationId }: { question: string; conversationId?: string }) {
  const [chat, setChat] = useState<Chat>({ conversationId, text: "", done: false });
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const { push } = useNavigation();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    ask(question, conversationId, setChat).catch(async (e) => {
      setFailed(true);
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    });
  }, []);

  return (
    <Detail
      isLoading={!chat.done && !failed}
      markdown={`**${question}**\n\n${chat.text}`}
      actions={
        <ActionPanel>
          {chat.done && chat.conversationId && (
            <Action
              title={t("followUp")}
              icon={Icon.Message}
              onAction={() => push(<Question conversationId={chat.conversationId} />)}
            />
          )}
          {chat.text && <Action.CopyToClipboard title={t("copyAnswer")} content={chat.text} />}
        </ActionPanel>
      }
    />
  );
}

function Question({ conversationId }: { conversationId?: string }) {
  const { push } = useNavigation();
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={t("ask")}
            onSubmit={(v: { text: string }) => {
              const text = v.text.trim();
              if (text) push(<Answer question={text} conversationId={conversationId} />);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea id="text" title={t("question")} autoFocus />
    </Form>
  );
}

export default function Command() {
  return <Question />;
}
