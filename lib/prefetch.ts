'use client';

import { useCallback, useRef } from 'react';

const PREFETCH_TTL = 120_000;
const PREFETCH_DEBOUNCE = 300;

const cache = new Map<string, number>();
const dataCache = new Map<string, { data: unknown; ts: number }>();

export function isFresh(key: string): boolean {
  const ts = cache.get(key);
  return ts != null && Date.now() - ts < PREFETCH_TTL;
}

export function markFresh(key: string): void {
  cache.set(key, Date.now());
}

export function prefetch(key: string, fn: () => Promise<void>): void {
  if (isFresh(key)) return;
  cache.set(key, Date.now());
  fn().catch(() => cache.delete(key));
}

export function prefetchData<T>(key: string, fn: () => Promise<T>): void {
  if (isFresh(key)) return;
  cache.set(key, Date.now());
  fn()
    .then((data) => dataCache.set(key, { data, ts: Date.now() }))
    .catch(() => {
      cache.delete(key);
      dataCache.delete(key);
    });
}

export function getCachedData<T>(key: string): T | null {
  const entry = dataCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > PREFETCH_TTL) {
    dataCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function usePrefetchOnHover(
  key: string,
  fn: () => Promise<void>,
): { onMouseEnter: () => void; onMouseLeave: () => void } {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onMouseEnter = useCallback(() => {
    timer.current = setTimeout(() => {
      prefetch(key, fn);
    }, PREFETCH_DEBOUNCE);
  }, [key, fn]);

  const onMouseLeave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { onMouseEnter, onMouseLeave };
}
