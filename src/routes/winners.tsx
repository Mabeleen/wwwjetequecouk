import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWinners } from "@/lib/competitions.functions";
import { Card } from "@/components/ui/card";
import { Trophy, Quote } from "lucide-react";

export const Route = createFileRoute("/winners")({
  head: () => ({
    meta: [
      { title: "Winners — Real People, Real Holidays | JETEQUE" },
      { name: "description", content: "Meet the JETEQUE winners. Real people who entered our holiday draws and packed their bags." },
      { property: "og:title", content: "JETEQUE Winners" },
      { property: "og:description", content: "Real people, real holidays. Meet our recent winners." },
    ],
  }),
  component: WinnersPage,
});

function WinnersPage() {
  const fn = useServerFn(getWinners);
  const { data = [] } = useQuery({ queryKey: ["winners"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto">
        <Trophy className="h-10 w-10 text-gold mx-auto" />
        <h1 className="mt-4 text-4xl md:text-6xl font-extrabold">Our winners</h1>
        <p className="mt-3 text-muted-foreground text-lg">Real people. Real holidays. Real moments.</p>
      </div>

      {data.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">First draws coming soon — be one of the first winners!</p>
          <Link to="/competitions" className="mt-4 inline-block text-primary font-bold">Enter a competition →</Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {data.map((w) => {
            const comp = (w as any).competitions;
            return (
              <Card key={w.id} className="p-6 shadow-soft border-border/60 overflow-hidden">
                <div className="flex gap-4">
                  {w.photo_url && (
                    <img src={w.photo_url} alt={w.winner_name} className="h-20 w-20 rounded-2xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-gold" />
                      <h3 className="font-extrabold text-lg">{w.winner_name}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground">{w.winner_location} · Ticket #{w.ticket_number}</div>
                    {comp && (
                      <Link to="/competitions/$slug" params={{ slug: comp.slug }} className="mt-1 inline-block text-sm font-bold text-primary hover:underline">
                        Won: {comp.title}
                      </Link>
                    )}
                  </div>
                </div>
                {w.story && (
                  <div className="mt-4 rounded-xl bg-muted/60 p-4">
                    <Quote className="h-4 w-4 text-primary mb-1" />
                    <p className="italic text-sm">{w.story}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
