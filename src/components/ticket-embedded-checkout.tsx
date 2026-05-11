import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTicketCheckout } from "@/lib/checkout.functions";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  competitionId: string;
  quantity: number;
  onClose?: () => void;
}

export function TicketEmbeddedCheckout({ competitionId, quantity }: Props) {
  const fn = useServerFn(createTicketCheckout);
  const { session } = useAuth();

  const fetchClientSecret = useCallback(async () => {
    const accessToken = session?.access_token;
    if (!accessToken) throw new Error("Please sign in again before checking out.");

    const res = await fn({
      data: {
        competitionId,
        quantity,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        accessToken,
      },
    });
    if (!res?.clientSecret) {
      throw new Error("Unable to start checkout. Please try again.");
    }
    return res.clientSecret;
  }, [fn, competitionId, quantity, session?.access_token]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <div id="checkout" className="min-h-[420px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
