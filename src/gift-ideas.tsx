import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { giftGiven, listGiftIdeas, memberNames, type GiftIdea } from "./lib/homeloom";
import { t } from "./lib/i18n";

async function load() {
  const [ideas, names] = await Promise.all([listGiftIdeas(), memberNames()]);
  return { ideas, names };
}

export default function Command() {
  const { data, isLoading, revalidate } = useCachedPromise(load);

  async function mark(i: GiftIdea, given: boolean) {
    try {
      await giftGiven(i.id, given);
      revalidate();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const row = (i: GiftIdea) => (
    <List.Item
      key={i.id}
      icon={i.given ? Icon.CheckCircle : Icon.Gift}
      title={i.text}
      accessories={[{ tag: data?.names[i.forId] ?? "" }]}
      actions={
        <ActionPanel>
          {i.given ? (
            <Action title={t("ideaAgain")} icon={Icon.Circle} onAction={() => mark(i, false)} />
          ) : (
            <Action title={t("given")} icon={Icon.CheckCircle} onAction={() => mark(i, true)} />
          )}
        </ActionPanel>
      }
    />
  );

  const open = data?.ideas.filter((i) => !i.given) ?? [];
  const given = data?.ideas.filter((i) => i.given) ?? [];
  return (
    <List isLoading={isLoading} navigationTitle={t("justYou")}>
      {!isLoading && !data?.ideas.length && <List.EmptyView title={t("noGiftIdeas")} />}
      {open.length > 0 && <List.Section title={t("giftIdeas")}>{open.map(row)}</List.Section>}
      {given.length > 0 && <List.Section title={t("given")}>{given.map(row)}</List.Section>}
    </List>
  );
}
