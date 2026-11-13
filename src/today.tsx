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
import {
  completeReminder,
  forToday,
  listEntries,
  memberNames,
  pageUrl,
  type Entry,
} from "./lib/homeloom";
import { t } from "./lib/i18n";

async function load() {
  const [reminders, events, names] = await Promise.all([
    listEntries("reminder"),
    listEntries("event"),
    memberNames(),
  ]);
  return { ...forToday([...reminders, ...events], new Date()), names };
}

const time = (e: Entry) => {
  const w = e.dueAt ?? e.startsAt;
  if (e.allDay) return t("allDay");
  return w ? new Date(w).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
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
      icon={e.dueAt ? Icon.Circle : Icon.Calendar}
      title={e.text ?? ""}
      accessories={[
        { text: time(e) },
        ...(e.assigneeId && data?.names[e.assigneeId] ? [{ tag: data.names[e.assigneeId] }] : []),
      ]}
      actions={
        <ActionPanel>
          {e.dueAt && (
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
