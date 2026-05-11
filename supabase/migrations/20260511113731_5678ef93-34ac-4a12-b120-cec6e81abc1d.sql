
-- Recreate view with security_invoker
DROP VIEW IF EXISTS public.competition_sold_counts;
CREATE VIEW public.competition_sold_counts
WITH (security_invoker = true) AS
SELECT competition_id, COUNT(*)::int AS sold
FROM public.tickets WHERE paid = true
GROUP BY competition_id;
GRANT SELECT ON public.competition_sold_counts TO anon, authenticated;

-- Restrict handle_new_user execution (trigger still works)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
