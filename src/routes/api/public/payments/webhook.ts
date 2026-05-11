import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueTransactionalEmail } from "@/lib/email/enqueue.server";

function formatGbp(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

async function sendPurchaseEmails(sessionId: string) {
  const sb = supabaseAdmin as any;
  const { data: tickets } = await sb
    .from("tickets")
    .select("ticket_number, user_id, competition_id, competitions(title, destination, draw_date, ticket_price_pence)")
    .eq("stripe_session_id", sessionId);
  if (!tickets || tickets.length === 0) return;

  const ticketNumbers = tickets.map((t: any) => t.ticket_number).sort((a: number, b: number) => a - b);
  const userId = tickets[0].user_id as string;
  const comp = tickets[0].competitions as any;
  const totalPence = (comp?.ticket_price_pence ?? 0) * tickets.length;

  // Look up buyer email + name
  let buyerEmail = "";
  let buyerName: string | undefined;
  const { data: userResp } = await sb.auth.admin.getUserById(userId);
  buyerEmail = userResp?.user?.email ?? "";
  buyerName = userResp?.user?.user_metadata?.full_name;
  if (!buyerName) {
    const { data: profile } = await sb.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    buyerName = profile?.full_name ?? undefined;
  }

  // Buyer confirmation
  if (buyerEmail) {
    await enqueueTransactionalEmail({
      templateName: "ticket-confirmation",
      recipientEmail: buyerEmail,
      idempotencyKey: `ticket-confirm-${sessionId}`,
      templateData: {
        buyerName,
        competitionTitle: comp?.title,
        destination: comp?.destination,
        drawDate: formatDate(comp?.draw_date),
        ticketNumbers,
      },
    }).catch((e) => console.error("[webhook] buyer email failed:", e));
  }

  // Admin notification
  await enqueueTransactionalEmail({
    templateName: "admin-sale-notification",
    idempotencyKey: `admin-sale-${sessionId}`,
    templateData: {
      buyerEmail,
      buyerName,
      competitionTitle: comp?.title,
      quantity: tickets.length,
      totalGbp: formatGbp(totalPence),
      ticketNumbers,
      sessionId,
    },
  }).catch((e) => console.error("[webhook] admin email failed:", e));
}

function verifyStripeSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  // Stripe format: t=timestamp,v1=signature[,v1=...]
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...v] = p.split("=");
      return [k.trim(), v.join("=").trim()];
    })
  );
  const t = parts.t;
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || sigs.length === 0) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  return sigs.some((s) => {
    const buf = Buffer.from(s);
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf);
  });
}

function verifySimpleHmac(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const headerHex = header.replace(/^sha256=/i, "");
  if (headerHex.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(headerHex), Buffer.from(expected));
}

async function markSessionPaid(sessionId: string) {
  const { error } = await supabaseAdmin
    .from("tickets")
    .update({ paid: true })
    .eq("stripe_session_id", sessionId);
  if (error) console.error("[webhook] mark paid failed:", error.message);
}

async function releaseSession(sessionId: string) {
  const { error } = await supabaseAdmin
    .from("tickets")
    .delete()
    .eq("stripe_session_id", sessionId)
    .eq("paid", false);
  if (error) console.error("[webhook] release failed:", error.message);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = new URL(request.url).searchParams.get("env") ?? "sandbox";
        const secret =
          env === "live"
            ? process.env.PAYMENTS_LIVE_WEBHOOK_SECRET
            : process.env.PAYMENTS_SANDBOX_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook secret missing", { status: 500 });

        const rawBody = await request.text();
        const stripeSig = request.headers.get("stripe-signature");
        const lovableSig =
          request.headers.get("x-webhook-signature") ??
          request.headers.get("x-lovable-signature") ??
          request.headers.get("x-payments-signature");

        const ok =
          verifyStripeSignature(rawBody, stripeSig, secret) ||
          verifySimpleHmac(rawBody, lovableSig, secret);

        if (!ok) {
          console.error("[webhook] signature failed", {
            hasStripeSig: !!stripeSig,
            hasLovableSig: !!lovableSig,
            headerKeys: [...request.headers.keys()],
          });
          return new Response("Invalid signature", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const type: string = event.type ?? "";
        // Try multiple shapes: Stripe-native and Lovable-wrapped
        const sessionId: string | undefined =
          event?.data?.object?.id ??
          event?.data?.session_id ??
          event?.data?.object?.metadata?.session_id ??
          event?.session_id;
        const meta = event?.data?.object?.metadata ?? event?.data?.metadata ?? {};

        try {
          if (
            type === "checkout.session.completed" ||
            type === "transaction.completed" ||
            type === "payment_intent.succeeded"
          ) {
            if (sessionId) {
              await markSessionPaid(sessionId);
              await sendPurchaseEmails(sessionId);
            }
            else if (meta.user_id && meta.competition_id) {
              // Fallback: mark by metadata
              await supabaseAdmin
                .from("tickets")
                .update({ paid: true })
                .eq("user_id", meta.user_id)
                .eq("competition_id", meta.competition_id)
                .eq("paid", false);
            }
          } else if (
            type === "checkout.session.expired" ||
            type === "transaction.payment_failed" ||
            type === "payment_intent.payment_failed"
          ) {
            if (sessionId) await releaseSession(sessionId);
          }
        } catch (e: any) {
          console.error("[webhook] handler error:", e?.message);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
