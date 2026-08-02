-- 1. Extend connection status with expired + completed
ALTER TYPE public.connection_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE public.connection_status ADD VALUE IF NOT EXISTS 'completed';

-- 2. Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS favorite_style text,
  ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false;

-- 3. Per-user app settings / discovery preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discovery_styles text[] NOT NULL DEFAULT '{}',
  max_distance_km integer NOT NULL DEFAULT 50,
  age_min integer NOT NULL DEFAULT 18,
  age_max integer NOT NULL DEFAULT 60,
  discoverable boolean NOT NULL DEFAULT true,
  videos_public boolean NOT NULL DEFAULT true,
  notif_master boolean NOT NULL DEFAULT true,
  notif_requests boolean NOT NULL DEFAULT true,
  notif_decisions boolean NOT NULL DEFAULT true,
  notif_again boolean NOT NULL DEFAULT true,
  notif_reminders boolean NOT NULL DEFAULT true,
  blur_explicit boolean NOT NULL DEFAULT true,
  autoplay boolean NOT NULL DEFAULT true,
  video_quality text NOT NULL DEFAULT 'auto',
  trusted_contact text,
  emergency_contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own settings" ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_settings_touch BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Blocks
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read blocks involving them" ON public.blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "users create own blocks" ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id AND blocker_id <> blocked_id);
CREATE POLICY "users remove own blocks" ON public.blocks FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);
CREATE INDEX IF NOT EXISTS blocks_blocker_idx ON public.blocks (blocker_id);
CREATE INDEX IF NOT EXISTS blocks_blocked_idx ON public.blocks (blocked_id);

-- 5. Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid REFERENCES public.dance_videos(id) ON DELETE SET NULL,
  reason text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own reports" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);
CREATE POLICY "users file own reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND reporter_id <> reported_id);

-- 6. Planned dance dates tied to an accepted connection
CREATE TABLE IF NOT EXISTS public.dance_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES public.connection_requests(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue text NOT NULL,
  style text,
  starts_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dance_dates TO authenticated;
GRANT ALL ON public.dance_dates TO service_role;
ALTER TABLE public.dance_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties read dance dates" ON public.dance_dates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.connection_requests r WHERE r.id = request_id
    AND (auth.uid() = r.from_user OR auth.uid() = r.to_user)));
CREATE POLICY "parties create dance dates" ON public.dance_dates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.connection_requests r
    WHERE r.id = request_id AND r.status = 'accepted'
    AND (auth.uid() = r.from_user OR auth.uid() = r.to_user)));
CREATE POLICY "parties update dance dates" ON public.dance_dates FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.connection_requests r WHERE r.id = request_id
    AND (auth.uid() = r.from_user OR auth.uid() = r.to_user)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.connection_requests r WHERE r.id = request_id
    AND (auth.uid() = r.from_user OR auth.uid() = r.to_user)));
CREATE POLICY "parties delete dance dates" ON public.dance_dates FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.connection_requests r WHERE r.id = request_id
    AND (auth.uid() = r.from_user OR auth.uid() = r.to_user)));
CREATE TRIGGER dance_dates_touch BEFORE UPDATE ON public.dance_dates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 7. Skipped dancers (so skips persist + can be reset)
CREATE TABLE IF NOT EXISTS public.feed_skips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skipped_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skipped_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_skips TO authenticated;
GRANT ALL ON public.feed_skips TO service_role;
ALTER TABLE public.feed_skips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own skips" ON public.feed_skips FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS feed_skips_user_idx ON public.feed_skips (user_id, created_at DESC);

-- 8. Missing notification insert path for triggers is security definer already.
-- Ensure connection triggers exist (they were defined but not attached).
DROP TRIGGER IF EXISTS connection_requests_notify ON public.connection_requests;
CREATE TRIGGER connection_requests_notify
  AFTER INSERT OR UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_connection_request();
DROP TRIGGER IF EXISTS connection_requests_touch ON public.connection_requests;
CREATE TRIGGER connection_requests_touch BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS dance_videos_single_main ON public.dance_videos;
CREATE TRIGGER dance_videos_single_main BEFORE INSERT OR UPDATE ON public.dance_videos
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_main_video();
DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();