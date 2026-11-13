import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import { addGiftIdea, me, members } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default function Command() {
  const { data: people, isLoading } = useCachedPromise(members);
  const { data: self } = useCachedPromise(me);
  const [busy, setBusy] = useState(false);
  const others = (people ?? []).filter((p) => p.id !== self?.id);

  async function submit(v: { forId: string; text: string }) {
    setBusy(true);
    try {
      await addGiftIdea(v.forId, v.text.trim());
      await showToast({ style: Toast.Style.Success, title: t("giftIdeaAdded") });
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
      isLoading={busy || isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={t("add")} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.Description text={t("justYou")} />
      {others.length > 0 && (
        <Form.Dropdown id="forId" title={t("forWhom")}>
          {others.map((p) => (
            <Form.Dropdown.Item key={p.id} value={p.id} title={p.name} />
          ))}
        </Form.Dropdown>
      )}
      <Form.TextField id="text" title={t("giftIdea")} autoFocus />
    </Form>
  );
}
