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

/** True when the current session is a guest (no account created yet). */
export function useIsGuest(): boolean {
  const { user } = useSession();
  return (user as (User & { is_anonymous?: boolean }) | null)?.is_anonymous === true;
}

let guestBootstrap: Promise<Session | null> | null = null;

/**
 * Baila can be experienced before signing up: if there's no session we start a
 * real (anonymous) backend session so every existing feature keeps working.
 */
export function ensureGuestSession(): Promise<Session | null> {
  if (!guestBootstrap) {
    guestBootstrap = (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return anon.session ?? null;
    })().catch((e) => {
      guestBootstrap = null;
      throw e;
    });
  }
  return guestBootstrap;
}
