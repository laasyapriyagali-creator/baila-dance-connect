
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_single_main_video() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage policies: per-user folder pattern (bucket/<uid>/...)
CREATE POLICY "Authenticated can read dance videos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'dance-videos');
CREATE POLICY "Users upload own dance videos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dance-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own dance videos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'dance-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own dance videos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'dance-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated can read avatars" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated can read covers" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'covers');
CREATE POLICY "Users upload own cover" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own cover" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own cover" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
