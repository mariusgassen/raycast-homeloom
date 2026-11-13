import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { euros, getBalance, members, settleUp } from "./lib/homeloom";
import { t } from "./lib/i18n";

async function load() {
  const [balance, people] = await Promise.all([getBalance(), members()]);
  return { balance, names: Object.fromEntries(people.map((p) => [p.id, p.name])) };
}

export default function Command() {
  const { data, isLoading, revalidate } = useCachedPromise(load);
  const name = (id: string) => data?.names[id] ?? "?";

  async function settle(from: string, to: string, cents: number) {
    try {
      await settleUp(from, to, cents);
      await showToast({ style: Toast.Style.Success, title: t("settled") });
      revalidate();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const transfers = data?.balance.transfers ?? [];
  return (
    <List isLoading={isLoading}>
      {!isLoading && transfers.length === 0 && <List.EmptyView title={t("allEven")} />}
      <List.Section title={t("money")}>
        {transfers.map((x, i) => (
          <List.Item
            key={i}
            icon={Icon.Coins}
            title={t("owes", { from: name(x.from), to: name(x.to) })}
            accessories={[{ text: euros(x.cents) }]}
            actions={
              <ActionPanel>
                <Action
                  title={t("settleUp")}
                  icon={Icon.CheckCircle}
                  onAction={() => settle(x.from, x.to, x.cents)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
