import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export type CompetitionWithSold = Database["public"]["Tables"]["competitions"]["Row"] & {
  sold: number;
};

export const getCompetitions = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [{ data: comps, error }, { data: sold }] = await Promise.all([
    supabase.from("competitions").select("*").eq("status", "live").order("draw_date", { ascending: true }),
    supabase.from("competition_sold_counts").select("*"),
  ]);
  if (error) throw new Error(error.message);
  const soldMap = new Map((sold ?? []).map((s) => [s.competition_id, s.sold]));
  return (comps ?? []).map((c) => ({ ...c, sold: soldMap.get(c.id) ?? 0 })) as CompetitionWithSold[];
});

export const getCompetitionBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: comp, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!comp) return null;
    const { data: sold } = await supabase
      .from("competition_sold_counts")
      .select("sold")
      .eq("competition_id", comp.id)
      .maybeSingle();
    return { ...comp, sold: sold?.sold ?? 0 } as CompetitionWithSold;
  });

export const getWinners = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("winners")
    .select("*, competitions(title, destination, hero_image, slug)")
    .order("announced_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
});
