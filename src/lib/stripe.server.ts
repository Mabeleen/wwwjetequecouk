// Server-only Stripe client routed through the Lovable connector gateway.
// The STRIPE_SANDBOX_API_KEY / STRIPE_LIVE_API_KEY env vars are gateway
// connection keys, NOT real Stripe secrets — we must proxy via the gateway.
import Stripe from "stripe";

export type StripeEnv = "sandbox" | "live";

const GATEWAY_STRIPE_BASE = "https://connector-gateway.lovable.dev/stripe";

function getEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is not configured`);
  return v;
}

export function getStripeEnv(): StripeEnv {
  return process.env.STRIPE_LIVE_API_KEY ? "live" : "sandbox";
}

function getConnectionApiKey(env: StripeEnv): string {
  return env === "live"
    ? getEnv("STRIPE_LIVE_API_KEY")
    : getEnv("STRIPE_SANDBOX_API_KEY");
}

export function createStripeClient(env: StripeEnv = getStripeEnv()): Stripe {
  const connectionApiKey = getConnectionApiKey(env);
  const lovableApiKey = getEnv("LOVABLE_API_KEY");

  return new Stripe(connectionApiKey, {
    apiVersion: "2026-03-25.dahlia",
    httpClient: Stripe.createFetchHttpClient((url, init) => {
      const gatewayUrl = url
        .toString()
        .replace("https://api.stripe.com", GATEWAY_STRIPE_BASE);
      return fetch(gatewayUrl, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers).entries()),
          "X-Connection-Api-Key": connectionApiKey,
          "Lovable-API-Key": lovableApiKey,
        },
      });
    }),
  });
}
