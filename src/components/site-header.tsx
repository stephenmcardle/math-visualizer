import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { GITHUB_URL, SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link
          href="/"
          className="rounded-sm font-semibold tracking-tight whitespace-nowrap focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {SITE_NAME}
        </Link>
        <nav aria-label="Main" className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="hidden rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:inline-block"
          >
            Visualizations
          </Link>
          <Link
            href="/about"
            className="rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            About
          </Link>
          <a
            href={GITHUB_URL}
            className="rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
