import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Single shared subscription instead of one per component.
type State = { session: Session | null; loading: boolean };
let state: State = { session: null, loading: true };
const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  for (const l of listeners) l();
}

function init() {
  if (initialized) return;
  initialized = true;
  supabase.auth.getSession().then(({ data }) => {
    state = { session: data.session, loading: false };
    emit();
  });
  supabase.auth.onAuthStateChange((_e, s) => {
    state = { session: s, loading: false };
    emit();
  });
}

function subscribe(cb: () => void) {
  init();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;
const getServerSnapshot = () => state;

export function useSession(): { session: Session | null; user: User | null; loading: boolean } {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { session: s.session, user: s.session?.user ?? null, loading: s.loading };
}
