import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { withBase } from '@lib/i18n';

interface Photo {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

interface Event {
  id: string;
  kind: 'letter' | 'visit' | 'trip' | 'wedding';
  date: string;
  lat: number;
  lon: number;
  /** Optional origin coordinate (e.g. for the first letter: Seoul → Leimen). */
  from?: { lat: number; lon: number };
  title: string;
  body: string;
  dateFormatted: string;
  photos: Photo[];
}

interface Labels {
  prev: string;
  next: string;
  reducedMotionNote: string;
  open: string;
  close: string;
  hint: string;
  momentCount: string;
  viewPhoto: string;
  kindLabel: Record<'letter' | 'visit' | 'trip' | 'wedding', string>;
}

interface Props {
  events: Event[];
  labels: Labels;
  title: string;
  intro: string;
}

interface MapPaths {
  land: string;
  borders: string;
  graticule: string;
  outline: string;
}

const W = 960;
const H = 540;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const KIND_GLYPH: Record<Event['kind'], string> = {
  letter: '✉',
  visit: '✦',
  trip: '✈',
  wedding: '❦',
};

interface IsletShape {
  id: string;
  lat: number;
  lon: number;
  path: (cx: number, cy: number) => string;
}

const MISSING_ISLETS: IsletShape[] = [
  {
    id: 'ulleungdo',
    lat: 37.5037,
    lon: 130.8606,
    path: (cx, cy) =>
      `M${cx + 0} ${cy - 0.55} L${cx + 0.42} ${cy - 0.32} L${cx + 0.5} ${cy + 0.08} ` +
      `L${cx + 0.32} ${cy + 0.5} L${cx - 0.18} ${cy + 0.55} L${cx - 0.5} ${cy + 0.18} ` +
      `L${cx - 0.42} ${cy - 0.28} L${cx - 0.18} ${cy - 0.5}Z`,
  },
  {
    id: 'dokdo',
    lat: 37.2417,
    lon: 131.8669,
    path: (cx, cy) =>
      `M${cx - 0.32} ${cy - 0.12} L${cx - 0.1} ${cy - 0.22} L${cx - 0.06} ${cy + 0.1} ` +
      `L${cx - 0.28} ${cy + 0.18}Z M${cx + 0.16} ${cy - 0.06} L${cx + 0.34} ${cy - 0.14} ` +
      `L${cx + 0.36} ${cy + 0.16} L${cx + 0.2} ${cy + 0.22}Z`,
  },
];

export default function JourneyMap({ events, labels, title, intro }: Props) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [paths, setPaths] = useState<MapPaths | null>(null);
  const [points, setPoints] = useState<Array<[number, number]> | null>(null);
  /** Per-event origin point (only set for events with `from`, e.g. first-letter). */
  const [originPoints, setOriginPoints] = useState<Array<[number, number] | null> | null>(null);
  const [islets, setIslets] = useState<Array<{ id: string; d: string }> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Defer the reduced-motion check until after hydration so SSR (which can't
  // read media queries) and the first client render agree on `false` — otherwise
  // React tears down the SSR DOM and the section briefly shows as empty.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);
  const touchStartX = useRef<number | null>(null);
  // Lightbox: per-event photo viewer that overlays the map modal.
  const [lightbox, setLightbox] = useState<{ eventId: string; index: number } | null>(null);
  const lightboxTouchStartX = useRef<number | null>(null);

  // Lazy-load d3-geo + topojson + world-atlas only the first time the modal opens.
  useEffect(() => {
    if (!open || paths) return;
    let cancelled = false;
    void (async () => {
      try {
        const [{ geoNaturalEarth1, geoPath, geoGraticule10 }, topojsonClient, atlas] =
          await Promise.all([
            import('d3-geo'),
            import('topojson-client'),
            import('world-atlas/countries-110m.json'),
          ]);
        if (cancelled) return;
        const world = (atlas as { default: unknown }).default ?? atlas;
        const projection = geoNaturalEarth1()
          .scale(W / (2 * Math.PI) - 6)
          .translate([W / 2, H / 2]);
        const pathFn = geoPath(projection);
        const land = topojsonClient.feature(
          world as never,
          (world as { objects: Record<string, unknown> }).objects.countries as never,
        );
        const borders = topojsonClient.mesh(
          world as never,
          (world as { objects: Record<string, unknown> }).objects.countries as never,
          (a: unknown, b: unknown) => a !== b,
        );
        const graticule = geoGraticule10();
        const outline = pathFn({ type: 'Sphere' } as never) ?? '';
        setPaths({
          land: pathFn(land as never) ?? '',
          borders: pathFn(borders as never) ?? '',
          graticule: pathFn(graticule) ?? '',
          outline,
        });
        setPoints(
          sortedEvents.map((ev) => projection([ev.lon, ev.lat]) as [number, number]),
        );
        setOriginPoints(
          sortedEvents.map((ev) =>
            ev.from
              ? (projection([ev.from.lon, ev.from.lat]) as [number, number])
              : null,
          ),
        );
        setIslets(
          MISSING_ISLETS.map((islet) => {
            const [cx, cy] = projection([islet.lon, islet.lat]) as [number, number];
            return { id: islet.id, d: islet.path(cx, cy) };
          }),
        );
      } catch (e) {
        setLoadError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, paths, sortedEvents]);

  // Body scroll lock + keyboard nav while modal is open.
  // The lightbox (photo viewer) sits above the modal, so when it's open we
  // skip modal-level keyboard handling and let the lightbox effect take over.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (lightbox) return; // lightbox owns the keyboard while open
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'ArrowLeft')
        setActive((i) => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight')
        setActive((i) => Math.min(sortedEvents.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, sortedEvents.length, lightbox]);

  // Lightbox keyboard nav — operates on the active event's photos.
  // Going past the last photo closes the lightbox (returning to the map);
  // going back from the first clamps in place.
  useEffect(() => {
    if (!lightbox) return;
    const ev = sortedEvents.find((e) => e.id === lightbox.eventId);
    const photos = ev?.photos ?? [];
    if (photos.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightbox(null);
      } else if (e.key === 'ArrowLeft') {
        setLightbox((l) => (l && l.index > 0 ? { ...l, index: l.index - 1 } : l));
      } else if (e.key === 'ArrowRight') {
        setLightbox((l) =>
          l && l.index < photos.length - 1 ? { ...l, index: l.index + 1 } : null,
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, sortedEvents]);

  const goPrev = useCallback(() => setActive((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setActive((i) => Math.min(sortedEvents.length - 1, i + 1)),
    [sortedEvents.length],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > 40) (dx > 0 ? goPrev : goNext)();
    touchStartX.current = null;
  };

  // ============ Preview (always-visible, one viewport) ============
  const Preview = (
    <div className="relative flex min-h-[100svh] w-full flex-col items-center justify-center px-6 py-20 text-center">
      <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-white/55">
        {labels.kindLabel.letter} · {labels.kindLabel.trip} · {labels.kindLabel.wedding}
      </p>
      <h2 className="font-serif text-[clamp(2.25rem,8vw,4rem)] leading-[1.05] text-white">
        {title}
      </h2>
      <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">{intro}</p>
      <p className="mt-2 max-w-md text-sm text-white/45">{labels.hint}</p>

      {/* Static dot row hinting at the 12 moments */}
      <div className="mt-8 flex items-center gap-1.5" aria-hidden="true">
        {sortedEvents.map((ev, idx) => (
          <span
            key={ev.id}
            className={
              'block rounded-full ' +
              (ev.kind === 'wedding'
                ? 'h-2 w-2 bg-[oklch(0.84_0.13_80)]'
                : idx === 0
                  ? 'h-2 w-2 bg-[oklch(0.78_0.13_80)]'
                  : 'h-1.5 w-1.5 bg-white/40')
            }
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-white/45">{labels.momentCount}</p>

      <button
        type="button"
        onClick={() => {
          setActive(0);
          setOpen(true);
        }}
        className="tap-target mt-10 inline-flex items-center gap-2 rounded-full bg-[oklch(0.84_0.13_80)] px-6 py-3 text-sm font-medium text-[oklch(0.18_0.04_150)] shadow-[0_0_30px_rgba(220,180,120,0.25)] transition-transform hover:scale-[1.02] hover:bg-[oklch(0.88_0.13_80)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.84_0.13_80)] focus:ring-offset-2 focus:ring-offset-[oklch(0.16_0.04_150)]"
      >
        <span>{labels.open}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );

  if (!open) return Preview;

  // ============ Modal: fullscreen cinematic, manual nav only ============
  if (loadError) {
    return (
      <>
        {Preview}
        <ModalShell labels={labels} onClose={() => setOpen(false)}>
          <ul className="space-y-4 p-6 sm:p-10">
            {sortedEvents.map((ev) => (
              <li key={ev.id} className="rounded-md border border-white/10 bg-white/5 p-4">
                <header className="flex items-baseline justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.08em] text-white/60">
                    {labels.kindLabel[ev.kind]}
                  </span>
                  <time className="text-xs text-white/60">{ev.dateFormatted}</time>
                </header>
                <h3 className="mt-1 font-serif text-base text-white">{ev.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/80">{ev.body}</p>
              </li>
            ))}
          </ul>
        </ModalShell>
      </>
    );
  }

  if (!paths || !points) {
    return (
      <>
        {Preview}
        <ModalShell labels={labels} onClose={() => setOpen(false)}>
          <div className="grid h-full w-full place-items-center">
            <div className="h-32 w-32 animate-pulse rounded-full bg-white/5" />
          </div>
        </ModalShell>
      </>
    );
  }

  if (reducedMotion) {
    return (
      <>
        {Preview}
        <ModalShell labels={labels} onClose={() => setOpen(false)}>
          <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto p-6 sm:p-10">
            <p className="max-w-md text-center text-sm text-white/70">
              {labels.reducedMotionNote}
            </p>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full max-w-3xl rounded-md border border-white/10 bg-white/5"
              role="img"
              aria-hidden="true"
            >
              <path d={paths.outline} fill="oklch(0.22 0.04 150)" />
              <path d={paths.graticule} fill="none" stroke="oklch(0.30 0.04 150)" strokeWidth={0.4} />
              <path d={paths.land} fill="oklch(0.34 0.04 150)" />
              <path d={paths.borders} fill="none" stroke="oklch(0.44 0.04 150)" strokeWidth={0.4} />
              {islets?.map((islet) => (
                <path
                  key={islet.id}
                  d={islet.d}
                  fill="oklch(0.34 0.04 150)"
                  stroke="oklch(0.44 0.04 150)"
                  strokeWidth={0.3}
                />
              ))}
              {points.map(([cx, cy], idx) => (
                <circle
                  key={sortedEvents[idx].id}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="oklch(0.78 0.13 80)"
                />
              ))}
            </svg>
            <ol className="w-full max-w-md space-y-3 pt-2">
              {sortedEvents.map((ev) => (
                <li key={ev.id} className="rounded-md border border-white/10 bg-white/5 p-4">
                  <header className="flex items-baseline justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.08em] text-white/60">
                      {labels.kindLabel[ev.kind]}
                    </span>
                    <time className="text-xs text-white/60">{ev.dateFormatted}</time>
                  </header>
                  <h3 className="mt-1 font-serif text-lg text-white">{ev.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/80">{ev.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </ModalShell>
      </>
    );
  }

  // Cinematic SVG zoom on active event.
  // First-letter is special: we show *both* Seoul (from) and Leimen (to) in
  // frame at once, with profile portraits at each end and the letter image
  // hovering over the midpoint of the arc.
  const activeEvent = sortedEvents[active];
  const activePoint = points[active] ?? [W / 2, H / 2];
  const activeOrigin = originPoints?.[active] ?? null;
  const isFirstLetter = activeEvent?.id === 'first-letter' && activeOrigin !== null;
  const isWedding = activeEvent?.kind === 'wedding';

  // For first-letter we centre the camera on the midpoint of the two cities
  // and back the zoom out so both fit comfortably; otherwise standard zoom.
  const zoom = isFirstLetter ? 1.5 : isWedding ? 3.6 : 2.4;
  const camX = isFirstLetter && activeOrigin
    ? (activePoint[0] + activeOrigin[0]) / 2
    : activePoint[0];
  const camY = isFirstLetter && activeOrigin
    ? (activePoint[1] + activeOrigin[1]) / 2
    : activePoint[1];
  const tx = W / 2 - camX * zoom;
  const ty = H / 2 - camY * zoom;

  // Connection line: usually visited points in chronological order. For the
  // first-letter scene we draw a single arc from Seoul → Leimen instead.
  const linePath = isFirstLetter && activeOrigin
    ? `M${activeOrigin[0]},${activeOrigin[1]} Q${(activeOrigin[0] + activePoint[0]) / 2},${
        Math.min(activeOrigin[1], activePoint[1]) - 28
      } ${activePoint[0]},${activePoint[1]}`
    : points
        .slice(0, active + 1)
        .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
        .join(' ');

  // First-letter overlay layout (sizes are in viewBox units, scaled to SVG).
  const firstLetterMid = isFirstLetter && activeOrigin
    ? [
        (activeOrigin[0] + activePoint[0]) / 2,
        Math.min(activeOrigin[1], activePoint[1]) - 14, // lifted slightly above the arc apex
      ]
    : null;

  return (
    <>
      {Preview}
      <ModalShell labels={labels} onClose={() => setOpen(false)}>
        <div
          className="relative h-full w-full"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={activeEvent.title}
          >
            <defs>
              <radialGradient id="journey-vignette" cx="50%" cy="55%" r="65%">
                <stop offset="55%" stopColor="black" stopOpacity="0" />
                <stop offset="100%" stopColor="black" stopOpacity="0.65" />
              </radialGradient>
              <filter id="journey-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
                transformOrigin: '0 0',
                transition: 'transform 1.6s cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            >
              <path d={paths.outline} fill="oklch(0.20 0.05 150)" />
              <path
                d={paths.graticule}
                fill="none"
                stroke="oklch(0.28 0.04 150)"
                strokeWidth={0.35}
                vectorEffect="non-scaling-stroke"
              />
              <path d={paths.land} fill="oklch(0.32 0.04 150)" />
              <path
                d={paths.borders}
                fill="none"
                stroke="oklch(0.44 0.04 150)"
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
              />

              {islets?.map((islet) => (
                <path
                  key={islet.id}
                  d={islet.d}
                  fill="oklch(0.32 0.04 150)"
                  stroke="oklch(0.44 0.04 150)"
                  strokeWidth={0.4}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="oklch(0.84 0.13 80)"
                  strokeWidth={1.6}
                  strokeDasharray="3.5 4.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  filter="url(#journey-glow)"
                />
              )}

              {points.map(([cx, cy], idx) => {
                const isActive = idx === active;
                // The first-letter scene replaces the active marker with the
                // Andrea profile portrait, so suppress the standard dot here.
                if (isFirstLetter && isActive) return null;
                const visited = idx <= active;
                return (
                  <g key={sortedEvents[idx].id} transform={`translate(${cx} ${cy})`}>
                    {isActive && (
                      <circle
                        r={9}
                        fill="none"
                        stroke="oklch(0.86 0.13 80)"
                        strokeOpacity={0.5}
                        strokeWidth={0.8}
                        vectorEffect="non-scaling-stroke"
                      >
                        <animate attributeName="r" values="6;14;6" dur="2.4s" repeatCount="indefinite" />
                        <animate
                          attributeName="stroke-opacity"
                          values="0.6;0;0.6"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    <circle
                      r={isActive ? 3.6 : visited ? 2.4 : 1.8}
                      fill={
                        isActive
                          ? 'oklch(0.92 0.13 80)'
                          : visited
                            ? 'oklch(0.78 0.13 80)'
                            : 'oklch(0.55 0.04 150)'
                      }
                      filter={isActive ? 'url(#journey-glow)' : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}

              {/* First-letter overlay: TG profile at Seoul, Andrea profile at
                  Leimen, and the letter image hovering above the arc midpoint.
                  Sits inside the zoomed group so it scales with the camera. */}
              {isFirstLetter && activeOrigin && firstLetterMid && (
                <g>
                  <defs>
                    <clipPath id="profile-tg-clip">
                      <circle cx={activeOrigin[0]} cy={activeOrigin[1]} r={10} />
                    </clipPath>
                    <clipPath id="profile-andrea-clip">
                      <circle cx={activePoint[0]} cy={activePoint[1]} r={10} />
                    </clipPath>
                  </defs>

                  {/* TG · Seoul */}
                  <circle
                    cx={activeOrigin[0]}
                    cy={activeOrigin[1]}
                    r={11}
                    fill="oklch(0.18 0.05 150)"
                  />
                  <image
                    href={withBase('/journey/profile-tg.png')}
                    x={activeOrigin[0] - 10}
                    y={activeOrigin[1] - 10}
                    width={20}
                    height={20}
                    clipPath="url(#profile-tg-clip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <circle
                    cx={activeOrigin[0]}
                    cy={activeOrigin[1]}
                    r={10}
                    fill="none"
                    stroke="oklch(0.84 0.13 80)"
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Andrea · Leimen */}
                  <circle
                    cx={activePoint[0]}
                    cy={activePoint[1]}
                    r={11}
                    fill="oklch(0.18 0.05 150)"
                  />
                  <image
                    href={withBase('/journey/profile-andrea.png')}
                    x={activePoint[0] - 10}
                    y={activePoint[1] - 10}
                    width={20}
                    height={20}
                    clipPath="url(#profile-andrea-clip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <circle
                    cx={activePoint[0]}
                    cy={activePoint[1]}
                    r={10}
                    fill="none"
                    stroke="oklch(0.84 0.13 80)"
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* The letter, hovering over the apex of the arc */}
                  <g
                    transform={`translate(${firstLetterMid[0]} ${firstLetterMid[1]}) rotate(-3)`}
                  >
                    <rect
                      x={-19}
                      y={-13.5}
                      width={38}
                      height={27}
                      rx={0.6}
                      fill="oklch(0.96 0.02 80)"
                      stroke="oklch(0.84 0.13 80)"
                      strokeWidth={0.4}
                      vectorEffect="non-scaling-stroke"
                    />
                    <image
                      href={withBase('/journey/first-letter.png')}
                      x={-18}
                      y={-12.5}
                      width={36}
                      height={25}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                </g>
              )}
            </g>

            <rect width={W} height={H} fill="url(#journey-vignette)" pointerEvents="none" />
          </svg>

          {/* Bottom gradient + text overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[oklch(0.12_0.04_150)] via-[oklch(0.12_0.04_150)]/85 to-transparent"
          />

          <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-12 pt-10 sm:px-12 sm:pb-16">
            <div className="mx-auto max-w-2xl">
              <div key={activeEvent.id} className="journey-card-fade space-y-3 text-left">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-white/55">
                  <span aria-hidden="true" className="text-base text-[oklch(0.84_0.13_80)]">
                    {KIND_GLYPH[activeEvent.kind]}
                  </span>
                  <span>{labels.kindLabel[activeEvent.kind]}</span>
                  <span className="text-white/30">·</span>
                  <time>{activeEvent.dateFormatted}</time>
                </p>
                <h3 className="font-serif text-[clamp(2rem,7vw,3.75rem)] leading-[1.05] text-white">
                  {activeEvent.title}
                </h3>
                <p className="max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                  {activeEvent.body}
                </p>

                {activeEvent.photos.length > 0 && (
                  <ul className="mt-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {activeEvent.photos.map((p, idx) => (
                      <li key={p.src} className="shrink-0">
                        <button
                          type="button"
                          onClick={() => setLightbox({ eventId: activeEvent.id, index: idx })}
                          aria-label={`${labels.viewPhoto}: ${p.alt ?? activeEvent.title}`}
                          className="tap-target group relative block h-20 w-20 overflow-hidden rounded-md border border-white/15 bg-white/5 focus:outline-none focus:ring-2 focus:ring-[oklch(0.84_0.13_80)] sm:h-24 sm:w-24"
                        >
                          <img
                            src={withBase(p.src)}
                            alt={p.alt ?? activeEvent.title}
                            width={p.width}
                            height={p.height}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-8 flex items-center gap-3 text-xs text-white/45">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={active === 0}
                  aria-label={labels.prev}
                  className="tap-target inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/90 backdrop-blur-md transition-colors hover:border-white/50 hover:bg-white/20 disabled:opacity-25 sm:h-12 sm:w-12"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="font-mono tabular-nums">
                  {String(active + 1).padStart(2, '0')}
                </span>
                <div className="h-px flex-1 bg-white/15">
                  <div
                    className="h-full bg-[oklch(0.84_0.13_80)] transition-all duration-700 ease-out"
                    style={{
                      width: `${((active + 1) / sortedEvents.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="font-mono tabular-nums">
                  {String(sortedEvents.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={active === sortedEvents.length - 1}
                  aria-label={labels.next}
                  className="tap-target inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/90 backdrop-blur-md transition-colors hover:border-white/50 hover:bg-white/20 disabled:opacity-25 sm:h-12 sm:w-12"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
      {lightbox &&
        typeof document !== 'undefined' &&
        (() => {
          const ev = sortedEvents.find((e) => e.id === lightbox.eventId);
          const photos = ev?.photos ?? [];
          if (photos.length === 0) return null;
          const photo = photos[lightbox.index];
          // Match keyboard nav: clamp at first, close past last (returning to map).
          const goPrevPhoto = () =>
            setLightbox((l) => (l && l.index > 0 ? { ...l, index: l.index - 1 } : l));
          const goNextPhoto = () =>
            setLightbox((l) =>
              l && l.index < photos.length - 1 ? { ...l, index: l.index + 1 } : null,
            );
          const onLightboxTouchStart = (e: React.TouchEvent) => {
            lightboxTouchStartX.current = e.touches[0]?.clientX ?? null;
          };
          const onLightboxTouchEnd = (e: React.TouchEvent) => {
            if (lightboxTouchStartX.current === null) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - lightboxTouchStartX.current;
            if (Math.abs(dx) > 40) (dx > 0 ? goPrevPhoto : goNextPhoto)();
            lightboxTouchStartX.current = null;
          };
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={photo.alt ?? ev?.title ?? ''}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setLightbox(null);
              }}
              onTouchStart={onLightboxTouchStart}
              onTouchEnd={onLightboxTouchEnd}
            >
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label={labels.close}
                className="tap-target absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevPhoto}
                    aria-label={labels.prev}
                    className="tap-target absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goNextPhoto}
                    aria-label={labels.next}
                    className="tap-target absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
              <figure className="max-h-[90vh] max-w-[95vw]">
                <img
                  src={withBase(photo.src)}
                  alt={photo.alt ?? ev?.title ?? ''}
                  width={photo.width}
                  height={photo.height}
                  className="h-auto max-h-[85vh] w-auto max-w-full rounded-md object-contain"
                />
                <figcaption className="mt-3 text-center text-sm text-white/80">
                  {ev?.title}
                  {photos.length > 1 && (
                    <span className="ml-2 font-mono text-white/55">
                      {lightbox.index + 1} / {photos.length}
                    </span>
                  )}
                </figcaption>
              </figure>
            </div>,
            document.body,
          );
        })()}
    </>
  );
}

/**
 * Fullscreen modal frame, portalled to <body>. Portalling avoids stacking-
 * context bugs from any ancestor with `isolate`, `transform`, `filter`, etc.
 * — `fixed inset-0` then reliably means "the actual viewport".
 */
function ModalShell({
  labels,
  onClose,
  children,
}: {
  labels: Labels;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.open}
      className="fixed inset-0 z-[60] bg-[oklch(0.16_0.04_150)] text-white"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className="tap-target absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md hover:bg-white/15 sm:right-6 sm:top-6"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
        <span>{labels.close}</span>
      </button>
      {children}
    </div>,
    document.body,
  );
}
