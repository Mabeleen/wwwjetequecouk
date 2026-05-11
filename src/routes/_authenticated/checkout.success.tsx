import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCheckoutResult } from "@/lib/checkout.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Plane, Calendar } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/checkout/success")({
  validateSearch: (s) => z.object({ session_id: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Good luck! — JETEQUE" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { session_id } = Route.useSearch();
  const fn = useServerFn(getCheckoutResult);
  const { data, isLoading } = useQuery({
    queryKey: ["checkout-result", session_id],
    queryFn: () => fn({ data: { sessionId: session_id! } }),
    enabled: !!session_id,
    refetchInterval: (q) => (q.state.data?.paid ? false : 1500),
  });

  const tickets = data?.tickets ?? [];
  const comp: any = tickets[0]?.competitions;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:py-24 text-center">
      <Card className="p-8 md:p-12 shadow-glow overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-tropical opacity-10 pointer-events-none" />
        <div className="relative">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-sunset shadow-glow">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold bg-gradient-sunset bg-clip-text text-transparent">
            GOOD LUCK!
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {data?.paid
              ? "Your tickets are confirmed. Fingers crossed for the draw!"
              : "Confirming your payment…"}
          </p>

          {comp && (
            <div className="mt-8 text-left rounded-2xl border bg-card p-5">
              <div className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <Plane className="h-3.5 w-3.5" /> {comp.destination}
              </div>
              <div className="text-xl font-extrabold mt-1">{comp.title}</div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Draw: {formatDate(comp.draw_date)}
              </div>

              <div className="mt-5">
                <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                  Your {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tickets.map((t: { ticket_number: number }) => (
                    <span
                      key={t.ticket_number}
                      className="rounded-md bg-gradient-tropical px-2.5 py-1 text-xs font-bold text-primary-foreground tabular-nums"
                    >
                      #{String(t.ticket_number).padStart(4, "0")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isLoading && !comp && <div className="mt-8 h-32 bg-muted rounded animate-pulse" />}

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button asChild className="bg-gradient-sunset border-0 font-bold">
              <Link to="/account">View all my tickets</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/competitions">Enter another</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
