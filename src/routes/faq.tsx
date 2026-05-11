import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — JETEQUE Holiday Competitions" },
      { name: "description", content: "Everything you need to know about JETEQUE holiday competitions: draws, tickets, prizes, and the free entry route." },
      { property: "og:title", content: "JETEQUE FAQ" },
      { property: "og:description", content: "Common questions about our holiday prize draws answered." },
    ],
  }),
  component: FaqPage,
});

const faqs = [
  { q: "How do the draws work?", a: "Each competition has a fixed number of tickets and a draw date. On the date, we use a verified random selection on a livestream to pick the winning ticket number." },
  { q: "How many tickets can I buy?", a: "You can buy up to 50 tickets per competition. The more you buy, the better your odds." },
  { q: "What if a competition doesn't sell out?", a: "The draw still happens on the announced date — we never cancel a draw. Lower ticket numbers mean better odds for early entrants." },
  { q: "When and how do I get paid / booked?", a: "Winners are contacted within 24 hours of the draw. We book all flights, hotels, transfers, and any extras listed in the prize. You pick travel dates that work for you." },
  { q: "Is there a free entry route?", a: "Yes. UK law requires it. Send a postcard with your name, address, and the competition you want to enter to our address. One free entry per person per competition." },
  { q: "Who can enter?", a: "Anyone aged 18+ in the UK. Some competitions may have additional eligibility — always check the competition page." },
  { q: "Are the draws really random?", a: "Yes — every draw is conducted live using a verifiable random number generator and recorded for transparency." },
  { q: "How do I see the tickets I've bought?", a: "Sign in and visit your account page — every ticket and number you've purchased is listed there." },
];

function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 md:py-24">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold">Frequently asked questions</h1>
        <p className="mt-3 text-muted-foreground">Quick answers about how JETEQUE works.</p>
      </div>
      <Accordion type="single" collapsible className="mt-12 space-y-2">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="rounded-2xl border border-border/60 bg-card px-5 shadow-soft">
            <AccordionTrigger className="text-left text-base font-bold py-5 hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-5">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
