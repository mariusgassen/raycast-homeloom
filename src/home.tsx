import {
  Action,
  ActionPanel,
  Color,
  getPreferenceValues,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import {
  activateScene,
  getHome,
  pageUrl,
  shortName,
  toggleLight,
  type Light,
  type Reading,
  type Room,
  type Scene,
} from "./lib/homeloom";
import { t } from "./lib/i18n";

function formatReading(r: Reading): string {
  if (r.value !== undefined) {
    const digits = r.kind === "temperature" ? 1 : 0;
    const n = new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(r.value);
    return r.unit ? `${n} ${r.unit}` : n;
  }
  return r.on ? t("open") : t("closed");
}

function readingIcon(kind: string): Icon {
  if (kind === "temperature") return Icon.Temperature;
  if (kind === "humidity") return Icon.Raindrop;
  if (kind === "window" || kind === "door" || kind === "garage_door") return Icon.Window;
  if (kind === "smoke" || kind === "moisture") return Icon.ExclamationMark;
  return Icon.Gauge;
}

export default function Command() {
  const { data, isLoading, mutate } = useCachedPromise(getHome);
  const { url } = getPreferenceValues<{ url: string }>();

  async function runToggle(l: Light) {
    try {
      await mutate(
        toggleLight(l.id).then((next) =>
          data
            ? {
                ...data,
                lights: data.lights.map((x) => (x.id === next.id ? { ...x, on: next.on } : x)),
              }
            : data,
        ),
        {
          optimisticUpdate(cur) {
            if (!cur) return cur;
            return {
              ...cur,
              lights: cur.lights.map((x) => (x.id === l.id ? { ...x, on: !x.on } : x)),
            };
          },
          shouldRevalidateAfter: false,
        },
      );
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function runAllOff() {
    const lit = data?.lights.filter((l) => l.on) ?? [];
    if (!lit.length) return;
    try {
      for (const l of lit) {
        await toggleLight(l.id);
      }
      await mutate();
      await showToast({ style: Toast.Style.Success, title: t("lightsOffDone") });
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function runScene(s: Scene) {
    try {
      await activateScene(s.id);
      await showToast({ style: Toast.Style.Success, title: t("sceneOn"), message: s.name });
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const open = <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url, "/home")} />;
  const lit = data?.lights.filter((l) => l.on).length ?? 0;
  const allOffAction =
    lit > 0 ? (
      <Action title={t("allLightsOff")} icon={Icon.LightBulbOff} onAction={runAllOff} />
    ) : null;

  if (!isLoading && data && !data.connected) {
    return (
      <List isLoading={isLoading}>
        <List.EmptyView
          icon={Icon.House}
          title={t("homeNotConnected")}
          description={t("homeConnectInApp")}
          actions={<ActionPanel>{open}</ActionPanel>}
        />
      </List>
    );
  }

  const looseScenes = data?.scenes.filter((s) => !s.room) ?? [];
  const otherLights = data?.lights.filter((l) => !l.room) ?? [];
  const otherReadings = data?.readings.filter((r) => !r.room) ?? [];
  const rooms: (Room | undefined)[] = [...(data?.rooms ?? []), undefined];

  const renderSection = (room: Room | undefined) => {
    const id = room?.id;
    const lights = room ? (data?.lights.filter((l) => l.room === id) ?? []) : otherLights;
    const scenes = room ? (data?.scenes.filter((s) => s.room === id) ?? []) : [];
    const readings = room ? (data?.readings.filter((r) => r.room === id) ?? []) : otherReadings;
    if (lights.length + scenes.length + readings.length === 0) return null;
    const title = room?.name ?? (data?.rooms.length ? t("other") : t("home"));
    return (
      <List.Section key={id ?? "_other"} title={title}>
        {lights.map((l) => (
          <List.Item
            key={l.id}
            icon={{ source: Icon.LightBulb, tintColor: l.on ? Color.Yellow : Color.SecondaryText }}
            title={shortName(l.name, room?.name)}
            accessories={[{ text: l.on ? t("on") : t("off") }]}
            actions={
              <ActionPanel>
                <Action
                  title={l.on ? t("turnOff") : t("turnOn")}
                  icon={Icon.Switch}
                  onAction={() => runToggle(l)}
                />
                {allOffAction}
                {open}
              </ActionPanel>
            }
          />
        ))}
        {scenes.map((s) => (
          <List.Item
            key={s.id}
            icon={Icon.Stars}
            title={shortName(s.name, room?.name)}
            accessories={[{ tag: t("scene") }]}
            actions={
              <ActionPanel>
                <Action title={t("activateScene")} icon={Icon.Stars} onAction={() => runScene(s)} />
                {allOffAction}
                {open}
              </ActionPanel>
            }
          />
        ))}
        {readings.map((r) => (
          <List.Item
            key={r.id}
            icon={readingIcon(r.kind)}
            title={shortName(r.name, room?.name)}
            accessories={[
              {
                text: formatReading(r),
                ...(r.on ? { icon: { source: Icon.CircleFilled, tintColor: Color.Orange } } : {}),
              },
            ]}
            actions={
              <ActionPanel>
                {open}
                {allOffAction}
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    );
  };

  return (
    <List isLoading={isLoading}>
      {!isLoading &&
        data &&
        data.scenes.length + data.lights.length + data.readings.length === 0 && (
          <List.EmptyView
            icon={Icon.House}
            title={t("homeEmpty")}
            actions={<ActionPanel>{open}</ActionPanel>}
          />
        )}
      {looseScenes.length > 0 && (
        <List.Section title={t("scenes")}>
          {looseScenes.map((s) => (
            <List.Item
              key={s.id}
              icon={Icon.Stars}
              title={s.name}
              actions={
                <ActionPanel>
                  <Action
                    title={t("activateScene")}
                    icon={Icon.Stars}
                    onAction={() => runScene(s)}
                  />
                  {allOffAction}
                  {open}
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
      {rooms.map((r) => renderSection(r))}
    </List>
  );
}
