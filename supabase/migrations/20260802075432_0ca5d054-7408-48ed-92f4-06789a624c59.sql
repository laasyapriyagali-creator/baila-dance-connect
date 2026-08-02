REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_connection_request() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_new_class() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_new_event() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_single_main_video() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM authenticated, anon;