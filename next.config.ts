import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `next build` writes HTML/JS/CSS to `out/`, which is
  // deployed as Cloudflare static assets. See README "Deploying to Cloudflare".
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withMDX = createMDX({
  options: {
    // Plugins are named by string so Turbopack can pass them to its MDX loader.
    // `$…$` / `$$…$$` in explanations becomes KaTeX HTML + MathML at build time;
    // only the stylesheet and fonts reach the browser.
    remarkPlugins: ["remark-math"],
    // rehype-katex renders invalid TeX as red text instead of failing, so
    // src/visualizations/explanations.test.ts compiles every explanation and fails on it.
    rehypePlugins: ["rehype-katex"],
  },
});

export default withMDX(nextConfig);
