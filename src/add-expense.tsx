import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import { addExpense, CATEGORIES, me, members, parseEuros, type Category } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default function Command() {
  const { data: people, isLoading } = useCachedPromise(members);
  const { data: self } = useCachedPromise(me);
  const [busy, setBusy] = useState(false);
  const [amountError, setAmountError] = useState<string>();

  async function submit(v: { amount: string; category: Category; paidBy: string; note: string }) {
    const cents = parseEuros(v.amount);
    if (!cents) {
      setAmountError(t("amountInvalid"));
      return;
    }
    setBusy(true);
    try {
      await addExpense({
        cents,
        category: v.category,
        paidBy: v.paidBy,
        ...(v.note.trim() ? { note: v.note.trim() } : {}),
      });
      await showToast({ style: Toast.Style.Success, title: t("expenseAdded") });
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
      <Form.TextField
        id="amount"
        title={t("amount")}
        placeholder="12,50"
        error={amountError}
        onChange={() => setAmountError(undefined)}
        autoFocus
      />
      <Form.Dropdown id="category" title={t("category")} defaultValue="groceries">
        {CATEGORIES.map((c) => (
          <Form.Dropdown.Item key={c} value={c} title={t(c)} />
        ))}
      </Form.Dropdown>
      <Form.TextField id="note" title={t("note")} />
      {people && self && (
        <Form.Dropdown id="paidBy" title={t("paidBy")} defaultValue={self.id}>
          {people.map((p) => (
            <Form.Dropdown.Item key={p.id} value={p.id} title={p.name} />
          ))}
        </Form.Dropdown>
      )}
    </Form>
  );
}
