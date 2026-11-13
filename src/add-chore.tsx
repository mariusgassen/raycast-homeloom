import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { addChore, type Repeat } from "./lib/homeloom";
import { t } from "./lib/i18n";

const REPEATS: Repeat[] = ["never", "daily", "weekly", "monthly", "yearly"];
const EFFORT = [
  [1, "small"],
  [2, "medium"],
  [3, "big"],
] as const;

export default function Command() {
  const [busy, setBusy] = useState(false);

  async function submit(v: { title: string; points: string; repeat: Repeat }) {
    setBusy(true);
    try {
      await addChore({ title: v.title.trim(), points: Number(v.points), repeat: v.repeat });
      await showToast({ style: Toast.Style.Success, title: t("choreAdded") });
      await popToRoot();
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
          <Action.SubmitForm title={t("add")} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title={t("text")} autoFocus />
      <Form.Dropdown id="points" title={t("effort")} defaultValue="2">
        {EFFORT.map(([n, k]) => (
          <Form.Dropdown.Item key={n} value={String(n)} title={t(k)} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="repeat" title={t("repeat")} defaultValue="never">
        {REPEATS.map((r) => (
          <Form.Dropdown.Item key={r} value={r} title={t(r)} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
