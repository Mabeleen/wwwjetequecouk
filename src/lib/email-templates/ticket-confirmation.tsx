import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "JETEQUE";

interface Props {
  buyerName?: string;
  competitionTitle?: string;
  destination?: string;
  drawDate?: string;
  ticketNumbers?: number[];
}

const TicketConfirmationEmail = ({
  buyerName,
  competitionTitle = "your competition",
  destination = "",
  drawDate = "",
  ticketNumbers = [],
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your tickets for {competitionTitle} — GOOD LUCK!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>GOOD LUCK{buyerName ? `, ${buyerName}` : ""}! 🍀</Heading>
        <Text style={text}>
          You're officially in the draw for <strong>{competitionTitle}</strong>
          {destination ? ` — a holiday to ${destination}` : ""}.
        </Text>

        <Section style={ticketBox}>
          <Text style={ticketLabel}>Your ticket number{ticketNumbers.length > 1 ? "s" : ""}</Text>
          <Text style={ticketNumbersStyle}>
            {ticketNumbers.length > 0 ? ticketNumbers.map((n) => `#${n}`).join("  ·  ") : "—"}
          </Text>
        </Section>

        {drawDate && (
          <Text style={text}>
            🎲 Live draw: <strong>{drawDate}</strong>
          </Text>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          Keep an eye on your inbox — we'll email you the moment the winner is drawn.
          <br />— The {SITE_NAME} team
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: TicketConfirmationEmail,
  subject: (d: any) =>
    `🎟️ You're in! ${d?.ticketNumbers?.length ?? 0} ticket${(d?.ticketNumbers?.length ?? 0) > 1 ? "s" : ""} for ${d?.competitionTitle ?? "your competition"} — GOOD LUCK`,
  displayName: "Ticket purchase confirmation",
  previewData: {
    buyerName: "Alex",
    competitionTitle: "Bali Beach Escape",
    destination: "Bali, Indonesia",
    drawDate: "31 December 2026",
    ticketNumbers: [42, 108, 271],
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px" };
const h1 = { fontSize: "28px", fontWeight: "bold" as const, color: "#0f172a", margin: "0 0 16px" };
const text = { fontSize: "15px", color: "#334155", lineHeight: "1.6", margin: "0 0 16px" };
const ticketBox = { backgroundColor: "#fff7ed", borderRadius: "12px", padding: "20px", textAlign: "center" as const, margin: "20px 0" };
const ticketLabel = { fontSize: "12px", color: "#9a3412", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: "bold" as const, margin: "0 0 8px" };
const ticketNumbersStyle = { fontSize: "22px", color: "#0f172a", fontWeight: "bold" as const, margin: 0 };
const hr = { borderColor: "#e2e8f0", margin: "28px 0 16px" };
const footer = { fontSize: "13px", color: "#64748b", margin: 0 };
