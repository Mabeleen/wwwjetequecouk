import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Palmtree, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/competitions", label: "Competitions" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/winners", label: "Winners" },
  { to: "/faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-tropical text-primary-foreground shadow-glow transition-transform group-hover:scale-105">
            <Palmtree className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">JETEQUE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{ className: "text-primary" }}
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/account">My tickets</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin">Admin</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="bg-gradient-sunset border-0 shadow-glow">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="flex flex-col p-4 gap-1">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-semibold hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            <div className="pt-2 border-t mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Button asChild variant="outline">
                    <Link to="/account" onClick={() => setOpen(false)}>My tickets</Link>
                  </Button>
                  <Button onClick={() => { setOpen(false); signOut(); }}>Sign out</Button>
                </>
              ) : (
                <Button asChild className="bg-gradient-sunset border-0">
                  <Link to="/auth" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
