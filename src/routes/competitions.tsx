import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCompetitions } from "@/lib/competitions.functions";
import { CompetitionCard } from "@/components/competition-card";

export const Route = createFileRoute("/competitions")({
  head: () => ({
    meta: [
      { title: "All Live Competitions — JETEQUE" },
      { name: "description", content: "Every live holiday competition on JETEQUE. Tickets from £5. Live draws to dream destinations." },
      { property: "og:title", content: "All Live Competitions — JETEQUE" },
      { property: "og:description", content: "Live holiday prize draws. Tickets from £5." },
    ],
  }),
  component: CompetitionsPage,
});

function CompetitionsPage() {
  const fn = useServerFn(getCompetitions);
  const { data = [], isLoading } = useQuery({ queryKey: ["competitions"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider">Live now</span>
        <h1 className="mt-4 text-4xl md:text-6xl font-extrabold">Pick your dream destination</h1>
        <p className="mt-3 text-muted-foreground">Tickets from £5. Limited entries. Real winners every draw.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-muted rounded-2xl animate-pulse" />
            ))
          : data.map((c) => <CompetitionCard key={c.id} c={c} />)}
      </div>
      {!isLoading && data.length === 0 && (
        <p className="text-center text-muted-foreground mt-16">No live competitions right now — check back soon!</p>
      )}
    </div>
  );
}
