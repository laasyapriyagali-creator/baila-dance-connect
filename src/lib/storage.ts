import { supabase } from "@/integrations/supabase/client";

type Entry = { url: string; expires: number };
const cache = new Map<string, Entry>();
const MAX = 200;

export async function signedUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn = 60 * 60,
): Promise<string | null> {
  if (!path) return null;
  const key = `${bucket}:${path}`;
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && hit.expires > now + 60_000) {
    // refresh recency
    cache.delete(key);
    cache.set(key, hit);
    return hit.url;
  }
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  cache.set(key, { url: data.signedUrl, expires: now + expiresIn * 1000 });
  while (cache.size > MAX) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
  return data.signedUrl;
}

export async function signedUrls(
  bucket: string,
  paths: (string | null | undefined)[],
): Promise<(string | null)[]> {
  return Promise.all(paths.map((p) => signedUrl(bucket, p)));
}
