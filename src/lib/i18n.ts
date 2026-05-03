import koMessages from '@data/i18n/ko.json';
import enMessages from '@data/i18n/en.json';
import deMessages from '@data/i18n/de.json';

export const LOCALES = ['ko', 'en', 'de'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';

const messages: Record<Locale, unknown> = {
  ko: koMessages,
  en: enMessages,
  de: deMessages,
};

export const isLocale = (v: unknown): v is Locale =>
  typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

/** Strip the leading locale segment from a URL pathname. */
export const stripLocale = (pathname: string): string => {
  for (const loc of LOCALES) {
    if (loc === DEFAULT_LOCALE) continue;
    if (pathname === `/${loc}` || pathname === `/${loc}/`) return '/';
    if (pathname.startsWith(`/${loc}/`)) return pathname.slice(loc.length + 1);
  }
  return pathname;
};

/** Build a URL pathname for the given locale, preserving the trailing path. */
export const localizedHref = (path: string, locale: Locale): string => {
  const clean = stripLocale(path);
  const tail = clean.startsWith('/') ? clean : `/${clean}`;
  if (locale === DEFAULT_LOCALE) return tail;
  // Avoid `/en//` if tail is `/`
  return tail === '/' ? `/${locale}/` : `/${locale}${tail}`;
};

/** Detect the active locale from a URL pathname. */
export const detectLocale = (pathname: string): Locale => {
  for (const loc of LOCALES) {
    if (loc === DEFAULT_LOCALE) continue;
    if (pathname === `/${loc}` || pathname === `/${loc}/` || pathname.startsWith(`/${loc}/`)) {
      return loc;
    }
  }
  return DEFAULT_LOCALE;
};

const lookup = (obj: unknown, key: string): unknown => {
  if (!key) return obj;
  return key.split('.').reduce<unknown>((acc, seg) => {
    if (acc && typeof acc === 'object' && seg in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[seg];
    }
    return undefined;
  }, obj);
};

/**
 * Translate a dot-path key for the active locale, falling back to the default
 * locale when missing. Throws in dev (via console.warn) so missing keys are
 * obvious; in prod the raw key is returned.
 */
export const t = (key: string, locale: Locale = DEFAULT_LOCALE): string => {
  const v = lookup(messages[locale], key);
  if (typeof v === 'string') return v;
  if (locale !== DEFAULT_LOCALE) {
    const fallback = lookup(messages[DEFAULT_LOCALE], key);
    if (typeof fallback === 'string') {
      if (typeof console !== 'undefined') {
        console.warn(`[i18n] missing ${locale}:${key}, falling back to ${DEFAULT_LOCALE}`);
      }
      return fallback;
    }
  }
  if (typeof console !== 'undefined') console.warn(`[i18n] missing key: ${key} (${locale})`);
  return key;
};

/** Resolve a localized object like `{ ko, en, de }` for the active locale. */
export const tField = <T = string>(
  field: Partial<Record<Locale, T>>,
  locale: Locale = DEFAULT_LOCALE,
): T | undefined => field[locale] ?? field[DEFAULT_LOCALE];

/** Format a date in the active locale. Accepts Date or ISO string. */
export const formatDate = (
  d: Date | string,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  const intlLocale =
    locale === 'ko' ? 'ko-KR' : locale === 'en' ? 'en-GB' : 'de-DE';
  return new Intl.DateTimeFormat(intlLocale, options ?? {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
};

/** Format a relative time ("3 hours ago") in the active locale. */
export const formatRelative = (
  d: Date | string,
  locale: Locale = DEFAULT_LOCALE,
  now: Date = new Date(),
): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  const intlLocale =
    locale === 'ko' ? 'ko-KR' : locale === 'en' ? 'en-GB' : 'de-DE';
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });
  const diffMs = date.getTime() - now.getTime();
  const sec = Math.round(diffMs / 1000);
  const abs = Math.abs(sec);
  if (abs < 60) return rtf.format(sec, 'second');
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(sec / 86400), 'day');
  if (abs < 86400 * 365) return rtf.format(Math.round(sec / (86400 * 30)), 'month');
  return rtf.format(Math.round(sec / (86400 * 365)), 'year');
};

/** Substitute `{name}` placeholders in a template. */
export const fmt = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

/** Map locale → BCP-47 tag for `<html lang>` and Intl APIs. */
export const htmlLang = (locale: Locale): string =>
  locale === 'ko' ? 'ko-KR' : locale === 'en' ? 'en-GB' : 'de-DE';
