import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Ticket, ShieldCheck, Trophy, Mail, Plane, Sparkles } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How JETEQUE Works — Win Holidays from £5" },
      { name: "description", content: "Three simple steps to enter live holiday competitions on JETEQUE. Buy tickets, watch the live draw, win real holidays." },
      { property: "og:title", content: "How JETEQUE Works" },
      { property: "og:description", content: "Pick a holiday. Buy tickets from £5. Live draw. Real winners." },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  { icon: Ticket, title: "1. Pick your prize", body: "Browse our live holiday competitions and pick the one you'd most love to win." },
  { icon: ShieldCheck, title: "2. Buy tickets securely", body: "Tickets start at £5. Each ticket gives you a unique entry number. Buy as many as you like to boost your chances." },
  { icon: Trophy, title: "3. Win + we book it", body: "On the announced draw date we run a live, randomised draw. Winners are contacted within 24 hours and we book everything." },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3 w-3" /> Simple. Transparent. Real.
        </span>
        <h1 className="mt-4 text-4xl md:text-6xl font-extrabold">How JETEQUE works</h1>
        <p className="mt-3 text-muted-foreground text-lg">Three steps between you and your next holiday.</p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.title} className="p-7 text-center shadow-soft border-border/60">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-tropical text-primary-foreground shadow-glow">
              <s.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-extrabold">{s.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm">{s.body}</p>
          </Card>
        ))}
      </div>

      <div className="mt-20 grid md:grid-cols-2 gap-6">
        <Card className="p-7 shadow-soft">
          <Plane className="h-7 w-7 text-primary" />
          <h3 className="mt-4 text-xl font-extrabold">What we book for you</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            Flights, accommodation, transfers, and any extras listed on the competition page. We'll contact you within 24 hours of the draw to schedule your trip on dates that suit you.
          </p>
        </Card>
        <Card className="p-7 shadow-soft">
          <Mail className="h-7 w-7 text-primary" />
          <h3 className="mt-4 text-xl font-extrabold">Free entry route</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            UK law requires a free entry method on every paid competition. Send a postcard with your name, address and the competition you want to enter to our published address. One free entry per competition per person.
          </p>
        </Card>
      </div>

      <div className="mt-14 rounded-3xl bg-gradient-tropical p-10 md:p-14 text-center text-primary-foreground shadow-glow">
        <h2 className="text-3xl md:text-4xl font-extrabold">Live draws. Real winners. No catch.</h2>
        <p className="mt-2 text-white/90">Every draw is recorded and posted on our winners page.</p>
      </div>
    </div>
  );
}
