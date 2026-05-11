import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCompetitions, getWinners } from "@/lib/competitions.functions";
import { CompetitionCard } from "@/components/competition-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatGBP, daysUntil } from "@/lib/format";
import { Ticket, Trophy, Sparkles, ShieldCheck, ArrowRight, Plane } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JETEQUE — Win Your Dream Holiday for £5" },
      { name: "description", content: "Live holiday prize draws. Win trips to Thailand, the Maldives, Bali and Santorini from just £5 per ticket." },
      { property: "og:title", content: "JETEQUE — Win Your Dream Holiday for £5" },
      { property: "og:description", content: "Live holiday prize draws. Tickets from £5." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const compsFn = useServerFn(getCompetitions);
  const winsFn = useServerFn(getWinners);
  const { data: comps = [] } = useQuery({ queryKey: ["competitions"], queryFn: () => compsFn() });
  const { data: winners = [] } = useQuery({ queryKey: ["winners-home"], queryFn: () => winsFn() });

  const featured = comps.find((c) => c.featured) ?? comps[0];
  const others = comps.filter((c) => c.id !== featured?.id);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-tropical opacity-95" />
        <div
          className="absolute inset-0 -z-10 opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-hero" />
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 md:py-32 text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Live now · Real winners
          </div>
          <h1 className="mt-5 text-4xl md:text-7xl font-extrabold leading-[1.05] max-w-4xl drop-shadow-md">
            Win your dream holiday for just <span className="bg-gradient-sunset bg-clip-text text-transparent">£5</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg md:text-xl text-white/90">
            Buy a ticket. Pack your bags. JETEQUE gives you real chances to win unforgettable trips around the world.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-sunset border-0 text-base h-12 px-7 shadow-glow font-bold">
              <Link to="/competitions">Browse competitions <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white/20 h-12 px-7 font-bold">
              <Link to="/how-it-works">How it works</Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl text-white">
            <Stat icon={<Ticket className="h-5 w-5" />} label="From" value="£5" />
            <Stat icon={<Trophy className="h-5 w-5" />} label="Prizes given" value="£40k+" />
            <Stat icon={<Plane className="h-5 w-5" />} label="Destinations" value="20+" />
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured && (
        <section className="mx-auto max-w-7xl px-4 md:px-6 -mt-10 md:-mt-16 relative z-10">
          <Card className="overflow-hidden border-0 shadow-glow p-0">
            <div className="grid md:grid-cols-2">
              <div className="relative aspect-[4/3] md:aspect-auto">
                <img src={featured.hero_image} alt={featured.destination} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute top-4 left-4 rounded-full bg-gradient-sunset px-4 py-1.5 text-xs font-extrabold text-primary-foreground uppercase tracking-wider shadow-glow">
                  Featured draw
                </div>
              </div>
              <div className="p-6 md:p-10 flex flex-col justify-center">
                <div className="text-sm font-bold text-primary uppercase tracking-wider">{featured.destination}</div>
                <h2 className="mt-2 text-3xl md:text-4xl font-extrabold">{featured.title}</h2>
                <p className="mt-3 text-muted-foreground">{featured.tagline}</p>
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{featured.sold} / {featured.total_tickets} tickets sold</span>
                    <span className="text-primary">{daysUntil(featured.draw_date)} days left</span>
                  </div>
                  <Progress value={(featured.sold / featured.total_tickets) * 100} className="h-3" />
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="text-3xl font-extrabold">{formatGBP(featured.ticket_price_pence)}<span className="text-sm font-medium text-muted-foreground">/ticket</span></div>
                  <Button asChild size="lg" className="bg-gradient-sunset border-0 ml-auto h-12 font-bold shadow-glow">
                    <Link to="/competitions/$slug" params={{ slug: featured.slug }}>Enter now <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* OTHER COMPETITIONS */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 mt-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold">More live competitions</h2>
            <p className="text-muted-foreground mt-1">Pick a destination, grab a ticket, dream big.</p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/competitions">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {others.map((c) => <CompetitionCard key={c.id} c={c} />)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 mt-24">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center">How JETEQUE works</h2>
        <p className="text-center text-muted-foreground mt-2">Three steps between you and your next adventure.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: <Ticket className="h-6 w-6" />, title: "Pick your prize", body: "Choose a holiday competition you love." },
            { icon: <ShieldCheck className="h-6 w-6" />, title: "Buy your tickets", body: "Tickets from £5. Buy as many as you like to boost your chances." },
            { icon: <Trophy className="h-6 w-6" />, title: "Win + travel", body: "Live draw on the announced date. Winners booked in within days." },
          ].map((s, i) => (
            <Card key={i} className="p-6 text-center border-border/60 shadow-soft">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-tropical text-primary-foreground">
                {s.icon}
              </div>
              <h3 className="mt-4 text-xl font-extrabold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* WINNERS */}
      {winners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-6 mt-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold">Recent winners</h2>
              <p className="text-muted-foreground mt-1">Real people. Real holidays.</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link to="/winners">All winners <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {winners.slice(0, 2).map((w) => (
              <Card key={w.id} className="p-6 flex items-start gap-4 shadow-soft">
                {w.photo_url && <img src={w.photo_url} alt={w.winner_name} className="h-16 w-16 rounded-full object-cover" />}
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-gold" />
                    <h3 className="font-extrabold">{w.winner_name}</h3>
                    <span className="text-xs text-muted-foreground">{w.winner_location}</span>
                  </div>
                  <div className="text-sm font-semibold text-primary mt-0.5">Won: {(w as any).competitions?.title}</div>
                  {w.story && <p className="text-sm text-muted-foreground mt-2 italic">"{w.story}"</p>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 mt-24">
        <Card className="overflow-hidden border-0 p-0 shadow-glow">
          <div className="bg-gradient-tropical p-10 md:p-16 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-5xl font-extrabold">Your next holiday is one ticket away.</h2>
            <p className="mt-3 text-white/90 text-lg">Browse live competitions and grab your tickets in seconds.</p>
            <Button asChild size="lg" className="mt-7 bg-white text-primary hover:bg-white/90 h-12 px-7 font-extrabold">
              <Link to="/competitions">Enter a competition</Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-white/80 text-xs uppercase tracking-wider font-semibold">
        {icon} {label}
      </div>
      <div className="text-3xl md:text-4xl font-extrabold mt-1">{value}</div>
    </div>
  );
}
