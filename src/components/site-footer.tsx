import { Link } from "@tanstack/react-router";
import { Palmtree } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-tropical text-primary-foreground">
              <Palmtree className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">JETEQUE</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Win unforgettable holidays for as little as £5. Real prizes. Real winners. Live draws.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold mb-3">Site</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/competitions" className="hover:text-foreground">Competitions</Link></li>
            <li><Link to="/winners" className="hover:text-foreground">Winners</Link></li>
            <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><span className="cursor-default">Terms & Conditions</span></li>
            <li><span className="cursor-default">Privacy</span></li>
            <li><span className="cursor-default">Free entry route</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} JETEQUE. All competitions promoted responsibly. 18+.
      </div>
    </footer>
  );
}
