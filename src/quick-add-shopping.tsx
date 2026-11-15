import { LaunchProps, showHUD, showToast, Toast } from "@raycast/api";
import { addToShopping } from "./lib/homeloom";
import { t } from "./lib/i18n";

export default async function Command(props: LaunchProps<{ arguments: { item: string } }>) {
  const item = props.arguments.item.trim();
  if (!item) {
    await showToast({ style: Toast.Style.Failure, title: t("failed") });
    return;
  }
  try {
    await addToShopping([item]);
    await showHUD(`${t("itemAdded")}: ${item}`);
  } catch (e) {
    await showToast({
      style: Toast.Style.Failure,
      title: t("failed"),
      message: e instanceof Error ? e.message : undefined,
    });
  }
}
