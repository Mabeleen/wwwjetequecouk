import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MapPin, Clock } from "lucide-react";
import { formatGBP, daysUntil } from "@/lib/format";
import type { CompetitionWithSold } from "@/lib/competitions.functions";

export function CompetitionCard({ c }: { c: CompetitionWithSold }) {
  const pct = (c.sold / c.total_tickets) * 100;
  const days = daysUntil(c.draw_date);
  return (
    <Link to="/competitions/$slug" params={{ slug: c.slug }} className="group block">
      <Card className="overflow-hidden border-border/60 shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow p-0 h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={c.hero_image}
            alt={c.destination}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-foreground">
              <MapPin className="h-3 w-3" /> {c.destination}
            </span>
          </div>
          <div className="absolute top-3 right-3 rounded-full bg-gradient-sunset px-3 py-1 text-xs font-extrabold text-primary-foreground shadow-glow">
            {formatGBP(c.ticket_price_pence)}/ticket
          </div>
        </div>
        <div className="p-5 flex flex-col gap-3 flex-1">
          <h3 className="text-lg font-extrabold leading-tight">{c.title}</h3>
          {c.tagline && <p className="text-sm text-muted-foreground">{c.tagline}</p>}
          <div className="mt-auto space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">{c.sold} / {c.total_tickets} sold</span>
              <span className="inline-flex items-center gap-1 text-primary"><Clock className="h-3 w-3" />{days}d left</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
