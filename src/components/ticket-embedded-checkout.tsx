import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo } from "react";
import { getStripe } from "@/lib/stripe";
import { createTicketCheckout } from "@/lib/checkout.functions";

interface Props {
  competitionId: string;
  quantity: number;
  onClose?: () => void;
}

export function TicketEmbeddedCheckout({ competitionId, quantity }: Props) {
  const fn = useServerFn(createTicketCheckout);

  const fetchClientSecret = useCallback(async () => {
    const res = await fn({ data: { competitionId, quantity } });
    return res.clientSecret;
  }, [fn, competitionId, quantity]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <div id="checkout" className="min-h-[420px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
