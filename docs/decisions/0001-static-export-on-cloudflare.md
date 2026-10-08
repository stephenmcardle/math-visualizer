# 0001: Static export deployed as Cloudflare static assets

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

The app must deploy to Cloudflare, run mostly or entirely client-side, and have no database,
authentication or backend. All visualization pages are known at build time from the registry.
Server-side compute may be wanted someday, but not now.

## Decision

Use Next.js `output: "export"`. `next build` writes a fully static site to `out/`, which is
deployed as Cloudflare Workers static assets via `wrangler.jsonc` (no Worker script). Every
`/visualizations/[slug]` page is prerendered from `generateStaticParams` with
`dynamicParams = false`. Query-string state is read in the browser under a `<Suspense>` boundary.

## Alternatives considered

- **OpenNext Cloudflare adapter:** supports server features, but adds an adapter, a Worker
  runtime and more moving parts for no current benefit.
- **Plain Vite SPA:** simpler build, but loses per-route static HTML (SEO, no-JS explanations)
  and the prescribed Next.js stack.

## Consequences

- Hosting is cheap and simple; any static host would also work.
- Unavailable: route handlers that read the request, middleware/proxy, redirects/rewrites/headers
  in `next.config.ts`, ISR, built-in image optimization. Cache headers go in `public/_headers`.
- Generated Next.js options `cacheComponents` and `partialPrefetching` were removed because they
  do nothing for a fully static site.
- Revisit if a feature needs server compute. Moving to OpenNext should not touch visualization
  code.
