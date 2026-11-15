import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { addBucketItem, type BucketKind } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default function Command() {
  const [busy, setBusy] = useState(false);

  async function submit(v: { kind: string; text: string }) {
    const text = v.text.trim();
    if (!text) return;
    setBusy(true);
    try {
      await addBucketItem(v.kind as BucketKind, text);
      await showToast({ style: Toast.Style.Success, title: t("bucketAdded") });
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
      <Form.Dropdown id="kind" title={t("kind")} defaultValue="watch">
        <Form.Dropdown.Item value="watch" title={t("watch")} />
        <Form.Dropdown.Item value="read" title={t("read")} />
        <Form.Dropdown.Item value="visit" title={t("visit")} />
      </Form.Dropdown>
      <Form.TextField id="text" title={t("text")} autoFocus />
    </Form>
  );
}
