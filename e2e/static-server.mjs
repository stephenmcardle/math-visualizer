// Serves the static export in out/ the way Cloudflare's asset handling does
// (see wrangler.jsonc): /about -> about.html, / -> index.html, and unknown
// paths -> 404.html with status 404. Used only by the end-to-end tests.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const ROOT = resolve("out");
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function resolveAsset(pathname) {
  const path = resolve(join(ROOT, decodeURIComponent(pathname)));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) return null;
  const candidates = pathname.endsWith("/") ? [join(path, "index.html")] : [path, `${path}.html`];
  for (const candidate of candidates) if (await isFile(candidate)) return candidate;
  return null;
}

createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? "/", "http://localhost");
  const asset = await resolveAsset(pathname);
  const file = asset ?? join(ROOT, "404.html");
  response.writeHead(asset ? 200 : 404, {
    "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(response);
}).listen(PORT, () => console.log(`Serving ${ROOT} on http://localhost:${PORT}`));
