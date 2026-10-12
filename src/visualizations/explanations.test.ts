import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { compile } from "@mdx-js/mdx";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { describe, expect, it } from "vitest";

// Same plugins as next.config.ts. rehype-katex only warns about invalid TeX
// (and renders it as red text), so turn its warnings into test failures.
const root = join(process.cwd(), "src/visualizations");
const slugs = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe("explanations", () => {
  it.each(slugs)("%s compiles with valid math", async (slug) => {
    const source = await readFile(join(root, slug, "explanation.mdx"), "utf8");
    const file = await compile(source, {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    });
    expect(file.messages.map(String)).toEqual([]);
  });
});
