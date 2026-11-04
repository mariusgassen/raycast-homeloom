import { catalogs, type Key } from "../i18n/locales";

/** German when the system language is German, English otherwise. */
export function pickLang(locale: string): "en" | "de" {
  return locale.toLowerCase().startsWith("de") ? "de" : "en";
}

const lang = pickLang(Intl.DateTimeFormat().resolvedOptions().locale);

export function t(key: Key, args: Record<string, string> = {}): string {
  let s: string = catalogs[lang][key] ?? catalogs.en[key];
  for (const [k, v] of Object.entries(args)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
