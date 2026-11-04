import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { addNote } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default function Command() {
  const [busy, setBusy] = useState(false);

  async function submit(v: { text: string; visibility: "private" | "shared" }) {
    setBusy(true);
    try {
      await addNote(v.text.trim(), v.visibility);
      await showToast({ style: Toast.Style.Success, title: t("noteAdded") });
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
      <Form.TextArea id="text" title={t("note")} info={t("noteHelp")} autoFocus />
      <Form.Dropdown id="visibility" title={t("visibility")} defaultValue="shared">
        <Form.Dropdown.Item value="shared" title={t("shared")} />
        <Form.Dropdown.Item value="private" title={t("private")} />
      </Form.Dropdown>
    </Form>
  );
}
