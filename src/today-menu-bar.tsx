import {
  getPreferenceValues,
  Icon,
  launchCommand,
  LaunchType,
  MenuBarExtra,
  open,
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

  const overdue = data?.overdue ?? [];
  const today = data?.today ?? [];
  const total = overdue.length + today.length;

  const row = (e: Entry) => {
    const sub = [time(e), e.assigneeId && data?.names[e.assigneeId]].filter(Boolean).join(" · ");
    const entryUrl = pageUrl(url, `/lists?entry=${encodeURIComponent(e.id)}`);
    return (
      <MenuBarExtra.Item
        key={e.id}
        icon={e.dueAt ? Icon.Circle : Icon.Calendar}
        title={e.text ?? ""}
        subtitle={sub || undefined}
        onAction={() => open(entryUrl)}
        alternate={
          e.dueAt ? (
            <MenuBarExtra.Item
              icon={Icon.CheckCircle}
              title={`${t("markDone")}: ${e.text ?? ""}`}
              onAction={() => done(e)}
            />
          ) : undefined
        }
      />
    );
  };

  return (
    <MenuBarExtra
      icon={Icon.Calendar}
      title={total > 0 ? String(total) : undefined}
      tooltip={total > 0 ? t("todayCount", { n: String(total) }) : t("nothingToday")}
      isLoading={isLoading}
    >
      {!isLoading && total === 0 && <MenuBarExtra.Item title={t("nothingToday")} />}
      {overdue.length > 0 && (
        <MenuBarExtra.Section title={t("overdue")}>{overdue.map(row)}</MenuBarExtra.Section>
      )}
      {today.length > 0 && (
        <MenuBarExtra.Section title={t("today")}>{today.map(row)}</MenuBarExtra.Section>
      )}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          icon={Icon.List}
          title={t("openToday")}
          onAction={() => launchCommand({ name: "today", type: LaunchType.UserInitiated })}
        />
        <MenuBarExtra.Item
          icon={Icon.Plus}
          title={t("addReminder")}
          onAction={() => launchCommand({ name: "add-reminder", type: LaunchType.UserInitiated })}
        />
        <MenuBarExtra.Item
          icon={Icon.Globe}
          title={t("openHomeloom")}
          onAction={() => open(pageUrl(url))}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
