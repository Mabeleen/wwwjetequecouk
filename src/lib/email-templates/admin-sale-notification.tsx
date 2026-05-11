import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  buyerEmail?: string;
  buyerName?: string;
  competitionTitle?: string;
  quantity?: number;
  totalGbp?: string;
  ticketNumbers?: number[];
  sessionId?: string;
}

const AdminSaleNotificationEmail = ({
  buyerEmail = "—",
  buyerName,
  competitionTitle = "—",
  quantity = 0,
  totalGbp = "£0.00",
  ticketNumbers = [],
  sessionId = "—",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New ticket sale: {quantity} × {competitionTitle} ({totalGbp})</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>💰 New ticket sale</Heading>
        <Text style={text}><strong>Competition:</strong> {competitionTitle}</Text>
        <Text style={text}><strong>Quantity:</strong> {String(quantity)}</Text>
        <Text style={text}><strong>Total:</strong> {totalGbp}</Text>
        <Text style={text}>
          <strong>Buyer:</strong> {buyerName ? `${buyerName} ` : ""}&lt;{buyerEmail}&gt;
        </Text>
        <Text style={text}>
          <strong>Tickets:</strong> {ticketNumbers.length ? ticketNumbers.map((n) => `#${n}`).join(", ") : "—"}
        </Text>
        <Hr style={hr} />
        <Text style={mono}>Stripe session: {sessionId}</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: AdminSaleNotificationEmail,
  subject: (d: any) =>
    `💰 Sale: ${d?.quantity ?? 0} × ${d?.competitionTitle ?? "ticket"} (${d?.totalGbp ?? ""})`,
  displayName: "Admin sale notification",
  to: "win@jeteque.com",
  previewData: {
    buyerEmail: "alex@example.com",
    buyerName: "Alex",
    competitionTitle: "Bali Beach Escape",
    quantity: 3,
    totalGbp: "£15.00",
    ticketNumbers: [42, 108, 271],
    sessionId: "cs_test_abc123",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "28px 24px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: "bold" as const, color: "#0f172a", margin: "0 0 16px" };
const text = { fontSize: "14px", color: "#334155", lineHeight: "1.6", margin: "0 0 8px" };
const mono = { fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" };
const hr = { borderColor: "#e2e8f0", margin: "20px 0 12px" };
