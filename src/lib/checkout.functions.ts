import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getRequestHost } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createCheckoutSession } from "./stripe.server";

export const createTicketCheckout = createServerFn({ method: "POST" })
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
    const { userId, claims } = context;

    // Load competition
    const { data: comp, error: cErr } = await supabaseAdmin
      .from("competitions")
      .select("id, title, destination, hero_image, total_tickets, ticket_price_pence, status, slug")
      .eq("id", data.competitionId)
      .single();
    if (cErr || !comp) throw new Error("Competition not found");
    if (comp.status !== "live") throw new Error("Competition is not open");

    // Pick random unsold ticket numbers
    const { data: taken } = await supabaseAdmin
      .from("tickets")
      .select("ticket_number")
      .eq("competition_id", comp.id);
    const takenSet = new Set((taken ?? []).map((t) => t.ticket_number));
    const available: number[] = [];
    for (let n = 1; n <= comp.total_tickets; n++) if (!takenSet.has(n)) available.push(n);
    if (available.length < data.quantity) throw new Error("Not enough tickets remaining");
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }
    const picked = available.slice(0, data.quantity);

    // Build URLs
    const host = getRequestHost();
    const proto = host.includes("localhost") ? "http" : "https";
    const origin = `${proto}://${host}`;

    // Create Stripe Checkout Session FIRST so we have session id to attach
    const email = (claims as any)?.email as string | undefined;
    const session = await createCheckoutSession({
      amountPence: comp.ticket_price_pence,
      quantity: data.quantity,
      productName: `${comp.title} — ${data.quantity} ticket${data.quantity > 1 ? "s" : ""}`,
      productDescription: `Holiday to ${comp.destination}. Draw will assign your ticket numbers if you win.`,
      imageUrl: comp.hero_image,
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/competitions/${comp.slug}?cancelled=1`,
      customerEmail: email,
      metadata: {
        user_id: userId,
        competition_id: comp.id,
        ticket_numbers: picked.join(","),
      },
    });

    // Reserve tickets as unpaid, tied to this session
    const rows = picked.map((ticket_number) => ({
      competition_id: comp.id,
      user_id: userId,
      ticket_number,
      paid: false,
      stripe_session_id: session.id,
    }));
    const { error: insErr } = await supabaseAdmin.from("tickets").insert(rows);
    if (insErr) {
      // best-effort cleanup not required; checkout will simply expire
      throw new Error(insErr.message);
    }

    return { url: session.url, sessionId: session.id };
  });

export const getCheckoutResult = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ sessionId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: tickets, error } = await supabaseAdmin
      .from("tickets")
      .select("ticket_number, paid, competition_id, competitions(title, destination, slug, hero_image, draw_date)")
      .eq("stripe_session_id", data.sessionId)
      .eq("user_id", userId)
      .order("ticket_number", { ascending: true });
    if (error) throw new Error(error.message);
    const paid = (tickets ?? []).every((t) => t.paid) && (tickets?.length ?? 0) > 0;
    return { tickets: tickets ?? [], paid };
  });
