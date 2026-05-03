/**
 * Deterministic per-guest code derivation.
 *
 *   code = derive(name, order, salt)
 *
 * Properties:
 *  - **Deterministic**: same (name, order, salt) → always the same 12-char code,
 *    so codes can be regenerated from the guest list at any time without
 *    storing them.
 *  - **One-way**: anyone who sees a code cannot recover the name or order
 *    without brute-forcing the (name, order) space *and* knowing the salt
 *    (SHA-256 preimage resistance).
 *  - **Salted**: a wedding-specific secret salt prevents rainbow tables and
 *    means an attacker who guesses a few common names still can't enumerate
 *    valid codes without the salt.
 *  - **Order-binding**: rerunning the derivation with different order
 *    numbers yields a different code, so accidental reuse of a name is
 *    fine as long as `order` is unique.
 *
 * Construction:
 *   h = SHA-256( NFC(trim(name)) || US || dec(order) || US || salt )
 *   code[i] = ALPHABET[ h[i] mod len(ALPHABET) ]    for i in 0..11
 *   where US = U+001F (unit separator) and ALPHABET is 31 unambiguous
 *   lowercase letters/digits (matches scripts/generate-codes.ts).
 *
 * The 31-symbol alphabet has a tiny modulo bias from 256 mod 31 = 8, so the
 * first 8 alphabet positions are slightly more likely than the last 23.
 * This is a non-issue for our threat model (one-shot brute-force against a
 * scrypt-protected store), but documented here in case you ever want to
 * upgrade to rejection sampling.
 */

import { createHash } from 'node:crypto';

export const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const CODE_LENGTH = 12;
export const CODE_REGEX = /^[a-hjk-mnp-z2-9]{12}$/;
const SEPARATOR = '';

export const normalizeName = (name: string): string => name.normalize('NFC').trim();

/** Derive a 12-character code from a guest name + order + salt. */
export const deriveCode = (name: string, order: number, salt: string): string => {
  if (!Number.isInteger(order) || order < 0) {
    throw new Error(`derive: order must be a non-negative integer, got ${order}`);
  }
  if (!salt || typeof salt !== 'string') {
    throw new Error('derive: salt must be a non-empty string');
  }
  const normalized = normalizeName(name);
  if (!normalized) throw new Error('derive: name must not be empty');
  const payload = `${normalized}${SEPARATOR}${String(order)}${SEPARATOR}${salt}`;
  const hash = createHash('sha256').update(payload, 'utf8').digest();
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[hash[i] % ALPHABET.length];
  }
  return code;
};
