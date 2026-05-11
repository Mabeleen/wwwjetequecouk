// Server-side helper to enqueue a transactional email without going through
// the JWT-protected /lovable/email/transactional/send route. Used by webhooks
// and other server-to-server triggers.
import * as React from "react";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "Jeteque Holiday Wins";
const SENDER_DOMAIN = "notify.jeteque.com";
const FROM_DOMAIN = "notify.jeteque.com";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function enqueueTransactionalEmail(opts: {
  templateName: string;
  recipientEmail?: string;
  idempotencyKey?: string;
  templateData?: Record<string, any>;
}) {
  const template = TEMPLATES[opts.templateName];
  if (!template) {
    console.error("[email] template not found:", opts.templateName);
    return { success: false, reason: "template_not_found" as const };
  }

  const recipient = (template.to || opts.recipientEmail || "").trim();
  if (!recipient) return { success: false, reason: "no_recipient" as const };

  const supabase = supabaseAdmin as any;
  const messageId = crypto.randomUUID();
  const idempotencyKey = opts.idempotencyKey || messageId;
  const normalized = recipient.toLowerCase();

  // Suppression check
  const { data: suppressed } = await supabase
    .from("suppressed_emails").select("id").eq("email", normalized).maybeSingle();
  if (suppressed) {
    await supabase.from("email_send_log").insert({
      message_id: messageId, template_name: opts.templateName,
      recipient_email: recipient, status: "suppressed",
    });
    return { success: false, reason: "suppressed" as const };
  }

  // Unsubscribe token (one per email)
  let unsubscribeToken: string;
  const { data: existing } = await supabase
    .from("email_unsubscribe_tokens").select("token, used_at")
    .eq("email", normalized).maybeSingle();
  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token;
  } else if (!existing) {
    unsubscribeToken = generateToken();
    await supabase.from("email_unsubscribe_tokens")
      .upsert({ token: unsubscribeToken, email: normalized },
        { onConflict: "email", ignoreDuplicates: true });
    const { data: stored } = await supabase
      .from("email_unsubscribe_tokens").select("token")
      .eq("email", normalized).maybeSingle();
    if (stored) unsubscribeToken = stored.token;
  } else {
    return { success: false, reason: "token_used" as const };
  }

  const data = opts.templateData ?? {};
  const element = React.createElement(template.component, data);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject = typeof template.subject === "function"
    ? template.subject(data) : template.subject;

  await supabase.from("email_send_log").insert({
    message_id: messageId, template_name: opts.templateName,
    recipient_email: recipient, status: "pending",
  });

  const { error } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label: opts.templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken!,
      queued_at: new Date().toISOString(),
    },
  });

  if (error) {
    console.error("[email] enqueue failed:", error);
    return { success: false, reason: "enqueue_failed" as const };
  }
  return { success: true };
}
