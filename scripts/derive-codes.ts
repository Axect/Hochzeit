#!/usr/bin/env tsx
/**
 * Deterministic guest-code derivation.
 *
 * Two modes:
 *
 *   # Single derivation
 *   npm run derive:code -- --name "민수형" --order 1 --salt "<wedding-salt>"
 *
 *   # Batch from data/codes.private.json (default)
 *   npm run derive:codes
 *   npm run derive:codes -- --input data/codes.private.json
 *
 * The batch mode reads `salt` and `guests[]` from the input file and prints
 * one `<order>\t<name>\t<code>` line per guest to stdout. Codes are never
 * persisted to disk — they're regenerated on demand from the salt + guest
 * list, so losing the printed mapping is harmless as long as you keep
 * data/codes.private.json (which is gitignored).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { deriveCode, normalizeName } from './lib/code-derive';

const ROOT = resolve(import.meta.dirname, '..');

const argFor = (name: string): string | undefined => {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx > -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('-')) {
    return process.argv[idx + 1];
  }
  return undefined;
};

const singleName = argFor('name');

if (singleName !== undefined) {
  // Single mode: --name N --order O --salt S
  const orderRaw = argFor('order');
  const salt = argFor('salt');
  if (orderRaw === undefined || salt === undefined) {
    console.error('✗ Single mode requires --name, --order, and --salt.');
    process.exit(1);
  }
  const order = parseInt(orderRaw, 10);
  const code = deriveCode(singleName, order, salt);
  console.log(code);
  process.exit(0);
}

// Batch mode: read input file
const inputPath = resolve(ROOT, argFor('input') ?? 'data/codes.private.json');
if (!existsSync(inputPath)) {
  console.error(`✗ Input file not found: ${inputPath.replace(ROOT + '/', '')}`);
  console.error(`  See data/codes.private.example.json for the expected shape.`);
  process.exit(1);
}

interface InputGuest {
  order: number;
  name: string;
  recipient?: string;
  body?: { ko?: string; en?: string; de?: string };
}
interface InputFile {
  salt: string;
  guests: InputGuest[];
}

const raw = JSON.parse(readFileSync(inputPath, 'utf8')) as Partial<InputFile>;
if (typeof raw.salt !== 'string' || raw.salt.trim().length < 16) {
  console.error('✗ Input file is missing a `salt` of at least 16 characters.');
  process.exit(1);
}
if (!Array.isArray(raw.guests) || raw.guests.length === 0) {
  console.error('✗ Input file has no `guests`.');
  process.exit(1);
}

const seenOrders = new Set<number>();
const seenCodes = new Set<string>();
let bad = 0;

console.log(`# Derived from ${inputPath.replace(ROOT + '/', '')} — ${raw.guests.length} guest(s).`);
console.log(`# order\tname\tcode`);
for (const guest of raw.guests) {
  if (typeof guest.name !== 'string' || !normalizeName(guest.name)) {
    console.error(`✗ guest with order=${guest.order ?? '?'}: missing or empty name`);
    bad += 1;
    continue;
  }
  if (typeof guest.order !== 'number' || !Number.isInteger(guest.order) || guest.order < 0) {
    console.error(`✗ guest "${guest.name}": order must be a non-negative integer`);
    bad += 1;
    continue;
  }
  if (seenOrders.has(guest.order)) {
    console.error(`✗ guest "${guest.name}": duplicate order ${guest.order}`);
    bad += 1;
    continue;
  }
  seenOrders.add(guest.order);
  const code = deriveCode(guest.name, guest.order, raw.salt);
  if (seenCodes.has(code)) {
    console.error(
      `✗ guest "${guest.name}": derived code collides — change salt or order.`,
    );
    bad += 1;
    continue;
  }
  seenCodes.add(code);
  console.log(`${guest.order}\t${guest.name}\t${code}`);
}

if (bad > 0) {
  console.error(`\n✗ ${bad} bad entr${bad === 1 ? 'y' : 'ies'}.`);
  process.exit(1);
}
