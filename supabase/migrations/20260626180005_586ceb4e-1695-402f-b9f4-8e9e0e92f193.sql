
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  city TEXT,
  experience TEXT CHECK (experience IN ('Beginner','Intermediate','Advanced','Pro')),
  avatar_url TEXT,
  cover_url TEXT,
  dance_styles TEXT[] NOT NULL DEFAULT '{}',
  socials JSONB NOT NULL DEFAULT '[]'::jsonb,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- Dance videos
CREATE TABLE public.dance_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  video_url TEXT NOT NULL,
  poster_url TEXT,
  duration_seconds INT,
  position INT NOT NULL DEFAULT 0,
  is_main BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX dance_videos_user_idx ON public.dance_videos(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dance_videos TO authenticated;
GRANT ALL ON public.dance_videos TO service_role;
ALTER TABLE public.dance_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Videos viewable by authenticated" ON public.dance_videos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own videos insert" ON public.dance_videos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own videos update" ON public.dance_videos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own videos delete" ON public.dance_videos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Connection requests
CREATE TYPE public.connection_status AS ENUM ('pending','accepted','declined');
CREATE TABLE public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.connection_status NOT NULL DEFAULT 'pending',
  again_from BOOLEAN NOT NULL DEFAULT false,
  again_to BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self CHECK (from_user <> to_user),
  CONSTRAINT unique_pair UNIQUE (from_user, to_user)
);
CREATE INDEX cr_from_idx ON public.connection_requests(from_user);
CREATE INDEX cr_to_idx ON public.connection_requests(to_user);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connection_requests TO authenticated;
GRANT ALL ON public.connection_requests TO service_role;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own connection rows" ON public.connection_requests
  FOR SELECT TO authenticated USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "Send a request" ON public.connection_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user);
CREATE POLICY "Recipient or sender can update" ON public.connection_requests
  FOR UPDATE TO authenticated USING (auth.uid() = from_user OR auth.uid() = to_user)
  WITH CHECK (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "Either party can delete" ON public.connection_requests
  FOR DELETE TO authenticated USING (auth.uid() = from_user OR auth.uid() = to_user);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER cr_touch BEFORE UPDATE ON public.connection_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- New user trigger -> create profile
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enforce single main video per user
CREATE OR REPLACE FUNCTION public.ensure_single_main_video() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_main THEN
    UPDATE public.dance_videos SET is_main = false WHERE user_id = NEW.user_id AND id <> NEW.id AND is_main = true;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER dance_videos_single_main AFTER INSERT OR UPDATE OF is_main ON public.dance_videos
  FOR EACH ROW WHEN (NEW.is_main = true) EXECUTE FUNCTION public.ensure_single_main_video();
