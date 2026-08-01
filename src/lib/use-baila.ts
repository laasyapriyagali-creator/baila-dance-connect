import { useEffect, useState, useSyncExternalStore } from "react";
import { bailaStore, getVideoUrl, type BailaState } from "@/lib/baila-local";

export function useBaila(): BailaState {
  return useSyncExternalStore(bailaStore.subscribe, bailaStore.get, bailaStore.getServer);
}

export function useReelUrl(id: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (!id) return;
    getVideoUrl(id).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [id]);
  return url;
}
