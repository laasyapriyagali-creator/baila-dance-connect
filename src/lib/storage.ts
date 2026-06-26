import { supabase } from "@/integrations/supabase/client";

type Entry = { url: string; expires: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<string | null>>();
const MAX = 300;

export async function signedUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn = 60 * 60,
): Promise<string | null> {
  if (!path) return null;
  const key = `${bucket}:${path}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now + 60_000) {
    // LRU refresh
    cache.delete(key);
    cache.set(key, hit);
    return hit.url;
  }
  const pending = inflight.get(key);
  if (pending) return pending;

  const p = (async () => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data) return null;
    cache.set(key, { url: data.signedUrl, expires: now + expiresIn * 1000 });
    while (cache.size > MAX) {
      const oldest = cache.keys().next().value;
      if (!oldest) break;
      cache.delete(oldest);
    }
    return data.signedUrl;
  })();
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

export async function signedUrls(
  bucket: string,
  paths: (string | null | undefined)[],
): Promise<(string | null)[]> {
  return Promise.all(paths.map((p) => signedUrl(bucket, p)));
}
