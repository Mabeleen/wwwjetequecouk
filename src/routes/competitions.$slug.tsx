import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCompetitionBySlug } from "@/lib/competitions.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TicketEmbeddedCheckout } from "@/components/ticket-embedded-checkout";
import { formatGBP, formatDate, daysUntil } from "@/lib/format";
import { MapPin, Calendar, Ticket, Check, Minus, Plus, Trophy, ArrowLeft } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/competitions/$slug")({
  loader: async ({ params }) => {
    const comp = await getCompetitionBySlug({ data: { slug: params.slug } });
    if (!comp) throw notFound();
    return comp;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — JETEQUE` },
          { name: "description", content: `${loaderData.tagline ?? loaderData.description.slice(0, 140)} Tickets from ${formatGBP(loaderData.ticket_price_pence)}.` },
          { property: "og:title", content: `${loaderData.title} — JETEQUE` },
          { property: "og:description", content: loaderData.tagline ?? loaderData.description.slice(0, 160) },
          { property: "og:image", content: loaderData.hero_image },
          { name: "twitter:image", content: loaderData.hero_image },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [],
  }),
  component: CompetitionDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Competition not found</h1>
      <Link to="/competitions" className="mt-6 inline-block text-primary font-semibold">← Back to all competitions</Link>
    </div>
  ),
});

const QUICK_PICKS = [1, 5, 10, 25];

function CompetitionDetail() {
  const slug = Route.useParams().slug;
  const initial = Route.useLoaderData();
  const fn = useServerFn(getCompetitionBySlug);
  const { data: c } = useQuery({
    queryKey: ["competition", slug],
    queryFn: () => fn({ data: { slug } }),
    initialData: initial,
  });

  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!c) return null;
  const remaining = c.total_tickets - c.sold;
  const pct = (c.sold / c.total_tickets) * 100;
  const total = c.ticket_price_pence * qty;
  const gallery = (Array.isArray(c.gallery) ? c.gallery : []) as string[];
  const images = gallery.length > 0 ? gallery : [c.hero_image];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">
      <Link to="/competitions" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> All competitions
      </Link>

      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
        {/* GALLERY */}
        <div className="lg:col-span-3">
          <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-soft">
            <img src={images[activeImg]} alt={c.destination} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square overflow-hidden rounded-xl border-2 transition ${i === activeImg ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-extrabold">About this prize</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{c.description}</p>
            <h3 className="mt-8 text-lg font-extrabold">What's included</h3>
            <ul className="mt-3 space-y-2">
              {(Array.isArray(c.prize_includes) ? c.prize_includes as string[] : []).map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-palm/15 text-palm">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* TICKET PANEL */}
        <div className="lg:col-span-2">
          <Card className="p-6 md:p-8 shadow-glow border-border/60 sticky top-24">
            <div className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {c.destination}
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold leading-tight">{c.title}</h1>
            {c.tagline && <p className="mt-2 text-muted-foreground">{c.tagline}</p>}

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>{c.sold} / {c.total_tickets} sold</span>
                <span className="text-primary">{remaining} left</span>
              </div>
              <Progress value={pct} className="h-3" />
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold">Draw: {formatDate(c.draw_date)}</span>
              <span className="text-muted-foreground">· {daysUntil(c.draw_date)} days</span>
            </div>

            <div className="mt-6 border-t pt-6">
              <div className="text-sm font-bold mb-2">How many tickets?</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_PICKS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setQty(n)}
                    disabled={n > remaining}
                    className={`rounded-full px-4 py-2 text-sm font-bold border-2 transition disabled:opacity-30 ${qty === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  min={1}
                  max={Math.min(50, remaining)}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(50, Math.min(remaining, Number(e.target.value) || 1))))}
                  className="flex-1 h-10 text-center rounded-md border border-input bg-background font-bold"
                />
                <Button variant="outline" size="icon" onClick={() => setQty((q) => Math.min(50, Math.min(remaining, q + 1)))}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Total</span>
                <span className="text-3xl font-extrabold">{formatGBP(total)}</span>
              </div>

              {user ? (
                <Button
                  size="lg"
                  className="mt-4 w-full bg-gradient-sunset border-0 h-12 font-extrabold shadow-glow"
                  disabled={remaining === 0}
                  onClick={() => setCheckoutOpen(true)}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  {remaining === 0 ? "Sold out" : `Buy ${qty} ticket${qty > 1 ? "s" : ""}`}
                </Button>
              ) : (
                <Button asChild size="lg" className="mt-4 w-full bg-gradient-sunset border-0 h-12 font-extrabold shadow-glow">
                  <Link to="/auth">Sign in to enter</Link>
                </Button>
              )}

              <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Complete your purchase</DialogTitle>
                  </DialogHeader>
                  {checkoutOpen && c && user && (
                    <TicketEmbeddedCheckout competitionId={c.id} quantity={qty} accessToken={user.access_token} />
                  )}
                </DialogContent>
              </Dialog>

              <p className="mt-3 text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Trophy className="h-3 w-3 text-gold" /> Live draw on {formatDate(c.draw_date)} · 18+ only
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
