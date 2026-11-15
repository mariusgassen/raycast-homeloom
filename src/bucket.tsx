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
import {
  deleteBucketItem,
  listBucket,
  pageUrl,
  tickBucketItem,
  type BucketItem,
  type BucketKind,
} from "./lib/homeloom";
import { t } from "./lib/i18n";

const kindIcons: Record<BucketKind, Icon> = {
  watch: Icon.FilmStrip,
  read: Icon.Book,
  visit: Icon.Pin,
};

export default function Command() {
  const [kind, setKind] = useState<string>("all");
  const { data, isLoading, revalidate } = useCachedPromise(
    (filter: string) => listBucket(filter === "all" ? undefined : (filter as BucketKind)),
    [kind],
  );
  const { url } = getPreferenceValues<{ url: string }>();

  async function run(job: Promise<unknown>) {
    try {
      await job;
      revalidate();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const row = (item: BucketItem) => (
    <List.Item
      key={item.id}
      icon={item.done ? Icon.CheckCircle : kindIcons[item.kind]}
      title={item.text}
      accessories={[{ tag: t(item.kind) }]}
      actions={
        <ActionPanel>
          <Action
            title={item.done ? t("putBack") : t("markDone")}
            icon={item.done ? Icon.Circle : Icon.CheckCircle}
            onAction={() => run(tickBucketItem(item.id, !item.done))}
          />
          <Action
            title={t("remove")}
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={() => run(deleteBucketItem(item.id))}
          />
          <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url, "/bucket")} />
        </ActionPanel>
      }
    />
  );

  const open = data?.filter((i) => !i.done) ?? [];
  const done = data?.filter((i) => i.done) ?? [];

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip={t("kind")} value={kind} onChange={setKind}>
          <List.Dropdown.Item title={t("all")} value="all" />
          <List.Dropdown.Item title={t("watch")} value="watch" icon={Icon.FilmStrip} />
          <List.Dropdown.Item title={t("read")} value="read" icon={Icon.Book} />
          <List.Dropdown.Item title={t("visit")} value="visit" icon={Icon.Pin} />
        </List.Dropdown>
      }
    >
      {!isLoading && !data?.length && (
        <List.EmptyView
          title={t("noBucket")}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url, "/bucket")} />
            </ActionPanel>
          }
        />
      )}
      {open.length > 0 && <List.Section title={t("someday")}>{open.map(row)}</List.Section>}
      {done.length > 0 && <List.Section title={t("done")}>{done.map(row)}</List.Section>}
    </List>
  );
}
