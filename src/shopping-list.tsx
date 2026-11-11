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
import { useState } from "react";
import { addToShopping, listShopping, pageUrl } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default function Command() {
  const { data, isLoading, mutate } = useCachedPromise(listShopping);
  const [text, setText] = useState("");
  const { url } = getPreferenceValues<{ url: string }>();
  const item = text.trim();

  async function add() {
    try {
      await mutate(addToShopping([item]), { shouldRevalidateAfter: false });
      await showToast({ style: Toast.Style.Success, title: t("itemAdded"), message: item });
      setText("");
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const open = (
    <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url, "/lists?show=shopping")} />
  );
  const todo = (data ?? []).filter((i) => !i.done);
  const done = (data ?? []).filter((i) => i.done);

  return (
    <List
      isLoading={isLoading}
      searchText={text}
      onSearchTextChange={setText}
      searchBarPlaceholder={t("searchOrAdd")}
      filtering={false}
    >
      {item && (
        <List.Item
          icon={Icon.Plus}
          title={t("addNamed", { text: item })}
          actions={
            <ActionPanel>
              <Action title={t("add")} onAction={add} />
            </ActionPanel>
          }
        />
      )}
      {!isLoading && !item && todo.length === 0 && (
        <List.EmptyView title={t("shoppingEmpty")} actions={<ActionPanel>{open}</ActionPanel>} />
      )}
      <List.Section title={t("shopping")}>
        {todo.map((i, n) => (
          <List.Item
            key={`t${n}`}
            icon={Icon.Circle}
            title={i.text}
            subtitle={i.recipe}
            actions={<ActionPanel>{open}</ActionPanel>}
          />
        ))}
      </List.Section>
      {done.length > 0 && (
        <List.Section title={t("done")}>
          {done.map((i, n) => (
            <List.Item
              key={`d${n}`}
              icon={Icon.CheckCircle}
              title={i.text}
              actions={<ActionPanel>{open}</ActionPanel>}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
