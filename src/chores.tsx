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
  completeChore,
  listChores,
  localDay,
  memberNames,
  pageUrl,
  type Chore,
} from "./lib/homeloom";
import { t } from "./lib/i18n";

async function load() {
  const [chores, names] = await Promise.all([listChores(), memberNames()]);
  return { chores, names };
}

export default function Command() {
  const { data, isLoading, revalidate } = useCachedPromise(load);
  const { url } = getPreferenceValues<{ url: string }>();
  const today = localDay(new Date());

  async function done(c: Chore) {
    try {
      await completeChore(c.id);
      await showToast({ style: Toast.Style.Success, title: t("choreDone"), message: c.title });
      revalidate();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const overdue = data?.chores.filter((c) => c.dueOn < today) ?? [];
  const rest = data?.chores.filter((c) => c.dueOn >= today) ?? [];
  const row = (c: Chore) => (
    <List.Item
      key={c.id}
      icon={Icon.Circle}
      title={c.title}
      accessories={[
        ...(c.assigneeId && data?.names[c.assigneeId] ? [{ tag: data.names[c.assigneeId] }] : []),
        { text: "★".repeat(c.points) },
        { text: new Date(`${c.dueOn}T00:00`).toLocaleDateString() },
      ]}
      actions={
        <ActionPanel>
          <Action title={t("markDone")} icon={Icon.CheckCircle} onAction={() => done(c)} />
          <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url)} />
        </ActionPanel>
      }
    />
  );

  return (
    <List isLoading={isLoading}>
      {!isLoading && !data?.chores.length && <List.EmptyView title={t("noChores")} />}
      {overdue.length > 0 && <List.Section title={t("overdue")}>{overdue.map(row)}</List.Section>}
      {rest.length > 0 && <List.Section title={t("chores")}>{rest.map(row)}</List.Section>}
    </List>
  );
}
