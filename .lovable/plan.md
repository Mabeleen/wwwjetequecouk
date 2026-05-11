## JETEQUE — Holiday Competition Site

A bright, tropical, multi-page competition platform where users buy £5 tickets for a chance to win dream holidays. Built on Lovable Cloud with Stripe payments for real ticket sales.

### Pages (separate routes for SEO + sharing)

- `/` — Home: hero ("Win your dream holiday for £5"), featured Thailand competition card with live ticket counter, grid of other live competitions, how it works, recent winners, FAQ teaser.
- `/competitions` — All live + upcoming competitions in a grid.
- `/competitions/$slug` — Detail page (Thailand as flagship): image gallery, prize details (flights, 5-star hotel, dates, what's included), draw date countdown, ticket selector (1/5/10/25/custom up to remaining), live "X / 1000 sold" progress bar, buy button.
- `/how-it-works` — 3-step explainer + draw mechanics + free postal entry route (UK competition law requirement).
- `/winners` — Past winners with photos and prize info.
- `/faq` — Common questions.
- `/terms` — Terms & conditions (placeholder, editable).
- `/auth` — Sign in / sign up (email + Google).
- `/account` — User's purchased tickets and entries (auth-gated).
- `/account/checkout/success` and `/cancelled` — Stripe redirect targets.

### Design system (bright tropical)

Defined in `src/styles.css` as oklch tokens:
- Sunset coral primary, turquoise secondary, sandy cream background, deep palm green accent, gold highlight for "WIN" moments.
- Gradients: sunset (coral → gold), ocean (turquoise → deep blue) for hero overlays and CTAs.
- Rounded cards, soft shadows, subtle palm-leaf SVG motifs, big bold display headings, animated ticket counter.

### Backend (Lovable Cloud + Stripe)

Tables:
- `competitions` (id, slug, title, destination, hero_image, gallery jsonb, description, prize_includes jsonb, ticket_price_pence, total_tickets, draw_date, status, created_at)
- `tickets` (id, competition_id, user_id, ticket_number, stripe_session_id, paid bool, created_at) — unique (competition_id, ticket_number)
- `winners` (id, competition_id, ticket_id, user_id, announced_at, photo_url, story)
- `profiles` (id, full_name, phone, address) — auto-created on signup

RLS: anyone can read competitions/winners; users read only their own tickets/profile; inserts via server functions only.

Server functions (`createServerFn`):
- `getCompetitions`, `getCompetitionBySlug` — public, include sold count.
- `createCheckoutSession` — auth required; reserves N random unsold ticket numbers, creates Stripe Checkout session, returns URL.
- `getMyTickets` — auth required.

Server route:
- `/api/public/stripe-webhook` — verifies signature, marks tickets paid on `checkout.session.completed`.

### Auth

Email/password + Google. Profiles table with trigger. `_authenticated` layout for `/account`.

### Implementation order

1. Enable Lovable Cloud.
2. Run payment provider eligibility check, then enable Stripe Payments.
3. Build design tokens + shared layout (header with nav + auth state, footer).
4. Create database schema + seed Thailand + 3 sample competitions (Maldives, Bali, Santorini).
5. Build public pages (home, competitions list, detail, how-it-works, winners, faq).
6. Auth pages + account area.
7. Ticket selector + Stripe checkout flow + webhook.
8. SEO: per-route `head()` with unique title/description/og tags; og:image from competition hero.

### Notes / things to confirm later

- Ticket assignment: random unsold numbers reserved at checkout, released if payment fails (15 min hold).
- Free entry route is mentioned in /how-it-works (legal requirement) but no postal-handling backend in v1.
- Draw mechanism (admin-triggered random selection) can be added in a follow-up — v1 focuses on selling tickets.
- Stripe live mode requires account claim after launch; test mode works immediately.
