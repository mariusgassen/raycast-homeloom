import {
  Action,
  ActionPanel,
  Detail,
  Form,
  getPreferenceValues,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import {
  addRecipeToShopping,
  getMealPlan,
  getRecipe,
  localDay,
  pageUrl,
  planMeal,
  rateRecipe,
  suggestRecipes,
  unplanMeal,
  type CookSuggestion,
  type PlannedMeal,
  type Recipe,
  type RecipeSummary,
} from "./lib/homeloom";
import { t } from "./lib/i18n";

function dayLabel(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function recipeMarkdown(r: Recipe): string {
  const parts = [`# ${r.name}`];
  const meta = [r.totalTime, r.servings].filter(Boolean).join(" · ");
  if (meta) parts.push(`_${meta}_`);
  if (r.description) parts.push(r.description);
  if (r.ingredients.length) {
    parts.push(`## ${t("ingredients")}`, ...r.ingredients.map((i) => `- ${i.text}`));
  }
  if (r.steps.length) {
    parts.push(`## ${t("steps")}`, ...r.steps.map((s, idx) => `${idx + 1}. ${s}`));
  }
  return parts.join("\n\n");
}

function RecipeDetail({ recipe }: { recipe: RecipeSummary }) {
  const { data, isLoading } = useCachedPromise(getRecipe, [recipe.slug]);
  const { url } = getPreferenceValues<{ url: string }>();

  async function addIngredients() {
    const r = data ?? (await getRecipe(recipe.slug));
    if (!r.ingredients.length) return;
    try {
      const res = await addRecipeToShopping(
        r.slug,
        r.ingredients.map((i) => i.id),
      );
      await showToast({
        style: Toast.Style.Success,
        title: t("ingredientsAdded", { n: String(res.added) }),
      });
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function rate(value: "love" | "fine" | "nope") {
    try {
      await rateRecipe(recipe.slug, value);
      await showToast({ style: Toast.Style.Success, title: t("rated") });
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <Detail
      isLoading={isLoading}
      markdown={data ? recipeMarkdown(data) : `# ${recipe.name}`}
      actions={
        <ActionPanel>
          <Action title={t("addIngredients")} icon={Icon.Cart} onAction={addIngredients} />
          <Action title={t("rateLove")} icon={Icon.Heart} onAction={() => rate("love")} />
          <Action title={t("rateFine")} icon={Icon.Check} onAction={() => rate("fine")} />
          <Action title={t("rateNope")} icon={Icon.XMarkCircle} onAction={() => rate("nope")} />
          <Action.OpenInBrowser
            title={t("openHomeloom")}
            url={pageUrl(url, `/cook/${encodeURIComponent(recipe.slug)}`)}
          />
        </ActionPanel>
      }
    />
  );
}

function SuggestView({ onPlanned }: { onPlanned: () => void }) {
  const { pop } = useNavigation();
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<CookSuggestion[] | null>(null);
  const { url } = getPreferenceValues<{ url: string }>();

  async function submit(v: { mood: string }) {
    setBusy(true);
    try {
      const res = await suggestRecipes(v.mood.trim());
      setResults(res.suggestions);
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function planToday(slug: string) {
    try {
      await planMeal(localDay(new Date()), slug);
      await showToast({ style: Toast.Style.Success, title: t("plannedForToday") });
      onPlanned();
      pop();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  if (results) {
    return (
      <List isLoading={busy}>
        {results.length === 0 && (
          <List.EmptyView
            title={t("noDinnerIdeas")}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url, "/cook")} />
              </ActionPanel>
            }
          />
        )}
        {results.map((s) => (
          <List.Item
            key={s.recipe.slug}
            icon={Icon.Stars}
            title={s.recipe.name}
            subtitle={s.reason ?? s.recipe.totalTime}
            actions={
              <ActionPanel>
                <Action.Push
                  title={t("viewRecipe")}
                  icon={Icon.Book}
                  target={<RecipeDetail recipe={s.recipe} />}
                />
                <Action
                  title={t("planToday")}
                  icon={Icon.Calendar}
                  onAction={() => planToday(s.recipe.slug)}
                />
                <Action.OpenInBrowser
                  title={t("openHomeloom")}
                  url={pageUrl(url, `/cook/${encodeURIComponent(s.recipe.slug)}`)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List>
    );
  }

  return (
    <Form
      isLoading={busy}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={t("suggestDinners")} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="mood"
        title={t("cookMood")}
        placeholder={t("cookMoodPlaceholder")}
        autoFocus
      />
    </Form>
  );
}

export default function Command() {
  const today = localDay(new Date());
  const { data, isLoading, revalidate } = useCachedPromise(() => getMealPlan(today, 7));
  const { url } = getPreferenceValues<{ url: string }>();

  async function remove(meal: PlannedMeal) {
    try {
      await unplanMeal(meal.day);
      revalidate();
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function addIngredients(meal: PlannedMeal) {
    try {
      const r = await getRecipe(meal.recipe.slug);
      if (!r.ingredients.length) return;
      const res = await addRecipeToShopping(
        r.slug,
        r.ingredients.map((i) => i.id),
      );
      await showToast({
        style: Toast.Style.Success,
        title: t("ingredientsAdded", { n: String(res.added) }),
      });
    } catch (e) {
      await showToast({
        style: Toast.Style.Failure,
        title: t("failed"),
        message: e instanceof Error ? e.message : undefined,
      });
    }
  }

  const suggestAction = (
    <Action.Push
      title={t("suggestDinners")}
      icon={Icon.Stars}
      target={<SuggestView onPlanned={revalidate} />}
    />
  );
  const open = <Action.OpenInBrowser title={t("openHomeloom")} url={pageUrl(url, "/cook")} />;

  return (
    <List isLoading={isLoading}>
      {!isLoading && !data?.length && (
        <List.EmptyView
          title={t("noMealsPlanned")}
          actions={
            <ActionPanel>
              {suggestAction}
              {open}
            </ActionPanel>
          }
        />
      )}
      {data?.map((m) => (
        <List.Item
          key={m.day}
          icon={m.day === today ? Icon.Star : Icon.Calendar}
          title={m.recipe.name}
          subtitle={dayLabel(m.day)}
          accessories={m.recipe.totalTime ? [{ text: m.recipe.totalTime }] : []}
          actions={
            <ActionPanel>
              <Action.Push
                title={t("viewRecipe")}
                icon={Icon.Book}
                target={<RecipeDetail recipe={m.recipe} />}
              />
              <Action
                title={t("addIngredients")}
                icon={Icon.Cart}
                onAction={() => addIngredients(m)}
              />
              {suggestAction}
              <Action
                title={t("unplan")}
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => remove(m)}
              />
              {open}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
