'use client';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

function useMedia(queries: string[], values: number[], defaultValue: number): number {
  const get = () => {
    if (typeof window === 'undefined') return defaultValue;
    const idx = queries.findIndex((q) => window.matchMedia(q).matches);
    return values[idx] !== undefined ? values[idx] : defaultValue;
  };
  const [value, setValue] = useState<number>(get);
  useEffect(() => {
    const handler = () => setValue(get);
    queries.forEach((q) => window.matchMedia(q).addEventListener('change', handler));
    return () => queries.forEach((q) => window.matchMedia(q).removeEventListener('change', handler));
  });
  return value;
}

function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

async function preloadImages(urls: string[]) {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((res) => {
          const img = new Image();
          img.src = src;
          img.onload = img.onerror = () => res();
        })
    )
  );
}

export interface MasonryItem {
  id: string;
  img: string;
  height: number;
  title?: string;
  url?: string;
}

interface GridItem extends MasonryItem { x: number; y: number; w: number; h: number; }

export interface MasonryGalleryProps {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random';
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
  className?: string;
  onItemClick?: (item: MasonryItem) => void;
}

export const MasonryGallery: React.FC<MasonryGalleryProps> = ({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
  className = '',
  onItemClick,
}) => {
  const columns = useMedia(
    ['(min-width:1400px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [4, 3, 2, 2],
    1
  );
  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [imagesReady, setImagesReady] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    setImagesReady(false);
    hasMounted.current = false;
    preloadImages(items.map((i) => i.img)).then(() => setImagesReady(true));
  }, [items]);

  const { grid, containerHeight } = useMemo(() => {
    if (!width) return { grid: [] as GridItem[], containerHeight: 0 };
    const colH = new Array(columns).fill(0);
    const gap = 16;
    const colW = (width - gap * (columns - 1)) / columns;
    const gridItems = items.map((child) => {
      const col = colH.indexOf(Math.min(...colH));
      const x = col * (colW + gap);
      const h = (child.height / 400) * colW;
      const y = colH[col];
      colH[col] += h + gap;
      return { ...child, x, y, w: colW, h };
    });
    return { grid: gridItems, containerHeight: Math.max(...colH) };
  }, [columns, items, width]);

  useLayoutEffect(() => {
    if (!imagesReady || !grid.length) return;
    grid.forEach((item, i) => {
      const el = document.querySelector<HTMLElement>(`[data-masonry-key="${item.id}"]`);
      if (!el) return;
      const props = { x: item.x, y: item.y, width: item.w, height: item.h };
      if (!hasMounted.current) {
        const dir = animateFrom === 'random'
          ? (['top', 'bottom', 'left', 'right'] as const)[Math.floor(Math.random() * 4)]
          : animateFrom;
        const start =
          dir === 'top' ? { x: item.x, y: -200 }
          : dir === 'bottom' ? { x: item.x, y: window.innerHeight + 200 }
          : dir === 'left' ? { x: -200, y: item.y }
          : { x: window.innerWidth + 200, y: item.y };
        gsap.fromTo(el,
          { opacity: 0, ...start, width: item.w, height: item.h, ...(blurToFocus && { filter: 'blur(16px)' }) },
          { opacity: 1, ...props, ...(blurToFocus && { filter: 'blur(0px)' }), duration: 1.2, ease: 'power3.out', delay: i * stagger }
        );
      } else {
        gsap.to(el, { ...props, duration, ease, overwrite: 'auto' });
      }
    });
    if (grid.length > 0) hasMounted.current = true;
  }, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease]);

  const onEnter = (id: string, el: HTMLElement) => {
    if (scaleOnHover) gsap.to(el, { scale: hoverScale, duration: 0.4, ease: 'power2.out' });
    if (colorShiftOnHover) {
      const ov = el.querySelector('.masonry-overlay');
      if (ov) gsap.to(ov, { opacity: 0.35, duration: 0.4 });
    }
  };
  const onLeave = (id: string, el: HTMLElement) => {
    if (scaleOnHover) gsap.to(el, { scale: 1, duration: 0.4, ease: 'power2.out' });
    if (colorShiftOnHover) {
      const ov = el.querySelector('.masonry-overlay');
      if (ov) gsap.to(ov, { opacity: 0, duration: 0.4 });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: containerHeight, minHeight: 400 }}
    >
      {grid.map((item) => (
        <div
          key={item.id}
          data-masonry-key={item.id}
          className="absolute overflow-hidden rounded-2xl cursor-pointer"
          style={{ willChange: 'transform,width,height,opacity,filter', boxShadow: '0 8px 32px rgba(1,71,46,0.25)' }}
          onClick={() => onItemClick?.(item)}
          onMouseEnter={(e) => onEnter(item.id, e.currentTarget)}
          onMouseLeave={(e) => onLeave(item.id, e.currentTarget)}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${item.img})` }}
          >
            {colorShiftOnHover && (
              <div className="masonry-overlay absolute inset-0 bg-gradient-to-tr from-[#0B1914]/60 to-[#C69234]/30 opacity-0 pointer-events-none" />
            )}
          </div>
          {item.title && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <p className="text-white text-xs font-semibold uppercase tracking-widest">{item.title}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MasonryGallery;
