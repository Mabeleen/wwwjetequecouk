// Server-only Stripe helpers (direct API via fetch).
// Uses STRIPE_SANDBOX_API_KEY (test) or STRIPE_LIVE_API_KEY (live).

function key() {
  const k = process.env.STRIPE_LIVE_API_KEY || process.env.STRIPE_SANDBOX_API_KEY;
  if (!k) throw new Error("Stripe API key not configured");
  return k;
}

export function isLiveMode() {
  return !!process.env.STRIPE_LIVE_API_KEY;
}

async function stripeRequest(path: string, body: Record<string, string>) {
  const params = new URLSearchParams(body);
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe error: ${json.error?.message ?? res.statusText}`);
  }
  return json;
}

export async function createCheckoutSession(opts: {
  amountPence: number;
  quantity: number;
  productName: string;
  productDescription?: string;
  imageUrl?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  customerEmail?: string;
}) {
  const body: Record<string, string> = {
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    "line_items[0][quantity]": String(opts.quantity),
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][unit_amount]": String(opts.amountPence),
    "line_items[0][price_data][product_data][name]": opts.productName,
  };
  if (opts.productDescription) body["line_items[0][price_data][product_data][description]"] = opts.productDescription;
  if (opts.imageUrl) body["line_items[0][price_data][product_data][images][0]"] = opts.imageUrl;
  if (opts.customerEmail) body.customer_email = opts.customerEmail;
  for (const [k, v] of Object.entries(opts.metadata)) {
    body[`metadata[${k}]`] = v;
    body[`payment_intent_data[metadata][${k}]`] = v;
  }
  return stripeRequest("/checkout/sessions", body) as Promise<{
    id: string;
    url: string;
  }>;
}
