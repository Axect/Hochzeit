/**
 * Client-side decryption for guest letters.
 *
 * Mirrors scripts/build-letters.ts: scrypt(N=2^15, r=8, p=1, dkLen=32) +
 * AES-256-GCM (12-byte IV, 16-byte tag). Uses @noble/hashes for scrypt
 * (Web Crypto has no scrypt) and the browser's `crypto.subtle` for AES-GCM.
 */
import { scryptAsync } from '@noble/hashes/scrypt';

export interface EncryptedEntry {
  iv: string;
  salt: string;
  ct: string;
  tag: string;
}

export interface KdfParams {
  N: number;
  r: number;
  p: number;
  dkLen: number;
}

export interface EncryptedStore {
  version: 1;
  kdf: 'scrypt';
  kdfParams: KdfParams;
  configured: boolean;
  entries: Record<string, EncryptedEntry>;
}

export interface LetterPayload {
  recipient: string;
  body: { ko: string; en?: string; de?: string };
}

const ID_HASH_BYTES = 16;
const CODE_REGEX = /^[a-hjk-mnp-z2-9]{12}$/;

/**
 * Note: we type these as `Uint8Array<ArrayBuffer>` (concrete, not `ArrayBufferLike`)
 * because Web Crypto's `BufferSource` rejects the union form under TS strict.
 */
const hexToBytes = (hex: string): Uint8Array<ArrayBuffer> => {
  if (hex.length % 2 !== 0) throw new Error('odd-length hex');
  const buf = new ArrayBuffer(hex.length / 2);
  const out = new Uint8Array(buf);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out as Uint8Array<ArrayBuffer>;
};

const bytesToHex = (b: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
};

const concat = (a: Uint8Array, b: Uint8Array): Uint8Array<ArrayBuffer> => {
  const buf = new ArrayBuffer(a.length + b.length);
  const out = new Uint8Array(buf);
  out.set(a, 0);
  out.set(b, a.length);
  return out as Uint8Array<ArrayBuffer>;
};

export const normalizeCode = (raw: string): string =>
  raw.replace(/\s+/g, '').toLowerCase();

export const isValidCodeShape = (code: string): boolean => CODE_REGEX.test(code);

export const computeIdHash = async (code: string): Promise<string> => {
  const enc = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  const bytes = new Uint8Array(digest).slice(0, ID_HASH_BYTES);
  return bytesToHex(bytes);
};

const deriveKey = async (
  code: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<Uint8Array<ArrayBuffer>> => {
  const raw = await scryptAsync(new TextEncoder().encode(code), salt, {
    N: params.N,
    r: params.r,
    p: params.p,
    dkLen: params.dkLen,
  });
  // Copy into a fresh ArrayBuffer-backed Uint8Array so Web Crypto accepts it.
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  out.set(raw);
  return out as Uint8Array<ArrayBuffer>;
};

export const decryptLetter = async (
  code: string,
  entry: EncryptedEntry,
  params: KdfParams,
): Promise<LetterPayload> => {
  const salt = hexToBytes(entry.salt);
  const iv = hexToBytes(entry.iv);
  const ct = hexToBytes(entry.ct);
  const tag = hexToBytes(entry.tag);
  // AES-GCM in WebCrypto expects ciphertext || tag concatenated.
  const blob = concat(ct, tag);
  const keyBytes = await deriveKey(code, salt, params);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, blob);
  const text = new TextDecoder().decode(plain);
  const parsed = JSON.parse(text) as unknown;
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as LetterPayload).recipient !== 'string' ||
    typeof (parsed as LetterPayload).body?.ko !== 'string'
  ) {
    throw new Error('decrypted payload has invalid shape');
  }
  return parsed as LetterPayload;
};

/** Rate-limit state in sessionStorage. */
const RL_KEY = 'secretLetter:rl';
const FAIL_THRESHOLD = 5;
const COOLDOWNS_MS = [30_000, 60_000, 120_000, 240_000, 480_000, 600_000];

interface RateLimitState {
  failuresInWindow: number;
  cooldownIndex: number;
  nextAttemptAt: number;
}

const readRl = (): RateLimitState => {
  try {
    const raw = sessionStorage.getItem(RL_KEY);
    if (!raw) return { failuresInWindow: 0, cooldownIndex: 0, nextAttemptAt: 0 };
    const parsed = JSON.parse(raw) as Partial<RateLimitState>;
    return {
      failuresInWindow: Number(parsed.failuresInWindow ?? 0),
      cooldownIndex: Number(parsed.cooldownIndex ?? 0),
      nextAttemptAt: Number(parsed.nextAttemptAt ?? 0),
    };
  } catch {
    return { failuresInWindow: 0, cooldownIndex: 0, nextAttemptAt: 0 };
  }
};

const writeRl = (s: RateLimitState) => {
  try {
    sessionStorage.setItem(RL_KEY, JSON.stringify(s));
  } catch {
    /* sessionStorage may be unavailable */
  }
};

export const getCooldownRemainingMs = (now: number = Date.now()): number => {
  const s = readRl();
  return Math.max(0, s.nextAttemptAt - now);
};

export const isLockedOut = (now: number = Date.now()): boolean =>
  getCooldownRemainingMs(now) > 0;

export const recordFailure = (now: number = Date.now()): RateLimitState => {
  const s = readRl();
  s.failuresInWindow += 1;
  if (s.failuresInWindow >= FAIL_THRESHOLD) {
    const idx = Math.min(s.cooldownIndex, COOLDOWNS_MS.length - 1);
    s.nextAttemptAt = now + COOLDOWNS_MS[idx];
    s.cooldownIndex = Math.min(s.cooldownIndex + 1, COOLDOWNS_MS.length - 1);
    s.failuresInWindow = 0;
  }
  writeRl(s);
  return s;
};

export const recordSuccess = (): void => {
  writeRl({ failuresInWindow: 0, cooldownIndex: 0, nextAttemptAt: 0 });
};
