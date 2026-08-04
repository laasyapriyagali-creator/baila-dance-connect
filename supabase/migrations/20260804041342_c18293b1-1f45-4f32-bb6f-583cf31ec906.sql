-- Helper: block relationship in either direction
CREATE OR REPLACE FUNCTION public.is_blocked_pair(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  )
$$;

-- Helper: does the owner allow their videos to be seen
CREATE OR REPLACE FUNCTION public.videos_visible(_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT videos_public FROM public.user_settings WHERE user_id = _owner), true)
$$;

REVOKE ALL ON FUNCTION public.is_blocked_pair(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.videos_visible(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked_pair(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.videos_visible(uuid) TO authenticated;

-- dance_videos: respect owner privacy flag and blocks
DROP POLICY IF EXISTS "Videos viewable by authenticated" ON public.dance_videos;
CREATE POLICY "Videos viewable when shared and not blocked"
ON public.dance_videos
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (
    public.videos_visible(user_id)
    AND NOT public.is_blocked_pair(auth.uid(), user_id)
  )
);

-- profiles: hide profiles across a block relationship
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable when not blocked"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR NOT public.is_blocked_pair(auth.uid(), id)
);

-- Internal SECURITY DEFINER routines must not be directly callable by clients
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_connection_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_class() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;