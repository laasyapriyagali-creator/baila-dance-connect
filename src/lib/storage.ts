import { supabase } from "@/integrations/supabase/client";

type Entry = { url: string; expires: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<string | null>>();
const MAX = 300;
const DEFAULT_TTL = 60 * 60; // 1h

function getCached(key: string, now: number): string | null {
  const hit = cache.get(key);
  if (hit && hit.expires > now + 60_000) {
    cache.delete(key);
    cache.set(key, hit);
    return hit.url;
  }
  return null;
}

function setCached(key: string, url: string, ttlSeconds: number) {
  cache.set(key, { url, expires: Date.now() + ttlSeconds * 1000 });
  while (cache.size > MAX) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

export async function signedUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn = DEFAULT_TTL,
): Promise<string | null> {
  if (!path) return null;
  const key = `${bucket}:${path}`;
  const cached = getCached(key, Date.now());
  if (cached) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const p = (async () => {
    // Tiny retry for transient network errors.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);
        if (error || !data) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 250));
            continue;
          }
          return null;
        }
        setCached(key, data.signedUrl, expiresIn);
        return data.signedUrl;
      } catch {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 250));
          continue;
        }
        return null;
      }
    }
    return null;
  })();
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/**
 * Batch sign multiple paths in the SAME bucket with a single Storage call.
 * Cached entries short-circuit; misses are batched via createSignedUrls.
 */
export async function signedUrlsBatch(
  bucket: string,
  paths: (string | null | undefined)[],
  expiresIn = DEFAULT_TTL,
): Promise<(string | null)[]> {
  const now = Date.now();
  const out: (string | null)[] = new Array(paths.length).fill(null);
  const missingIdx: number[] = [];
  const missingPaths: string[] = [];

  paths.forEach((p, i) => {
    if (!p) return;
    const cached = getCached(`${bucket}:${p}`, now);
    if (cached) {
      out[i] = cached;
    } else {
      missingIdx.push(i);
      missingPaths.push(p);
    }
  });

  if (missingPaths.length === 0) return out;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(missingPaths, expiresIn);
    if (error || !data) return out;
    data.forEach((entry, j) => {
      const idx = missingIdx[j];
      const path = missingPaths[j];
      if (entry?.signedUrl && path) {
        setCached(`${bucket}:${path}`, entry.signedUrl, expiresIn);
        out[idx] = entry.signedUrl;
      }
    });
  } catch {
    // ignore; callers handle null
  }
  return out;
}

/** Fire-and-forget pre-warm; never throws. */
export function prewarm(bucket: string, paths: (string | null | undefined)[]): void {
  const real = paths.filter((p): p is string => !!p);
  if (real.length === 0) return;
  void signedUrlsBatch(bucket, real).catch(() => undefined);
}

/** @deprecated use signedUrlsBatch */
export async function signedUrls(
  bucket: string,
  paths: (string | null | undefined)[],
): Promise<(string | null)[]> {
  return signedUrlsBatch(bucket, paths);
}
