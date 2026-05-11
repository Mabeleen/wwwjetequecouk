import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
            if (sessionId) await markSessionPaid(sessionId);
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
