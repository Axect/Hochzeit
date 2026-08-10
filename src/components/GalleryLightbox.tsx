import { useCallback, useEffect, useRef, useState } from 'react';

interface GalleryItem {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}

interface Labels {
  open: string;
  close: string;
  prev: string;
  next: string;
}

export default function GalleryLightbox({
  items,
  labels,
}: {
  items: GalleryItem[];
  labels: Labels;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const goPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length)),
    [items.length],
  );
  const goNext = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [openIndex, close, goPrev, goNext]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > 40) (dx > 0 ? goPrev : goNext)();
    touchStartX.current = null;
  };

  const active = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3">
        {items.map((item, idx) => (
          <li key={item.id} className={idx === 0 || idx === 3 ? 'col-span-2' : ''}>
            <button
              type="button"
              onClick={() => setOpenIndex(idx)}
              className={`tap-target group relative block w-full overflow-hidden rounded-sm border border-white/70 bg-[var(--color-line)] shadow-[0_10px_24px_rgba(38,58,39,0.10)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${idx === 0 ? 'aspect-[4/5]' : idx === 3 ? 'aspect-[4/3]' : 'aspect-[3/4]'}`}
              aria-label={`${labels.open}: ${item.alt}`}
            >
              <img
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {active !== null && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="tap-target absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goPrev}
            aria-label={labels.prev}
            className="tap-target absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label={labels.next}
            className="tap-target absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <figure className="max-h-[90vh] max-w-[95vw]">
            <img
              src={active.src}
              alt={active.alt}
              width={active.width}
              height={active.height}
              className="h-auto max-h-[85vh] w-auto max-w-full rounded-md object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/80">{active.alt}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
