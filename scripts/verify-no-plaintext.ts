#!/usr/bin/env tsx
/**
 * Walk dist/ and assert that no plaintext from data/letters.private.json
 * (recipient names, body bodies, codes) is present. Run after `npm run build`.
 *
 * This is the security smoke test for tasks 5.10 / 8.7.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');
const CODES_PATH = resolve(ROOT, 'data/codes.private.json');
const LEGACY_PATH = resolve(ROOT, 'data/letters.private.json');

interface LetterRecord {
  code: string;
  recipient: string;
  body: { ko: string; en?: string; de?: string };
}

interface CodesGuest {
  order: number;
  name: string;
  recipient?: string;
  body: { ko: string; en?: string; de?: string };
}

interface CodesFile {
  salt: string;
  guests: CodesGuest[];
}

const SCAN_EXTS = new Set([
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.txt',
  '.css',
  '.svg',
  '.xml',
  '.map',
]);
const MIN_PHRASE_LEN = 10; // ignore very short fragments to reduce false positives
const SAMPLE_LEN = 80;

const collectFiles = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) collectFiles(p, out);
    else if (SCAN_EXTS.has(extname(name))) out.push(p);
  }
  return out;
};

const splitIntoPhrases = (text: string): string[] => {
  // Split on whitespace runs, newlines, common punctuation; keep substrings of meaningful length.
  return text
    .split(/[\s\n\r\t.,;:!?“”‘’"\(\)\[\]\/]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= MIN_PHRASE_LEN);
};

if (process.argv.includes('--help')) {
  console.log('Usage: npm run verify:no-plaintext');
  process.exit(0);
}

/** Load private letter records from either codes.private.json (new) or letters.private.json (legacy). */
const loadRecords = (): { records: LetterRecord[]; codes: string[]; sourceLabel: string } | null => {
  // Prefer the new codes-based format (salt + guests with name/order).
  try {
    if (statSync(CODES_PATH).isFile()) {
      const raw = JSON.parse(readFileSync(CODES_PATH, 'utf8')) as Partial<CodesFile>;
      if (typeof raw.salt !== 'string' || !Array.isArray(raw.guests)) {
        console.error('✗ data/codes.private.json malformed.');
        process.exit(1);
      }
      const records: LetterRecord[] = raw.guests.map((g) => ({
        code: '', // codes are derived; we strip the alphabetised constraint check below
        recipient: (g.recipient ?? g.name).trim(),
        body: g.body,
      }));
      // We also collect the *names* (preimages of derived codes) as plaintext to forbid.
      const names = raw.guests.map((g) => g.name).filter((n): n is string => typeof n === 'string');
      return { records, codes: names, sourceLabel: 'codes.private.json' };
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
  // Legacy direct-code format.
  try {
    if (statSync(LEGACY_PATH).isFile()) {
      const parsed = JSON.parse(readFileSync(LEGACY_PATH, 'utf8')) as unknown;
      if (!Array.isArray(parsed)) {
        console.error('✗ data/letters.private.json is not an array.');
        process.exit(1);
      }
      const records = parsed as LetterRecord[];
      const codes = records.map((r) => r.code).filter((c): c is string => typeof c === 'string');
      return { records, codes, sourceLabel: 'letters.private.json' };
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
  return null;
};

const loaded = loadRecords();
if (!loaded) {
  console.log('• No private letter file — nothing to verify, treating as pass.');
  process.exit(0);
}
const raw = loaded.records;
const extraNeedles = loaded.codes;

if (raw.length === 0) {
  console.log(`• ${loaded.sourceLabel} has no entries — nothing to verify.`);
  process.exit(0);
}

try {
  statSync(DIST);
} catch {
  console.error('✗ dist/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

const needles = new Set<string>();
// Codes (legacy) or guest names (new format) — both must never appear in dist/
for (const c of extraNeedles) if (c) needles.add(c);
for (const r of raw) {
  if (typeof r.code === 'string' && r.code.length > 0) needles.add(r.code);
  if (typeof r.recipient === 'string' && r.recipient.length >= MIN_PHRASE_LEN) {
    needles.add(r.recipient.trim());
  }
  for (const lang of ['ko', 'en', 'de'] as const) {
    const body = r.body?.[lang];
    if (typeof body === 'string') {
      for (const phrase of splitIntoPhrases(body)) needles.add(phrase);
    }
  }
}
needles.delete('');

const files = collectFiles(DIST);
const violations: Array<{ file: string; needle: string; sample: string }> = [];

for (const f of files) {
  const content = readFileSync(f, 'utf8');
  for (const needle of needles) {
    const idx = content.indexOf(needle);
    if (idx >= 0) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(content.length, idx + needle.length + 20);
      const sample = content
        .slice(start, end)
        .replace(/\s+/g, ' ')
        .slice(0, SAMPLE_LEN);
      violations.push({ file: f.replace(ROOT + '/', ''), needle, sample });
    }
  }
}

if (violations.length > 0) {
  console.error(`✗ Plaintext leak: ${violations.length} occurrence(s) found in dist/.`);
  for (const v of violations.slice(0, 20)) {
    console.error(`  ${v.file}: "${v.needle.slice(0, 30)}…" → …${v.sample}…`);
  }
  if (violations.length > 20) console.error(`  …and ${violations.length - 20} more.`);
  process.exit(1);
}

console.log(
  `✓ No plaintext from ${raw.length} letter record(s) found in ${files.length} dist file(s).`,
);
