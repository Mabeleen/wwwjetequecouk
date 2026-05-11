import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHost } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient } from "./stripe.server";

const RESERVATION_TTL_MIN = 45;

export const createTicketCheckout = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        competitionId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
        returnUrl: z.string().url(),
        environment: z.enum(["sandbox", "live"]),
        accessToken: z.string().min(1),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(data.accessToken);
    if (authError || !authData.user) throw new Response("Unauthorized", { status: 401 });

    const userId = authData.user.id;
    const host = getRequestHost();
    const environment = data.environment;
    const stripe = createStripeClient(environment);

    // Load competition
    const { data: comp, error: cErr } = await supabaseAdmin
      .from("competitions")
      .select("id, title, destination, hero_image, total_tickets, ticket_price_pence, status, slug")
      .eq("id", data.competitionId)
      .single();
    if (cErr || !comp) throw new Error("Competition not found");
    if (comp.status !== "live") throw new Error("Competition is not open");

    // Sweep abandoned reservations (>45min, unpaid) before allocating
    const cutoff = new Date(Date.now() - RESERVATION_TTL_MIN * 60_000).toISOString();
    await supabaseAdmin
      .from("tickets")
      .delete()
      .eq("competition_id", comp.id)
      .eq("paid", false)
      .lt("created_at", cutoff);

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
    const fallbackProto = host.includes("localhost") ? "http" : "https";
    const fallbackReturnUrl = `${fallbackProto}://${host}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const returnUrl = data.returnUrl.includes("{CHECKOUT_SESSION_ID}")
      ? data.returnUrl
      : fallbackReturnUrl;
    const email = authData.user.email;

    // Create Embedded Checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: returnUrl,
        expires_at: Math.floor(Date.now() / 1000) + RESERVATION_TTL_MIN * 60,
        line_items: [
          {
            quantity: data.quantity,
            price_data: {
              currency: "gbp",
              unit_amount: comp.ticket_price_pence,
              product_data: {
                name: `${comp.title} — ${data.quantity} ticket${data.quantity > 1 ? "s" : ""}`,
                description: `Holiday to ${comp.destination}. Draw will assign your ticket numbers if you win.`,
                images: comp.hero_image ? [comp.hero_image] : undefined,
              },
            },
          },
        ],
        ...(email && { customer_email: email }),
        metadata: {
          user_id: userId,
          competition_id: comp.id,
          ticket_numbers: picked.join(","),
        },
        payment_intent_data: {
          metadata: {
            user_id: userId,
            competition_id: comp.id,
            ticket_numbers: picked.join(","),
          },
        },
      });
    } catch (err: any) {
      console.error("[checkout] stripe.checkout.sessions.create failed", {
        message: err?.message,
        type: err?.type,
        code: err?.code,
        raw: err?.raw,
        env: environment,
      });
      throw new Error(`Stripe checkout failed: ${err?.message ?? "unknown"}`);
    }

    if (!session.client_secret) {
      console.error("[checkout] missing client_secret on session", {
        sessionId: session.id,
        ui_mode: session.ui_mode,
        status: session.status,
      });
      throw new Error("Stripe did not return a client_secret for embedded checkout");
    }

    // Reserve tickets as unpaid, tied to this session
    const rows = picked.map((ticket_number) => ({
      competition_id: comp.id,
      user_id: userId,
      ticket_number,
      paid: false,
      stripe_session_id: session.id,
    }));
    const { error: insErr } = await supabaseAdmin.from("tickets").insert(rows);
    if (insErr) throw new Error(insErr.message);

    return {
      clientSecret: session.client_secret,
      sessionId: session.id,
      environment,
    };
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
