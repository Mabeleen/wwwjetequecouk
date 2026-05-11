import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyTickets } from "@/lib/tickets.functions";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Plane } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — JETEQUE" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const fn = useServerFn(getMyTickets);
  const { data, isLoading } = useQuery({ queryKey: ["my-tickets"], queryFn: () => fn() });

  // group by competition
  const tickets = Array.isArray(data) ? data : [];
  const grouped = new Map<string, { comp: any; numbers: number[] }>();
  for (const t of tickets) {
    const c = (t as any).competitions;
    if (!c) continue;
    const key = c.slug;
    if (!grouped.has(key)) grouped.set(key, { comp: c, numbers: [] });
    grouped.get(key)!.numbers.push(t.ticket_number);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-12 md:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold">Hey {user?.email?.split("@")[0]} 👋</h1>
          <p className="text-muted-foreground mt-2">Here are all your live entries.</p>
        </div>
        <Button asChild className="bg-gradient-sunset border-0 font-bold">
          <Link to="/competitions">Enter another</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-10 grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : grouped.size === 0 ? (
        <Card className="mt-12 p-12 text-center shadow-soft">
          <Ticket className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-xl font-extrabold">No tickets yet</h3>
          <p className="mt-2 text-muted-foreground">Pick your first prize and grab a ticket.</p>
          <Button asChild className="mt-6 bg-gradient-sunset border-0 font-bold">
            <Link to="/competitions">Browse competitions</Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-10 grid gap-5">
          {Array.from(grouped.values()).map(({ comp, numbers }) => (
            <Card key={comp.slug} className="overflow-hidden p-0 shadow-soft">
              <div className="grid md:grid-cols-[200px_1fr]">
                <div className="aspect-video md:aspect-auto">
                  <img src={comp.hero_image} alt={comp.destination} className="h-full w-full object-cover" />
                </div>
                <div className="p-6">
                  <div className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    <Plane className="h-3.5 w-3.5" /> {comp.destination}
                  </div>
                  <h3 className="text-xl font-extrabold mt-1">{comp.title}</h3>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Draw: {formatDate(comp.draw_date)}
                  </div>
                  <div className="mt-4">
                    <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                      Your {numbers.length} ticket{numbers.length > 1 ? "s" : ""}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {numbers.sort((a,b)=>a-b).map((n) => (
                        <span key={n} className="rounded-md bg-gradient-tropical px-2.5 py-1 text-xs font-bold text-primary-foreground tabular-nums">
                          #{String(n).padStart(4, "0")}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="mt-4 -ml-3">
                    <Link to="/competitions/$slug" params={{ slug: comp.slug }}>View competition →</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
