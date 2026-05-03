#!/usr/bin/env tsx
/**
 * Encrypt per-guest letters into src/data/letters.encrypted.json.
 *
 * Two input formats are accepted (in order of precedence):
 *
 *   1. data/codes.private.json — preferred. Salt + guest list with name+order;
 *      the 12-char code is *derived* (deterministic SHA-256, see
 *      scripts/lib/code-derive.ts) so the maintainer never touches codes
 *      directly. Re-running with the same salt + same guest list produces
 *      bit-identical input to the encryption (the per-letter random salt/IV
 *      still change each build, which is correct).
 *
 *   2. data/letters.private.json — legacy. Array of `{ code, recipient, body }`,
 *      where the code is supplied directly (e.g. produced by
 *      `npm run generate:codes`).
 *
 * Security model (see openspec/changes/mobile-wedding-invitation/design.md §D4):
 *  - Per-letter random 16-byte salt; key = scrypt(code, salt, N=2^15, r=8, p=1, dkLen=32).
 *  - Per-letter random 12-byte IV; ciphertext + 16-byte GCM tag via AES-256-GCM.
 *  - Mapping key idHash = SHA-256(code).slice(0, 16) hex (32 chars), so the
 *    public artifact only reveals the existence of N opaque entries.
 *  - The plaintext payload is JSON: { recipient, body: { ko, en?, de? } }.
 *  - Codes never enter the build artifact; only the gitignored input file
 *    holds them (or, in the codes.private.json flow, the salt + guest list
 *    from which they're regenerated on demand).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  createCipheriv,
  createHash,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { CODE_REGEX, deriveCode } from './lib/code-derive';

const ROOT = resolve(import.meta.dirname, '..');
const CODES_PATH = resolve(ROOT, 'data/codes.private.json');
const LEGACY_PATH = resolve(ROOT, 'data/letters.private.json');
const OUT_PATH = resolve(ROOT, 'src/data/letters.encrypted.json');
const isCI = process.env.CI === 'true' || process.env.CI === '1';

const KDF_PARAMS = { N: 32768, r: 8, p: 1, dkLen: 32 } as const;
const IV_LEN = 12;
const SALT_LEN = 16;
const TAG_LEN = 16;
const ID_HASH_BYTES = 16;

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

interface EncryptedEntry {
  iv: string;
  salt: string;
  ct: string;
  tag: string;
}

interface EncryptedStore {
  version: 1;
  kdf: 'scrypt';
  kdfParams: typeof KDF_PARAMS;
  configured: boolean;
  entries: Record<string, EncryptedEntry>;
}

const toHex = (b: Uint8Array | Buffer): string => Buffer.from(b).toString('hex');

const idHashHex = (code: string): string => {
  const h = createHash('sha256').update(code, 'utf8').digest();
  return toHex(h.subarray(0, ID_HASH_BYTES));
};

const encryptLetter = (code: string, payload: string): EncryptedEntry => {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = scryptSync(code, salt, KDF_PARAMS.dkLen, {
    N: KDF_PARAMS.N,
    r: KDF_PARAMS.r,
    p: KDF_PARAMS.p,
    // scrypt's default maxmem is too small for N=2^15; bump it.
    maxmem: 256 * 1024 * 1024,
  });
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  if (tag.length !== TAG_LEN) throw new Error(`unexpected GCM tag length ${tag.length}`);
  return {
    iv: toHex(iv),
    salt: toHex(salt),
    ct: toHex(ct),
    tag: toHex(tag),
  };
};

const writeStore = (store: EncryptedStore) => {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(store, null, 2) + '\n');
};

const empty: EncryptedStore = {
  version: 1,
  kdf: 'scrypt',
  kdfParams: KDF_PARAMS,
  configured: false,
  entries: {},
};

/** Convert a guest list (codes.private.json) into LetterRecord[]. */
const recordsFromCodes = (file: CodesFile): LetterRecord[] => {
  const seenOrders = new Set<number>();
  return file.guests.map((g, idx) => {
    if (typeof g.order !== 'number' || !Number.isInteger(g.order) || g.order < 0) {
      throw new Error(`codes.private.json: guests[${idx}].order must be a non-negative integer`);
    }
    if (seenOrders.has(g.order)) {
      throw new Error(`codes.private.json: duplicate order ${g.order}`);
    }
    seenOrders.add(g.order);
    if (typeof g.name !== 'string' || !g.name.trim()) {
      throw new Error(`codes.private.json: guests[${idx}].name must be non-empty`);
    }
    const code = deriveCode(g.name, g.order, file.salt);
    return {
      code,
      recipient: (g.recipient ?? g.name).trim(),
      body: g.body ?? { ko: '' },
    };
  });
};

// -------- Resolve input source --------
let records: LetterRecord[];
let source: 'codes' | 'legacy' | null = null;

if (existsSync(CODES_PATH)) {
  const raw = JSON.parse(readFileSync(CODES_PATH, 'utf8')) as Partial<CodesFile>;
  if (typeof raw.salt !== 'string' || raw.salt.trim().length < 16) {
    console.error('✗ data/codes.private.json: `salt` must be a string of at least 16 characters.');
    process.exit(1);
  }
  if (!Array.isArray(raw.guests)) {
    console.error('✗ data/codes.private.json: `guests` must be an array.');
    process.exit(1);
  }
  try {
    records = recordsFromCodes(raw as CodesFile);
    source = 'codes';
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
} else if (existsSync(LEGACY_PATH)) {
  const raw = JSON.parse(readFileSync(LEGACY_PATH, 'utf8')) as unknown;
  if (!Array.isArray(raw)) {
    console.error('✗ data/letters.private.json must be a JSON array of letter records.');
    process.exit(1);
  }
  records = raw as LetterRecord[];
  source = 'legacy';
} else {
  if (isCI) {
    console.error(
      '✗ Neither data/codes.private.json nor data/letters.private.json exists in CI.',
    );
    console.error(
      '  Set the LETTERS_PRIVATE_JSON secret to the contents of one of those files.',
    );
    process.exit(1);
  }
  writeStore(empty);
  console.log('• No private letter file — wrote empty encrypted store (dev mode).');
  process.exit(0);
}

// -------- Validate + encrypt --------
const seenCodes = new Set<string>();
const seenIds = new Set<string>();
const entries: Record<string, EncryptedEntry> = {};

let invalid = 0;
let skippedEmpty = 0;
for (const [idx, rec] of records.entries()) {
  if (typeof rec?.code !== 'string' || !CODE_REGEX.test(rec.code)) {
    console.error(`✗ entry ${idx}: invalid code (must match ${CODE_REGEX}).`);
    invalid += 1;
    continue;
  }
  if (seenCodes.has(rec.code)) {
    console.error(`✗ entry ${idx}: duplicate code.`);
    invalid += 1;
    continue;
  }
  seenCodes.add(rec.code);

  const recipient = (rec.recipient ?? '').trim();
  const body = rec.body ?? { ko: '' };
  const ko = (body.ko ?? '').trim();
  const en = (body.en ?? '').trim();
  const de = (body.de ?? '').trim();
  if (!recipient || !ko) {
    console.warn(
      `⚠ entry ${idx} (code ${rec.code.slice(0, 3)}…): empty recipient or ko body — skipping. ` +
        `Fill it in before deploying.`,
    );
    skippedEmpty += 1;
    continue;
  }
  const id = idHashHex(rec.code);
  if (seenIds.has(id)) {
    // Cannot happen unless SHA-256 collides at 16 bytes (negligible).
    console.error(`✗ entry ${idx}: idHash collision detected — regenerate code.`);
    invalid += 1;
    continue;
  }
  seenIds.add(id);

  const payload = JSON.stringify({
    recipient,
    body: { ko, ...(en ? { en } : {}), ...(de ? { de } : {}) },
  });
  entries[id] = encryptLetter(rec.code, payload);
}

if (invalid > 0) {
  console.error(`\n✗ ${invalid} invalid entr${invalid === 1 ? 'y' : 'ies'}; aborting.`);
  process.exit(1);
}

const store: EncryptedStore = {
  version: 1,
  kdf: 'scrypt',
  kdfParams: KDF_PARAMS,
  configured: Object.keys(entries).length > 0,
  entries,
};
writeStore(store);

const total = Object.keys(entries).length;
const sourceLabel = source === 'codes' ? 'codes.private.json (derived)' : 'letters.private.json (direct)';
console.log(`✓ Encrypted ${total} letter(s) from ${sourceLabel} → src/data/letters.encrypted.json`);
if (skippedEmpty > 0) {
  console.log(
    `  (${skippedEmpty} skeleton record${skippedEmpty === 1 ? '' : 's'} skipped — fill before deploy.)`,
  );
}
