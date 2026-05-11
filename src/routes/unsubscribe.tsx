import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/unsubscribe")({
  component: UnsubscribePage,
  head: () => ({ meta: [{ title: "Unsubscribe — JETEQUE" }, { name: "robots", content: "noindex" }] }),
});

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

function UnsubscribePage() {
  const [state, setState] = useState<State>("loading");
  const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) setState("valid");
        else if (d.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (d.success) setState("done");
      else if (d.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch { setState("error"); }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-24">
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-extrabold">Unsubscribe from JETEQUE emails</h1>
        <div className="mt-6 text-muted-foreground">
          {state === "loading" && <p>Checking your link…</p>}
          {state === "valid" && (
            <>
              <p>Click below to stop receiving emails from us.</p>
              <Button onClick={confirm} className="mt-6">Confirm unsubscribe</Button>
            </>
          )}
          {state === "submitting" && <p>Unsubscribing…</p>}
          {state === "done" && <p>You've been unsubscribed. Sorry to see you go!</p>}
          {state === "already" && <p>You're already unsubscribed.</p>}
          {state === "invalid" && <p>This unsubscribe link is invalid or has expired.</p>}
          {state === "error" && <p>Something went wrong. Please try again later.</p>}
        </div>
      </Card>
    </div>
  );
}
