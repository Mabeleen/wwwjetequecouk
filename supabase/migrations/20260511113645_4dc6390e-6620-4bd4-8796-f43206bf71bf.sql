
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles insertable by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Competitions
CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  tagline TEXT,
  hero_image TEXT NOT NULL,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL,
  prize_includes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ticket_price_pence INTEGER NOT NULL DEFAULT 500,
  total_tickets INTEGER NOT NULL DEFAULT 1000,
  draw_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'live',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Competitions readable by all" ON public.competitions FOR SELECT USING (true);

-- Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  stripe_session_id TEXT,
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, ticket_number)
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tickets viewable by owner" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX tickets_competition_idx ON public.tickets(competition_id);
CREATE INDEX tickets_user_idx ON public.tickets(user_id);

-- Public sold-count view (no PII)
CREATE OR REPLACE VIEW public.competition_sold_counts AS
SELECT competition_id, COUNT(*)::int AS sold
FROM public.tickets WHERE paid = true
GROUP BY competition_id;
GRANT SELECT ON public.competition_sold_counts TO anon, authenticated;

-- Winners
CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  winner_name TEXT NOT NULL,
  winner_location TEXT,
  ticket_number INTEGER NOT NULL,
  photo_url TEXT,
  story TEXT,
  announced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Winners readable by all" ON public.winners FOR SELECT USING (true);
