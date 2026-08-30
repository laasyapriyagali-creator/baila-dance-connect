ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_is_guest_created_at_idx ON public.profiles (is_guest, created_at);
CREATE INDEX IF NOT EXISTS profiles_is_demo_idx ON public.profiles (is_demo) WHERE is_demo;