import { useCallback, useEffect, useState } from 'react';
import { formatRelative, type Locale } from '@lib/i18n';

interface Entry {
  timestamp: Date;
  name: string;
  message: string;
  lang: Locale | string;
}

interface Props {
  locale: Locale;
  sheetId: string;
  sheetGid: string;
  columns: { timestamp: string; name: string; message: string; lang: string };
  approvedColumn: string;
  approvedValue: string;
  displayLimit: number;
  cacheTtlSeconds: number;
  labels: {
    loading: string;
    empty: string;
    errorTitle: string;
    errorBody: string;
    retry: string;
  };
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; entries: Entry[] };

const flag = (lang: string) =>
  lang === 'ko' ? '🇰🇷' : lang === 'en' ? '🇬🇧' : lang === 'de' ? '🇩🇪' : '🌐';

const cacheKey = (sheetId: string, sheetGid: string) =>
  `guestbook:${sheetId}:${sheetGid}`;

interface CachedPayload {
  fetchedAt: number;
  entries: Array<{ timestamp: string; name: string; message: string; lang: string }>;
}

const buildUrl = (sheetId: string, sheetGid: string) =>
  `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:json&gid=${encodeURIComponent(sheetGid)}`;

interface GvizCell {
  v: unknown;
  f?: string;
}
interface GvizRow {
  c: Array<GvizCell | null>;
}
interface GvizColumn {
  id: string;
  label: string;
  type: string;
}
interface GvizResponse {
  table: {
    cols: GvizColumn[];
    rows: GvizRow[];
  };
}

const parseGviz = (raw: string): GvizResponse => {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('malformed gviz response');
  return JSON.parse(raw.slice(start, end + 1)) as GvizResponse;
};

export default function GuestbookList({
  locale,
  sheetId,
  sheetGid,
  columns,
  approvedColumn,
  approvedValue,
  displayLimit,
  cacheTtlSeconds,
  labels,
}: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const isPlaceholder = !sheetId || sheetId.includes('PLACEHOLDER');

  const load = useCallback(
    async (force = false) => {
      if (isPlaceholder) {
        setState({ kind: 'ready', entries: [] });
        return;
      }
      setState({ kind: 'loading' });
      const key = cacheKey(sheetId, sheetGid);
      try {
        if (!force) {
          const cachedRaw = sessionStorage.getItem(key);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw) as CachedPayload;
            if (Date.now() - cached.fetchedAt < cacheTtlSeconds * 1000) {
              setState({
                kind: 'ready',
                entries: cached.entries.map((e) => ({ ...e, timestamp: new Date(e.timestamp) })),
              });
              return;
            }
          }
        }
        const res = await fetch(buildUrl(sheetId, sheetGid), { credentials: 'omit' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const data = parseGviz(text);
        const colIndex = (label: string): number =>
          data.table.cols.findIndex(
            (c) => c.label === label || c.id === label,
          );
        const tsIdx = colIndex(columns.timestamp);
        const nameIdx = colIndex(columns.name);
        const msgIdx = colIndex(columns.message);
        const langIdx = colIndex(columns.lang);
        const approvedIdx = colIndex(approvedColumn);

        const rows: Entry[] = data.table.rows
          .map((row): Entry | null => {
            const cells = row.c ?? [];
            if (approvedIdx >= 0) {
              const v = cells[approvedIdx]?.v;
              if (typeof v !== 'string' || v.trim() !== approvedValue) return null;
            }
            const tsRaw = tsIdx >= 0 ? cells[tsIdx] : null;
            const ts = tsRaw?.f ?? (typeof tsRaw?.v === 'string' ? tsRaw.v : null);
            const name = nameIdx >= 0 ? String(cells[nameIdx]?.v ?? '') : '';
            const message = msgIdx >= 0 ? String(cells[msgIdx]?.v ?? '') : '';
            const lang = langIdx >= 0 ? String(cells[langIdx]?.v ?? 'ko') : 'ko';
            if (!message.trim()) return null;
            const date = ts ? new Date(ts) : new Date();
            return { timestamp: date, name: name.trim() || '익명', message: message.trim(), lang };
          })
          .filter((e): e is Entry => e !== null)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, displayLimit);

        sessionStorage.setItem(
          key,
          JSON.stringify({
            fetchedAt: Date.now(),
            entries: rows.map((r) => ({ ...r, timestamp: r.timestamp.toISOString() })),
          } satisfies CachedPayload),
        );
        setState({ kind: 'ready', entries: rows });
      } catch (e) {
        setState({ kind: 'error', message: (e as Error).message });
      }
    },
    [sheetId, sheetGid, columns, approvedColumn, approvedValue, displayLimit, cacheTtlSeconds, isPlaceholder],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  if (isPlaceholder) {
    return (
      <p className="text-center text-xs text-[var(--color-accent)]">
        ⚠ Configure <code>src/config/forms.json</code> with the real published Sheet ID.
      </p>
    );
  }

  if (state.kind === 'loading') {
    return (
      <p className="text-center text-sm text-[var(--color-muted)]" aria-live="polite">
        {labels.loading}
      </p>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="rounded-md border border-[var(--color-line)] bg-white/40 p-5 text-center">
        <p className="text-sm text-[var(--color-fg)]">{labels.errorTitle}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{labels.errorBody}</p>
        <button
          type="button"
          onClick={() => void load(true)}
          className="tap-target mt-3 rounded-md border border-[var(--color-accent)] px-3 py-1.5 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
        >
          {labels.retry}
        </button>
      </div>
    );
  }

  if (state.entries.length === 0) {
    return <p className="text-center text-sm text-[var(--color-muted)]">{labels.empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {state.entries.map((e, idx) => (
        <li
          key={idx}
          className="rounded-md border border-[var(--color-line)] bg-white/60 px-4 py-3 text-sm"
        >
          <header className="mb-1 flex items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
            <span className="flex items-center gap-1">
              <span aria-hidden="true">{flag(e.lang)}</span>
              <span className="font-medium text-[var(--color-fg)]">{e.name}</span>
            </span>
            <time dateTime={e.timestamp.toISOString()}>{formatRelative(e.timestamp, locale)}</time>
          </header>
          <p className="whitespace-pre-line leading-relaxed text-[var(--color-fg)]">{e.message}</p>
        </li>
      ))}
    </ul>
  );
}
