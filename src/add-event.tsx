import { Action, ActionPanel, Form, popToRoot, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { addEvent } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default function Command() {
  const [busy, setBusy] = useState(false);
  const [allDay, setAllDay] = useState(false);

  async function submit(v: {
    text: string;
    allDay: boolean;
    starts: Date | null;
    ends: Date | null;
    visibility: "private" | "shared";
  }) {
    if (!v.starts) return;
    if (v.ends && v.ends < v.starts) {
      await showToast({ style: Toast.Style.Failure, title: t("endBeforeStart") });
      return;
    }
    setBusy(true);
    try {
      await addEvent(v.text.trim(), v.visibility, v.starts, v.ends ?? undefined, v.allDay);
      await showToast({ style: Toast.Style.Success, title: t("eventAdded") });
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

  const type = allDay ? Form.DatePicker.Type.Date : Form.DatePicker.Type.DateTime;
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
      <Form.Checkbox id="allDay" label={t("allDayEvent")} value={allDay} onChange={setAllDay} />
      <Form.DatePicker id="starts" title={t("starts")} type={type} defaultValue={new Date()} />
      <Form.DatePicker id="ends" title={t("ends")} type={type} />
      <Form.Dropdown id="visibility" title={t("visibility")} defaultValue="shared">
        <Form.Dropdown.Item value="shared" title={t("shared")} />
        <Form.Dropdown.Item value="private" title={t("private")} />
      </Form.Dropdown>
    </Form>
  );
}
