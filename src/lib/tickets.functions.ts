import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Mock ticket purchase — allocates random unsold ticket numbers and marks
 * them paid. Replace with Stripe Checkout in the next iteration.
 */
export const purchaseTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        competitionId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: comp, error: cErr } = await supabase
      .from("competitions")
      .select("id, total_tickets")
      .eq("id", data.competitionId)
      .single();
    if (cErr || !comp) throw new Error("Competition not found");

    const { data: taken } = await supabase
      .from("tickets")
      .select("ticket_number")
      .eq("competition_id", comp.id);
    const takenSet = new Set((taken ?? []).map((t) => t.ticket_number));
    const available: number[] = [];
    for (let n = 1; n <= comp.total_tickets; n++) {
      if (!takenSet.has(n)) available.push(n);
    }
    if (available.length < data.quantity) {
      throw new Error("Not enough tickets remaining");
    }
    // shuffle and pick
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }
    const picked = available.slice(0, data.quantity);
    const rows = picked.map((ticket_number) => ({
      competition_id: comp.id,
      user_id: userId,
      ticket_number,
      paid: true,
    }));
    const { error: insErr } = await supabase.from("tickets").insert(rows);
    if (insErr) throw new Error(insErr.message);
    return { ticketNumbers: picked };
  });

export const getMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("tickets")
      .select("*, competitions(title, destination, hero_image, slug, draw_date)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
