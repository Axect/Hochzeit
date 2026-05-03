#!/usr/bin/env tsx
/**
 * Generate cryptographically random 12-character guest codes.
 *
 * Alphabet: lowercase letters + digits, with visually ambiguous characters
 * (i, l, o, 0, 1) excluded → 31 symbols. 12-character codes give
 * ~31^12 ≈ 7.9 × 10^17 possibilities (≈ 59 bits of entropy).
 *
 * Usage:
 *   npm run generate:codes -- --count 50
 *   npm run generate:codes -- --count 50 --append
 *
 * By default, prints codes to stdout. With --append, also adds skeleton entries
 * (with empty body fields) to data/letters.private.json so you can fill in
 * recipient names and letter bodies. The file is gitignored.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const CODE_LENGTH = 12;
const CODE_REGEX = /^[a-hjk-mnp-z2-9]{12}$/;

const generateCode = (): string => {
  let s = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    s += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return s;
};

const argFor = (name: string): string | undefined => {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx > -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('-')) {
    return process.argv[idx + 1];
  }
  return undefined;
};

const count = parseInt(argFor('count') ?? '10', 10);
const append = process.argv.includes('--append');
const printOnly = !append;

if (!Number.isFinite(count) || count <= 0 || count > 1000) {
  console.error('✗ --count must be a positive integer ≤ 1000');
  process.exit(1);
}

interface LetterRecord {
  code: string;
  recipient: string;
  body: { ko: string; en?: string; de?: string };
}

const PRIVATE_PATH = resolve(ROOT, 'data/letters.private.json');
const existingCodes = new Set<string>();
let existing: LetterRecord[] = [];

if (append && existsSync(PRIVATE_PATH)) {
  const raw = JSON.parse(readFileSync(PRIVATE_PATH, 'utf8')) as unknown;
  if (Array.isArray(raw)) {
    existing = raw as LetterRecord[];
    for (const e of existing) {
      if (typeof e.code === 'string') existingCodes.add(e.code);
    }
  }
}

const newCodes: string[] = [];
let attempts = 0;
while (newCodes.length < count) {
  attempts += 1;
  if (attempts > count * 100) {
    console.error('✗ Failed to generate enough unique codes — alphabet exhausted?');
    process.exit(1);
  }
  const c = generateCode();
  if (!CODE_REGEX.test(c)) continue;
  if (existingCodes.has(c)) continue;
  existingCodes.add(c);
  newCodes.push(c);
}

if (printOnly) {
  for (const c of newCodes) console.log(c);
  console.error(`\n✓ Generated ${newCodes.length} code(s).`);
  console.error(`  Use --append to also add skeleton entries to data/letters.private.json.`);
  process.exit(0);
}

const skeletons: LetterRecord[] = newCodes.map((code) => ({
  code,
  recipient: '',
  body: { ko: '', en: '', de: '' },
}));
const merged = [...existing, ...skeletons];

mkdirSync(dirname(PRIVATE_PATH), { recursive: true });
writeFileSync(PRIVATE_PATH, JSON.stringify(merged, null, 2) + '\n');
console.log(
  `✓ Appended ${newCodes.length} skeleton letter(s) to data/letters.private.json (total: ${merged.length}).`,
);
console.log(`  Edit the file to fill in 'recipient' and 'body.{ko,en,de}', then run \`npm run build:letters\`.`);
