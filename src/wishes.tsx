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
import { euros, listWishes, pageUrl, voteWish, wishGot, type Wish } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default function Command() {
  const { data, isLoading, revalidate } = useCachedPromise(listWishes);
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

  const row = (w: Wish) => (
    <List.Item
      key={w.id}
      icon={w.gotAt ? Icon.CheckCircle : Icon.Heart}
      title={w.title}
      subtitle={w.note}
      accessories={[
        ...(w.priceCents ? [{ text: euros(w.priceCents) }] : []),
        ...(w.gotAt ? [] : [{ tag: t("hearts", { n: String(w.hearts) }) }]),
      ]}
      actions={
        <ActionPanel>
          {w.gotAt ? (
            <Action
              title={t("wishAgain")}
              icon={Icon.Circle}
              onAction={() => run(wishGot(w.id, false))}
            />
          ) : (
            <>
              <Action
                title={t("cameTrue")}
                icon={Icon.CheckCircle}
                onAction={() => run(wishGot(w.id, true))}
              />
              {[1, 2, 3].map((n) => (
                <Action
                  key={n}
                  title={`${t("wantIt")} ${"♥".repeat(n)}`}
                  icon={Icon.Heart}
                  onAction={() => run(voteWish(w.id, n))}
                />
              ))}
            </>
          )}
          {w.url && <Action.OpenInBrowser title={t("link")} url={w.url} />}
          <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url)} />
        </ActionPanel>
      }
    />
  );

  const open = data?.filter((w) => !w.gotAt) ?? [];
  const got = data?.filter((w) => w.gotAt) ?? [];
  return (
    <List isLoading={isLoading}>
      {!isLoading && !data?.length && <List.EmptyView title={t("noWishes")} />}
      {open.length > 0 && <List.Section title={t("wishes")}>{open.map(row)}</List.Section>}
      {got.length > 0 && <List.Section title={t("cameTrue")}>{got.map(row)}</List.Section>}
    </List>
  );
}
