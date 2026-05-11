import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getAdminStatus,
  adminListCompetitions,
  adminUpsertCompetition,
  adminDeleteCompetition,
  adminListTickets,
  adminListWinners,
  adminAddWinner,
  adminDeleteWinner,
} from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trophy, Ticket, Plane, Plus, Trash2, Pencil, ShieldAlert } from "lucide-react";
import { formatDate, formatGBP } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — JETEQUE" }] }),
  component: AdminPage,
});

function AdminPage() {
  const fn = useServerFn(getAdminStatus);
  const { data, isLoading } = useQuery({ queryKey: ["admin-status"], queryFn: () => fn() });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl p-12"><div className="h-12 bg-muted rounded animate-pulse" /></div>;
  }

  if (!data?.isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <Card className="p-10 text-center shadow-soft">
          <ShieldAlert className="h-12 w-12 mx-auto text-primary" />
          <h1 className="mt-4 text-2xl font-extrabold">Admin access required</h1>
          <p className="mt-3 text-muted-foreground">
            Your account isn't an admin. To grant yourself admin access, open the
            backend (Cloud → Database → Tables → <code className="px-1 bg-muted rounded">user_roles</code>)
            and add a row with your user id and role <code className="px-1 bg-muted rounded">admin</code>.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Your user id: <code>{data?.userId}</code></p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Admin dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage competitions, ticket sales and winners.</p>
      </div>

      <Tabs defaultValue="competitions" className="mt-8">
        <TabsList>
          <TabsTrigger value="competitions"><Plane className="h-4 w-4 mr-2" />Competitions</TabsTrigger>
          <TabsTrigger value="tickets"><Ticket className="h-4 w-4 mr-2" />Ticket sales</TabsTrigger>
          <TabsTrigger value="winners"><Trophy className="h-4 w-4 mr-2" />Winners</TabsTrigger>
        </TabsList>

        <TabsContent value="competitions" className="mt-6"><CompetitionsTab /></TabsContent>
        <TabsContent value="tickets" className="mt-6"><TicketsTab /></TabsContent>
        <TabsContent value="winners" className="mt-6"><WinnersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Competitions ---------------- */

const emptyComp = {
  id: undefined as string | undefined,
  slug: "",
  title: "",
  destination: "",
  tagline: "",
  description: "",
  hero_image: "",
  total_tickets: 1000,
  ticket_price_pence: 500,
  draw_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: "live" as "live" | "draft" | "closed",
  featured: false,
};

function CompetitionsTab() {
  const list = useServerFn(adminListCompetitions);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-comps"], queryFn: () => list() });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = data.filter((c: any) => statusFilter === "all" || c.status === statusFilter);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyComp);

  const upsert = useServerFn(adminUpsertCompetition);
  const del = useServerFn(adminDeleteCompetition);

  const saveMut = useMutation({
    mutationFn: (payload: any) => upsert({ data: payload }),
    onSuccess: () => {
      toast.success("Competition saved");
      qc.invalidateQueries({ queryKey: ["admin-comps"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-comps"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(emptyComp)} className="bg-gradient-sunset border-0 font-bold">
              <Plus className="h-4 w-4 mr-2" />New competition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit" : "New"} competition</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
              <Field label="Destination"><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
              <Field label="Tagline"><Input value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
              <Field label="Hero image URL" className="md:col-span-2"><Input value={form.hero_image} onChange={(e) => setForm({ ...form, hero_image: e.target.value })} /></Field>
              <Field label="Description" className="md:col-span-2"><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label="Total tickets"><Input type="number" value={form.total_tickets} onChange={(e) => setForm({ ...form, total_tickets: Number(e.target.value) })} /></Field>
              <Field label="Ticket price (pence)"><Input type="number" value={form.ticket_price_pence} onChange={(e) => setForm({ ...form, ticket_price_pence: Number(e.target.value) })} /></Field>
              <Field label="Draw date"><Input type="date" value={form.draw_date.slice(0, 10)} onChange={(e) => setForm({ ...form, draw_date: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Featured">
                <Select value={form.featured ? "yes" : "no"} onValueChange={(v) => setForm({ ...form, featured: v === "yes" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  saveMut.mutate({
                    ...form,
                    tagline: form.tagline || null,
                    draw_date: new Date(form.draw_date).toISOString(),
                  })
                }
                disabled={saveMut.isPending}
                className="bg-gradient-sunset border-0 font-bold"
              >
                {saveMut.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-5 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
              <tr>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Destination</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Sold</th>
                <th className="text-right p-3">Price</th>
                <th className="text-left p-3">Draw</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No competitions</td></tr>}
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-semibold">{c.title}</td>
                  <td className="p-3">{c.destination}</td>
                  <td className="p-3">
                    <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${c.status === "live" ? "bg-secondary/20 text-secondary-foreground" : "bg-muted"}`}>{c.status}</span>
                  </td>
                  <td className="p-3 text-right tabular-nums">{c.sold} / {c.total_tickets}</td>
                  <td className="p-3 text-right tabular-nums">{formatGBP(c.ticket_price_pence)}</td>
                  <td className="p-3">{formatDate(c.draw_date)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setForm({
                        id: c.id, slug: c.slug, title: c.title, destination: c.destination,
                        tagline: c.tagline ?? "", description: c.description, hero_image: c.hero_image,
                        total_tickets: c.total_tickets, ticket_price_pence: c.ticket_price_pence,
                        draw_date: c.draw_date, status: c.status, featured: c.featured,
                      }); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Delete ${c.title}?`)) delMut.mutate(c.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Tickets ---------------- */

function TicketsTab() {
  const compsFn = useServerFn(adminListCompetitions);
  const ticketsFn = useServerFn(adminListTickets);
  const { data: comps = [] } = useQuery({ queryKey: ["admin-comps"], queryFn: () => compsFn() });

  const [competitionId, setCompetitionId] = useState<string>("all");
  const [paidOnly, setPaidOnly] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-tickets", competitionId, paidOnly],
    queryFn: () => ticketsFn({ data: { competitionId: competitionId === "all" ? undefined : competitionId, paidOnly } }),
  });

  const totalRevenue = (data as any[]).reduce((sum, t) => {
    const c = comps.find((x: any) => x.id === t.competition_id);
    return sum + (t.paid && c ? c.ticket_price_pence : 0);
  }, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">Competition</Label>
          <Select value={competitionId} onValueChange={setCompetitionId}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All competitions</SelectItem>
              {comps.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Filter</Label>
          <Select value={paidOnly ? "paid" : "all"} onValueChange={(v) => setPaidOnly(v === "paid")}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tickets</SelectItem>
              <SelectItem value="paid">Paid only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto rounded-xl bg-gradient-tropical text-primary-foreground px-5 py-3 shadow-glow">
          <div className="text-xs font-bold uppercase opacity-80">Revenue (filtered)</div>
          <div className="text-2xl font-extrabold tabular-nums">{formatGBP(totalRevenue)}</div>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
              <tr>
                <th className="text-left p-3">When</th>
                <th className="text-left p-3">Competition</th>
                <th className="text-right p-3">Ticket #</th>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Paid</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && data.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No tickets</td></tr>}
              {(data as any[]).map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3 text-muted-foreground">{formatDate(t.created_at)}</td>
                  <td className="p-3 font-semibold">{t.competitions?.title ?? "—"}</td>
                  <td className="p-3 text-right tabular-nums">#{String(t.ticket_number).padStart(4, "0")}</td>
                  <td className="p-3 font-mono text-xs">{t.user_id.slice(0, 8)}…</td>
                  <td className="p-3">{t.paid ? <span className="text-secondary-foreground bg-secondary/20 rounded-full px-2 py-0.5 text-xs font-bold">Paid</span> : <span className="text-muted-foreground">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Winners ---------------- */

function WinnersTab() {
  const qc = useQueryClient();
  const compsFn = useServerFn(adminListCompetitions);
  const listFn = useServerFn(adminListWinners);
  const addFn = useServerFn(adminAddWinner);
  const delFn = useServerFn(adminDeleteWinner);

  const { data: comps = [] } = useQuery({ queryKey: ["admin-comps"], queryFn: () => compsFn() });
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-winners"], queryFn: () => listFn() });

  const [competitionFilter, setCompetitionFilter] = useState("all");
  const filtered = (data as any[]).filter((w) => competitionFilter === "all" || w.competition_id === competitionFilter);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    competition_id: "",
    winner_name: "",
    winner_location: "",
    ticket_number: "" as string | number,
    story: "",
    photo_url: "",
  });

  const addMut = useMutation({
    mutationFn: (payload: any) => addFn({ data: payload }),
    onSuccess: () => {
      toast.success("Winner added");
      qc.invalidateQueries({ queryKey: ["admin-winners"] });
      setOpen(false);
      setForm({ competition_id: "", winner_name: "", winner_location: "", ticket_number: "", story: "", photo_url: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["admin-winners"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <Label className="text-xs">Competition</Label>
          <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All competitions</SelectItem>
              {comps.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-sunset border-0 font-bold"><Plus className="h-4 w-4 mr-2" />Announce winner</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Announce winner</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <Field label="Competition">
                <Select value={form.competition_id} onValueChange={(v) => setForm({ ...form, competition_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {comps.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Winner name"><Input value={form.winner_name} onChange={(e) => setForm({ ...form, winner_name: e.target.value })} /></Field>
              <Field label="Location"><Input value={form.winner_location} onChange={(e) => setForm({ ...form, winner_location: e.target.value })} /></Field>
              <Field label="Ticket number"><Input type="number" value={form.ticket_number} onChange={(e) => setForm({ ...form, ticket_number: e.target.value })} /></Field>
              <Field label="Photo URL"><Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} /></Field>
              <Field label="Story"><Textarea rows={3} value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} /></Field>
            </div>
            <DialogFooter>
              <Button
                disabled={addMut.isPending || !form.competition_id || !form.winner_name || !form.ticket_number}
                onClick={() =>
                  addMut.mutate({
                    competition_id: form.competition_id,
                    winner_name: form.winner_name,
                    winner_location: form.winner_location || null,
                    ticket_number: Number(form.ticket_number),
                    story: form.story || null,
                    photo_url: form.photo_url || null,
                  })
                }
                className="bg-gradient-sunset border-0 font-bold"
              >
                {addMut.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-5 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
              <tr>
                <th className="text-left p-3">Announced</th>
                <th className="text-left p-3">Competition</th>
                <th className="text-left p-3">Winner</th>
                <th className="text-left p-3">Location</th>
                <th className="text-right p-3">Ticket</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No winners yet</td></tr>}
              {filtered.map((w: any) => (
                <tr key={w.id} className="border-t">
                  <td className="p-3 text-muted-foreground">{formatDate(w.announced_at)}</td>
                  <td className="p-3 font-semibold">{w.competitions?.title ?? "—"}</td>
                  <td className="p-3">{w.winner_name}</td>
                  <td className="p-3">{w.winner_location ?? "—"}</td>
                  <td className="p-3 text-right tabular-nums">{w.ticket_number ? `#${String(w.ticket_number).padStart(4, "0")}` : "—"}</td>
                  <td className="p-3">
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remove ${w.winner_name}?`)) delMut.mutate(w.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs font-bold uppercase text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
