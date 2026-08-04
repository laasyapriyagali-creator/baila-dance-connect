CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_blocked_pair(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  )
$$;

CREATE OR REPLACE FUNCTION private.videos_visible(_owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT videos_public FROM public.user_settings WHERE user_id = _owner), true)
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.is_blocked_pair(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.videos_visible(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_blocked_pair(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.videos_visible(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

-- Repoint policies at the private helpers
DROP POLICY IF EXISTS "Videos viewable when shared and not blocked" ON public.dance_videos;
CREATE POLICY "Videos viewable when shared and not blocked"
ON public.dance_videos FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR (private.videos_visible(user_id) AND NOT private.is_blocked_pair(auth.uid(), user_id))
);

DROP POLICY IF EXISTS "Profiles viewable when not blocked" ON public.profiles;
CREATE POLICY "Profiles viewable when not blocked"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR NOT private.is_blocked_pair(auth.uid(), id));

DROP POLICY IF EXISTS "instructors insert own classes" ON public.classes;
CREATE POLICY "instructors insert own classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = instructor_id AND private.has_role(auth.uid(), 'instructor'::public.app_role));

DROP POLICY IF EXISTS "organizers insert own events" ON public.events;
CREATE POLICY "organizers insert own events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = organizer_id AND private.has_role(auth.uid(), 'organizer'::public.app_role));

DROP FUNCTION IF EXISTS public.is_blocked_pair(uuid, uuid);
DROP FUNCTION IF EXISTS public.videos_visible(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);