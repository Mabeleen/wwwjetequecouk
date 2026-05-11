import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  // RLS-safe: query user_roles directly (user can read own roles)
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data, userId };
  });

export const adminListCompetitions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const [{ data: comps, error }, { data: sold }] = await Promise.all([
      supabase.from("competitions").select("*").order("created_at", { ascending: false }),
      supabase.from("competition_sold_counts").select("*"),
    ]);
    if (error) throw new Error(error.message);
    const soldMap = new Map((sold ?? []).map((s: any) => [s.competition_id, s.sold]));
    return (comps ?? []).map((c: any) => ({ ...c, sold: soldMap.get(c.id) ?? 0 }));
  });

const competitionSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  destination: z.string().min(1),
  tagline: z.string().nullable().optional(),
  description: z.string().min(1),
  hero_image: z.string().min(1),
  total_tickets: z.number().int().min(1),
  ticket_price_pence: z.number().int().min(1),
  draw_date: z.string().min(1),
  status: z.enum(["live", "draft", "closed"]),
  featured: z.boolean(),
});

export const adminUpsertCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => competitionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.id) {
      const { error } = await supabase.from("competitions").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase
      .from("competitions")
      .insert({ ...data, gallery: [], prize_includes: [] })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const adminDeleteCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("competitions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        competitionId: z.string().uuid().optional(),
        paidOnly: z.boolean().optional(),
      })
      .parse(d ?? {})
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    let q = supabase
      .from("tickets")
      .select("*, competitions(title, destination, slug)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.competitionId) q = q.eq("competition_id", data.competitionId);
    if (data.paidOnly) q = q.eq("paid", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminListWinners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("winners")
      .select("*, competitions(title, destination, slug)")
      .order("announced_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminAddWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        competition_id: z.string().uuid(),
        winner_name: z.string().min(1),
        winner_location: z.string().optional().nullable(),
        ticket_number: z.number().int().min(1).optional().nullable(),
        story: z.string().optional().nullable(),
        photo_url: z.string().optional().nullable(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("winners").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("winners").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
