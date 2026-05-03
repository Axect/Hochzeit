#!/usr/bin/env tsx
/**
 * Verify content & config files have parallel ko/en/de coverage and required shape.
 * Exits non-zero on any missing key or shape violation. Wired as `prebuild`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Locale = 'ko' | 'en' | 'de';
const LOCALES: Locale[] = ['ko', 'en', 'de'];
const ROOT = resolve(import.meta.dirname, '..');

let failed = 0;
const fail = (msg: string) => {
  console.error(`✗ ${msg}`);
  failed += 1;
};
const ok = (msg: string) => console.log(`✓ ${msg}`);

const readJson = (rel: string): unknown => {
  const p = resolve(ROOT, rel);
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    fail(`cannot read/parse ${rel}: ${(e as Error).message}`);
    return null;
  }
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Walk reference (ko) tree and ensure same keys exist in target (en/de). */
const compareKeys = (ref: unknown, target: unknown, locale: Locale, path = '') => {
  if (isObj(ref)) {
    if (!isObj(target)) {
      fail(`[i18n/${locale}] ${path || '(root)'}: expected object`);
      return;
    }
    for (const k of Object.keys(ref)) {
      const childPath = path ? `${path}.${k}` : k;
      if (!(k in target)) {
        fail(`[i18n/${locale}] missing key: ${childPath}`);
        continue;
      }
      compareKeys((ref as Record<string, unknown>)[k], target[k], locale, childPath);
    }
  } else if (typeof ref === 'string') {
    if (typeof target !== 'string') {
      fail(`[i18n/${locale}] ${path}: expected string, got ${typeof target}`);
    } else if (target.trim() === '') {
      fail(`[i18n/${locale}] ${path}: empty string`);
    }
  }
};

// 1. i18n parallel coverage
const ko = readJson('src/data/i18n/ko.json');
const en = readJson('src/data/i18n/en.json');
const de = readJson('src/data/i18n/de.json');
if (ko && en && de) {
  compareKeys(ko, en, 'en');
  compareKeys(ko, de, 'de');
  if (failed === 0) ok('i18n ko/en/de keys are parallel');
}

// 2. Helper: every item in a list has localized field with all locales non-empty
const requireLocalizedField = (
  list: unknown,
  field: string,
  source: string,
) => {
  if (!Array.isArray(list)) {
    fail(`${source}: expected array`);
    return;
  }
  list.forEach((item, idx) => {
    if (!isObj(item)) return fail(`${source}[${idx}]: not an object`);
    const id = (item.id as string | undefined) ?? `index ${idx}`;
    const fieldVal = item[field];
    if (!isObj(fieldVal)) {
      fail(`${source}[${id}].${field}: expected object {ko,en,de}`);
      return;
    }
    for (const loc of LOCALES) {
      const v = fieldVal[loc];
      if (typeof v !== 'string' || v.trim() === '') {
        fail(`${source}[${id}].${field}.${loc}: missing or empty`);
      }
    }
  });
};

// 3. schedule.json
const schedule = readJson('src/data/schedule.json');
if (schedule && isObj(schedule)) {
  requireLocalizedField(schedule.items, 'title', 'schedule.items');
  if (Array.isArray(schedule.items)) {
    schedule.items.forEach((item, idx) => {
      if (isObj(item) && typeof item.time !== 'string') {
        fail(`schedule.items[${idx}].time: expected string`);
      }
    });
  }
}

// 4. gallery.json
const gallery = readJson('src/data/gallery.json');
if (gallery && isObj(gallery)) {
  requireLocalizedField(gallery.items, 'alt', 'gallery.items');
  if (Array.isArray(gallery.items)) {
    gallery.items.forEach((item, idx) => {
      if (!isObj(item)) return;
      if (typeof item.src !== 'string') fail(`gallery.items[${idx}].src: expected string`);
      if (typeof item.width !== 'number') fail(`gallery.items[${idx}].width: expected number`);
      if (typeof item.height !== 'number') fail(`gallery.items[${idx}].height: expected number`);
    });
  }
}

// 5. journey.json
const journey = readJson('src/data/journey.json');
if (journey && isObj(journey)) {
  if (!Array.isArray(journey.events)) {
    fail('journey.events: expected array');
  } else {
    requireLocalizedField(journey.events, 'title', 'journey.events');
    requireLocalizedField(journey.events, 'body', 'journey.events');
    journey.events.forEach((ev, idx) => {
      if (!isObj(ev)) return;
      const id = (ev.id as string | undefined) ?? `index ${idx}`;
      if (typeof ev.lat !== 'number' || ev.lat < -90 || ev.lat > 90) {
        fail(`journey.events[${id}].lat: not in [-90, 90]`);
      }
      if (typeof ev.lon !== 'number' || ev.lon < -180 || ev.lon > 180) {
        fail(`journey.events[${id}].lon: not in [-180, 180]`);
      }
      if (typeof ev.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
        fail(`journey.events[${id}].date: expected YYYY-MM-DD`);
      }
      if (!['letter', 'visit', 'trip', 'wedding'].includes(ev.kind as string)) {
        fail(`journey.events[${id}].kind: must be letter|visit|trip|wedding`);
      }
      // Optional `from` origin coordinate (e.g. first-letter Seoul → Mannheim).
      if (ev.from !== undefined) {
        if (
          !isObj(ev.from) ||
          typeof ev.from.lat !== 'number' ||
          typeof ev.from.lon !== 'number'
        ) {
          fail(`journey.events[${id}].from: must be {lat: number, lon: number}`);
        } else if (ev.from.lat < -90 || ev.from.lat > 90) {
          fail(`journey.events[${id}].from.lat: not in [-90, 90]`);
        } else if (ev.from.lon < -180 || ev.from.lon > 180) {
          fail(`journey.events[${id}].from.lon: not in [-180, 180]`);
        }
      }
      // photos: optional. If present, must be an array of {src, width, height, alt?}.
      if (ev.photos !== undefined) {
        if (!Array.isArray(ev.photos)) {
          fail(`journey.events[${id}].photos: must be an array (or omit)`);
        } else {
          ev.photos.forEach((p, pi) => {
            if (!isObj(p)) return fail(`journey.events[${id}].photos[${pi}]: not an object`);
            if (typeof p.src !== 'string') {
              fail(`journey.events[${id}].photos[${pi}].src: expected string`);
            }
            if (typeof p.width !== 'number') {
              fail(`journey.events[${id}].photos[${pi}].width: expected number`);
            }
            if (typeof p.height !== 'number') {
              fail(`journey.events[${id}].photos[${pi}].height: expected number`);
            }
            if (p.alt !== undefined && typeof p.alt !== 'string') {
              fail(`journey.events[${id}].photos[${pi}].alt: must be string when present`);
            }
          });
        }
      }
    });
  }
}

// 6. forms.json shape: rsvp and guestbook now have a per-locale `formUrl`.
const forms = readJson('src/config/forms.json');
if (forms && isObj(forms)) {
  for (const sectionKey of ['rsvp', 'guestbook'] as const) {
    const section = forms[sectionKey];
    if (!isObj(section)) {
      fail(`forms.${sectionKey}: missing or not an object`);
      continue;
    }
    for (const lang of LOCALES) {
      const langSection = section[lang];
      if (!isObj(langSection) || typeof langSection.formUrl !== 'string') {
        fail(`forms.${sectionKey}.${lang}.formUrl: missing or not a string`);
      }
    }
  }
}

// 7. venue.json shape
const venue = readJson('src/config/venue.json');
if (venue && isObj(venue)) {
  for (const f of ['name', 'hall', 'address'] as const) {
    if (!isObj(venue[f])) fail(`venue.${f}: expected localized object`);
    else
      LOCALES.forEach((loc) => {
        if (typeof (venue[f] as Record<string, unknown>)[loc] !== 'string') {
          fail(`venue.${f}.${loc}: missing`);
        }
      });
  }
  if (typeof venue.lat !== 'number' || typeof venue.lon !== 'number') {
    fail('venue.lat/lon: must be numbers');
  }
  if (!isObj(venue.accounts)) {
    fail('venue.accounts: expected object');
  }
}

if (failed > 0) {
  console.error(`\n✗ Content validation failed (${failed} issue${failed === 1 ? '' : 's'}).`);
  process.exit(1);
}
ok(`Content validation passed.`);
