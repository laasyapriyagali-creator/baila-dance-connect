
-- 1. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('dancer','instructor','organizer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'dancer',
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS years_dancing int,
  ADD COLUMN IF NOT EXISTS availability text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.connection_requests
  ADD COLUMN IF NOT EXISTS seen_at timestamptz;

-- has_role helper (reads from profiles since role lives there)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role)
$$;

-- 2. Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  style text NOT NULL,
  level text NOT NULL DEFAULT 'all',
  city text,
  recurrence text,
  description text,
  cover_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes viewable by authenticated" ON public.classes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "instructors insert own classes" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = instructor_id AND public.has_role(auth.uid(), 'instructor'));
CREATE POLICY "instructors update own classes" ON public.classes
  FOR UPDATE TO authenticated
  USING (auth.uid() = instructor_id) WITH CHECK (auth.uid() = instructor_id);
CREATE POLICY "instructors delete own classes" ON public.classes
  FOR DELETE TO authenticated USING (auth.uid() = instructor_id);
CREATE TRIGGER classes_touch_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  style text,
  city text,
  venue text,
  starts_at timestamptz NOT NULL,
  description text,
  cover_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events viewable by authenticated" ON public.events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "organizers insert own events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = organizer_id AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "organizers update own events" ON public.events
  FOR UPDATE TO authenticated
  USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "organizers delete own events" ON public.events
  FOR DELETE TO authenticated USING (auth.uid() = organizer_id);
CREATE TRIGGER events_touch_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC) WHERE read_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Triggers that create notifications
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, kind, payload)
    VALUES (NEW.to_user, 'connection_request', jsonb_build_object('request_id', NEW.id, 'from_user', NEW.from_user));
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    INSERT INTO public.notifications(user_id, kind, payload)
    VALUES (NEW.from_user, 'connection_accepted', jsonb_build_object('request_id', NEW.id, 'with_user', NEW.to_user));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS connection_requests_notify ON public.connection_requests;
CREATE TRIGGER connection_requests_notify
  AFTER INSERT OR UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_connection_request();

CREATE OR REPLACE FUNCTION public.notify_new_class()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(user_id, kind, payload)
  SELECT DISTINCT cr.from_user, 'new_class', jsonb_build_object('class_id', NEW.id, 'instructor_id', NEW.instructor_id, 'title', NEW.title)
  FROM public.connection_requests cr
  WHERE cr.to_user = NEW.instructor_id AND cr.status = 'accepted'
  UNION
  SELECT DISTINCT cr.to_user, 'new_class', jsonb_build_object('class_id', NEW.id, 'instructor_id', NEW.instructor_id, 'title', NEW.title)
  FROM public.connection_requests cr
  WHERE cr.from_user = NEW.instructor_id AND cr.status = 'accepted';
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS classes_notify ON public.classes;
CREATE TRIGGER classes_notify AFTER INSERT ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_class();

CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(user_id, kind, payload)
  SELECT DISTINCT cr.from_user, 'new_event', jsonb_build_object('event_id', NEW.id, 'organizer_id', NEW.organizer_id, 'title', NEW.title)
  FROM public.connection_requests cr
  WHERE cr.to_user = NEW.organizer_id AND cr.status = 'accepted'
  UNION
  SELECT DISTINCT cr.to_user, 'new_event', jsonb_build_object('event_id', NEW.id, 'organizer_id', NEW.organizer_id, 'title', NEW.title)
  FROM public.connection_requests cr
  WHERE cr.from_user = NEW.organizer_id AND cr.status = 'accepted';
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS events_notify ON public.events;
CREATE TRIGGER events_notify AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_event();
