CREATE TABLE public.dance_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.connection_requests(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue TEXT NOT NULL,
  style TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dance_dates TO authenticated;
GRANT ALL ON public.dance_dates TO service_role;
ALTER TABLE public.dance_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Either party of the request can view the dance date" ON public.dance_dates
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.connection_requests cr
      WHERE cr.id = dance_dates.request_id
        AND (cr.from_user = auth.uid() OR cr.to_user = auth.uid())
    )
  );

CREATE POLICY "Either party of the request can create the dance date" ON public.dance_dates
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = created_by AND EXISTS (
      SELECT 1 FROM public.connection_requests cr
      WHERE cr.id = dance_dates.request_id
        AND (cr.from_user = auth.uid() OR cr.to_user = auth.uid())
    )
  );

CREATE POLICY "Either party of the request can update the dance date" ON public.dance_dates
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.connection_requests cr
      WHERE cr.id = dance_dates.request_id
        AND (cr.from_user = auth.uid() OR cr.to_user = auth.uid())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.connection_requests cr
      WHERE cr.id = dance_dates.request_id
        AND (cr.from_user = auth.uid() OR cr.to_user = auth.uid())
    )
  );

CREATE POLICY "Either party of the request can delete the dance date" ON public.dance_dates
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.connection_requests cr
      WHERE cr.id = dance_dates.request_id
        AND (cr.from_user = auth.uid() OR cr.to_user = auth.uid())
    )
  );

CREATE TRIGGER dance_dates_touch BEFORE UPDATE ON public.dance_dates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
