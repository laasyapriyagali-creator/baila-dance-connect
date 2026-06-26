
-- Feed: latest main videos
CREATE INDEX IF NOT EXISTS dance_videos_main_recent_idx
  ON public.dance_videos (created_at DESC)
  WHERE is_main = true;

-- Connection requests by sender+status (feed exclusion list)
CREATE INDEX IF NOT EXISTS cr_from_status_idx
  ON public.connection_requests (from_user, status);

-- Connection requests by recipient+status (counts and inbox lookups)
CREATE INDEX IF NOT EXISTS cr_to_status_idx
  ON public.connection_requests (to_user, status);

-- Badge: unseen pending requests for a recipient
CREATE INDEX IF NOT EXISTS cr_to_pending_unseen_idx
  ON public.connection_requests (to_user)
  WHERE status = 'pending' AND seen_at IS NULL;
