import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { completeReminder, forToday, listEntries, pageUrl, type Entry } from "./lib/homeloom";
import { t } from "./lib/i18n";

async function load() {
  const [reminders, events] = await Promise.all([listEntries("reminder"), listEntries("event")]);
  return forToday([...reminders, ...events], new Date());
}

const time = (e: Entry) => {
  const w = e.due ?? e.starts ?? "";
  return w.length > 10 ? w.slice(11, 16) : e.all_day ? t("allDay") : "";
};

export default function Command() {
  const { data, isLoading, revalidate } = useCachedPromise(load);
  const { url } = getPreferenceValues<{ url: string }>();

  async function done(e: Entry) {
    try {
      await completeReminder(e.id);
      revalidate();
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const row = (e: Entry) => (
    <List.Item
      key={e.id}
      icon={e.due ? Icon.Circle : Icon.Calendar}
      title={e.text ?? ""}
      accessories={[{ text: time(e) }, ...(e.for ? [{ tag: e.for }] : [])]}
      actions={
        <ActionPanel>
          {e.due && (
            <Action title={t("markDone")} icon={Icon.CheckCircle} onAction={() => done(e)} />
          )}
          <Action.OpenInBrowser
            title={t("openHomeloom")}
            url={pageUrl(url, `/lists?entry=${encodeURIComponent(e.id)}`)}
          />
        </ActionPanel>
      }
    />
  );

  const empty = !isLoading && !data?.overdue.length && !data?.today.length;
  return (
    <List isLoading={isLoading}>
      {empty && (
        <List.EmptyView
          title={t("nothingToday")}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url)} />
            </ActionPanel>
          }
        />
      )}
      {!!data?.overdue.length && (
        <List.Section title={t("overdue")}>{data.overdue.map(row)}</List.Section>
      )}
      {!!data?.today.length && (
        <List.Section title={t("today")}>{data.today.map(row)}</List.Section>
      )}
    </List>
  );
}
