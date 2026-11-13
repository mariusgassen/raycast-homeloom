import {
  Action,
  ActionPanel,
  Form,
  getPreferenceValues,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { listEntries, pageUrl, updateNote, type Entry } from "./lib/homeloom";
import { t } from "./lib/i18n";

function Edit({ note, onSaved }: { note: Entry; onSaved: () => void }) {
  const { pop } = useNavigation();

  async function submit(v: { text: string; visibility: "private" | "shared" }) {
    try {
      await updateNote(note.id, v.text.trim(), v.visibility);
      await showToast({ style: Toast.Style.Success, title: t("noteSaved") });
      onSaved();
      pop();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title={t("save")} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="text" title={t("note")} defaultValue={note.text} autoFocus />
      <Form.Dropdown
        id="visibility"
        title={t("visibility")}
        defaultValue={note.visibility === "private" ? "private" : "shared"}
      >
        <Form.Dropdown.Item value="shared" title={t("shared")} />
        <Form.Dropdown.Item value="private" title={t("private")} />
      </Form.Dropdown>
    </Form>
  );
}

export default function Command() {
  const { data, isLoading, revalidate } = useCachedPromise(() => listEntries("note"));
  const { url } = getPreferenceValues<{ url: string }>();

  return (
    <List isLoading={isLoading} isShowingDetail searchBarPlaceholder={t("notes")}>
      {!isLoading && !data?.length && <List.EmptyView title={t("noNotes")} />}
      {data?.map((n) => (
        <List.Item
          key={n.id}
          icon={n.visibility === "private" ? Icon.Lock : Icon.Document}
          title={n.sealed ? t("sealedNote") : (n.title ?? n.text ?? "")}
          detail={<List.Item.Detail markdown={n.sealed ? "" : (n.text ?? "")} />}
          actions={
            <ActionPanel>
              {!n.sealed && n.visibility !== "reveal" && (
                <Action.Push
                  title={t("edit")}
                  icon={Icon.Pencil}
                  target={<Edit note={n} onSaved={revalidate} />}
                />
              )}
              {n.text && <Action.CopyToClipboard title={t("copyAnswer")} content={n.text} />}
              <Action.OpenInBrowser
                title={t("openHomeloom")}
                url={pageUrl(url, `/lists?entry=${encodeURIComponent(n.id)}`)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
