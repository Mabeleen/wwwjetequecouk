import { loadStripe, type Stripe } from "@stripe/stripe-js";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
export type StripeEnv = "sandbox" | "live";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!clientToken) {
      throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");
    }
    stripePromise = loadStripe(clientToken);
  }
  return stripePromise;
}

export function isStripeTestMode(): boolean {
  return !!clientToken?.startsWith("pk_test_");
}

export function getStripeEnvironment(): StripeEnv {
  return isStripeTestMode() ? "sandbox" : "live";
}
