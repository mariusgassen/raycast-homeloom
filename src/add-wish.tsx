import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { addWish, parseEuros } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default function Command() {
  const [busy, setBusy] = useState(false);
  const [priceError, setPriceError] = useState<string>();

  async function submit(v: { title: string; note: string; url: string; price: string }) {
    const cents = v.price.trim() ? parseEuros(v.price) : undefined;
    if (cents === null) {
      setPriceError(t("priceInvalid"));
      return;
    }
    setBusy(true);
    try {
      await addWish({
        title: v.title.trim(),
        ...(v.note.trim() ? { note: v.note.trim() } : {}),
        ...(v.url.trim() ? { url: v.url.trim() } : {}),
        ...(cents ? { priceCents: cents } : {}),
      });
      await showToast({ style: Toast.Style.Success, title: t("wishAdded") });
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
      <Form.TextField id="title" title={t("wishTitle")} autoFocus />
      <Form.TextField id="note" title={t("note")} />
      <Form.TextField id="url" title={t("link")} placeholder="https://" />
      <Form.TextField
        id="price"
        title={t("price")}
        error={priceError}
        onChange={() => setPriceError(undefined)}
      />
    </Form>
  );
}
