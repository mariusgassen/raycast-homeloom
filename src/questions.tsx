import {
  Action,
  ActionPanel,
  Form,
  getPreferenceValues,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import {
  answerQuestion,
  askQuestion,
  listQuestions,
  me,
  memberNames,
  pageUrl,
  type Question,
} from "./lib/homeloom";
import { t } from "./lib/i18n";

function AnswerForm({
  question,
  initial,
  onSaved,
}: {
  question: Question;
  initial?: string;
  onSaved: () => void;
}) {
  const { pop } = useNavigation();
  const [busy, setBusy] = useState(false);

  async function submit(v: { answer: string }) {
    const text = v.answer.trim();
    if (!text) return;
    setBusy(true);
    try {
      await answerQuestion(question.id, text);
      await showToast({ style: Toast.Style.Success, title: t("answerSaved") });
      onSaved();
      pop();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
      setBusy(false);
    }
  }

  return (
    <Form
      isLoading={busy}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={t("save")} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.Description text={question.text} />
      <Form.TextArea id="answer" title={t("yourAnswer")} defaultValue={initial} autoFocus />
    </Form>
  );
}

function AskForm({ onAsked }: { onAsked: () => void }) {
  const { pop } = useNavigation();
  const [busy, setBusy] = useState(false);

  async function submit(v: { question: string }) {
    const text = v.question.trim();
    if (!text) return;
    setBusy(true);
    try {
      await askQuestion(text);
      await showToast({ style: Toast.Style.Success, title: t("questionAsked") });
      onAsked();
      pop();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
      setBusy(false);
    }
  }

  return (
    <Form
      isLoading={busy}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={t("ask")} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="question" title={t("question")} autoFocus />
    </Form>
  );
}

function questionMarkdown(q: Question, myId: string, names: Record<string, string>): string {
  const lines = [`### ${q.text}`, ""];
  if (q.revealed) {
    for (const a of q.answers) {
      const who = names[a.userId] ?? "";
      lines.push(`**${who}**: ${a.text ?? ""}`, "");
    }
  } else {
    const mine = q.answers.find((a) => a.userId === myId);
    if (mine?.text) {
      lines.push(`**${t("yourAnswer")}**: ${mine.text}`, "");
    }
    lines.push(`_${t("answersHiddenUntilOpen")}_`);
  }
  return lines.join("\n");
}

export default function Command() {
  const { data, isLoading, revalidate } = useCachedPromise(async () => {
    const [questions, current, names] = await Promise.all([listQuestions(), me(), memberNames()]);
    return { questions, myId: current.id, names };
  });
  const { url } = getPreferenceValues<{ url: string }>();

  const questions = data?.questions ?? [];
  const open = questions.filter((q) => !q.revealed);
  const revealed = questions.filter((q) => q.revealed);
  const askAction = (
    <Action.Push
      title={t("askQuestion")}
      icon={Icon.Plus}
      target={<AskForm onAsked={revalidate} />}
    />
  );
  const openInApp = (
    <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url, "/us?show=questions")} />
  );

  const row = (q: Question) => {
    const mine = q.answers.find((a) => a.userId === data?.myId);
    return (
      <List.Item
        key={q.id}
        icon={q.revealed ? Icon.Eye : mine ? Icon.Clock : Icon.Bubble}
        title={q.text}
        detail={
          <List.Item.Detail markdown={data ? questionMarkdown(q, data.myId, data.names) : q.text} />
        }
        actions={
          <ActionPanel>
            {!q.revealed && (
              <Action.Push
                title={mine ? t("editAnswer") : t("answer")}
                icon={Icon.Pencil}
                target={<AnswerForm question={q} initial={mine?.text} onSaved={revalidate} />}
              />
            )}
            {askAction}
            {openInApp}
          </ActionPanel>
        }
      />
    );
  };

  return (
    <List isLoading={isLoading} isShowingDetail>
      {!isLoading && questions.length === 0 && (
        <List.EmptyView
          title={t("noQuestions")}
          actions={
            <ActionPanel>
              {askAction}
              {openInApp}
            </ActionPanel>
          }
        />
      )}
      {open.length > 0 && <List.Section title={t("openQuestions")}>{open.map(row)}</List.Section>}
      {revealed.length > 0 && (
        <List.Section title={t("revealedQuestions")}>{revealed.map(row)}</List.Section>
      )}
    </List>
  );
}
