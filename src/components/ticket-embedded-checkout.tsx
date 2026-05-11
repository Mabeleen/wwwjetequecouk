import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTicketCheckout } from "@/lib/checkout.functions";

interface Props {
  competitionId: string;
  quantity: number;
  accessToken: string;
  onClose?: () => void;
}

export function TicketEmbeddedCheckout({ competitionId, quantity, accessToken }: Props) {
  const fn = useServerFn(createTicketCheckout);

  const fetchClientSecret = useCallback(async () => {
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
  }, [fn, competitionId, quantity, accessToken]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <div id="checkout" className="min-h-[420px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
