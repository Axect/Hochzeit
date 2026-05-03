import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fmt, type Locale } from '@lib/i18n';
import {
  computeIdHash,
  decryptLetter,
  getCooldownRemainingMs,
  isLockedOut,
  isValidCodeShape,
  normalizeCode,
  recordFailure,
  recordSuccess,
  type EncryptedEntry,
  type KdfParams,
  type LetterPayload,
} from '@lib/letter-crypto';

interface Labels {
  placeholder: string;
  submit: string;
  loading: string;
  invalid: string;
  lockedTitle: string;
  lockedBody: string;
  missingTranslation: string;
  letterPrefix: string;
  close: string;
}

interface Props {
  locale: Locale;
  labels: Labels;
  configured: boolean;
  pendingCount: number;
  entries: Record<string, EncryptedEntry>;
  kdfParams?: KdfParams;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'invalid' }
  | { kind: 'locked'; remainingMs: number }
  | { kind: 'unlocked'; payload: LetterPayload };

const DEFAULT_KDF: KdfParams = { N: 32768, r: 8, p: 1, dkLen: 32 };

export default function SecretLetterForm({
  locale,
  labels,
  configured,
  pendingCount,
  entries,
  kdfParams,
}: Props) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const lockTickRef = useRef<number | null>(null);
  const params = useMemo(() => kdfParams ?? DEFAULT_KDF, [kdfParams]);

  const refreshLockState = useCallback(() => {
    const remaining = getCooldownRemainingMs();
    if (remaining > 0) {
      setStatus((cur) =>
        cur.kind === 'unlocked' ? cur : { kind: 'locked', remainingMs: remaining },
      );
    } else if (status.kind === 'locked') {
      setStatus({ kind: 'idle' });
    }
  }, [status.kind]);

  // Initial lock check + tick the countdown.
  useEffect(() => {
    refreshLockState();
    const tick = () => refreshLockState();
    const id = window.setInterval(tick, 1000);
    lockTickRef.current = id;
    return () => {
      if (lockTickRef.current !== null) window.clearInterval(lockTickRef.current);
    };
  }, [refreshLockState]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut()) {
      refreshLockState();
      return;
    }
    const norm = normalizeCode(code);
    if (!isValidCodeShape(norm)) {
      setStatus({ kind: 'invalid' });
      recordFailure();
      refreshLockState();
      return;
    }
    setStatus({ kind: 'submitting' });
    try {
      const id = await computeIdHash(norm);
      const entry = entries[id];
      if (!entry) {
        recordFailure();
        setStatus({ kind: 'invalid' });
        refreshLockState();
        return;
      }
      const payload = await decryptLetter(norm, entry, params);
      recordSuccess();
      setStatus({ kind: 'unlocked', payload });
    } catch {
      recordFailure();
      setStatus({ kind: 'invalid' });
      refreshLockState();
    }
  };

  if (!configured) {
    return (
      <div className="rounded-md border border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 text-center text-sm text-[var(--color-fg)]">
        <p className="font-medium">Secret letters: not yet configured.</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {pendingCount > 0
            ? `${pendingCount} private letter(s) found — fill in 'recipient' and 'body' in data/letters.private.json then run \`npm run build:letters\`.`
            : 'Add data/letters.private.json with code/recipient/body entries, then run `npm run build:letters`.'}
        </p>
      </div>
    );
  }

  if (status.kind === 'unlocked') {
    const body =
      status.payload.body[locale] ?? status.payload.body.ko ?? '';
    const showMissingNote = !status.payload.body[locale] && locale !== 'ko';
    return (
      <article className="space-y-4 rounded-md border border-[var(--color-line)] bg-white/70 p-6">
        <header className="flex items-baseline justify-between gap-3">
          <p className="font-serif text-lg text-[var(--color-fg)]">
            {labels.letterPrefix}
            <span className="text-[var(--color-accent)]">{status.payload.recipient}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus({ kind: 'idle' });
              setCode('');
            }}
            className="tap-target rounded-full px-3 py-1 text-xs text-[var(--color-muted)] hover:bg-[var(--color-line)]"
          >
            {labels.close}
          </button>
        </header>
        {showMissingNote && (
          <p className="text-xs text-[var(--color-muted)]">{labels.missingTranslation}</p>
        )}
        <div className="whitespace-pre-line text-base leading-relaxed text-[var(--color-fg)]">
          {body}
        </div>
      </article>
    );
  }

  const isLocked = status.kind === 'locked';
  const remainingSec = isLocked ? Math.ceil(status.remainingMs / 1000) : 0;
  const submitting = status.kind === 'submitting';

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-label="Secret letter code form">
      <label className="block">
        <span className="sr-only">{labels.placeholder}</span>
        <input
          type="text"
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={16}
          value={code}
          onChange={(e) => setCode(normalizeCode(e.target.value))}
          placeholder={labels.placeholder}
          aria-invalid={status.kind === 'invalid'}
          disabled={submitting || isLocked}
          className="w-full rounded-md border border-[var(--color-line)] bg-white/80 px-4 py-3 text-center font-mono text-lg tracking-widest focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
        />
      </label>
      <button
        type="submit"
        disabled={submitting || isLocked || !isValidCodeShape(normalizeCode(code))}
        className="tap-target w-full rounded-md bg-[var(--color-accent)] px-4 py-3 text-base font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? labels.loading : labels.submit}
      </button>
      {status.kind === 'invalid' && (
        <p role="alert" className="text-center text-xs text-[var(--color-accent)]">
          {labels.invalid}
        </p>
      )}
      {isLocked && (
        <div role="status" className="rounded-md bg-[var(--color-accent-soft)] p-3 text-center">
          <p className="text-sm font-medium text-[var(--color-fg)]">{labels.lockedTitle}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {fmt(labels.lockedBody, { seconds: remainingSec })}
          </p>
        </div>
      )}
    </form>
  );
}
