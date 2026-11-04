import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { addReminder } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default function Command() {
  const [busy, setBusy] = useState(false);

  async function submit(v: { text: string; due: Date | null; visibility: "private" | "shared" }) {
    setBusy(true);
    try {
      await addReminder(v.text.trim(), v.visibility, v.due ?? undefined);
      await showToast({ style: Toast.Style.Success, title: t("reminderAdded") });
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
      <Form.TextField id="text" title={t("text")} autoFocus />
      <Form.DatePicker id="due" title={t("due")} />
      <Form.Dropdown id="visibility" title={t("visibility")} defaultValue="shared">
        <Form.Dropdown.Item value="shared" title={t("shared")} />
        <Form.Dropdown.Item value="private" title={t("private")} />
      </Form.Dropdown>
    </Form>
  );
}
