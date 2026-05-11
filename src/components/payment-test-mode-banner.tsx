import { isStripeTestMode } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  if (!isStripeTestMode()) return null;
  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
      All payments in the preview are in test mode. Use card{" "}
      <code className="font-mono font-bold">4242 4242 4242 4242</code>, any future
      expiry, any CVC.
    </div>
  );
}
