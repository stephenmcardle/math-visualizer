import { readFile } from "node:fs/promises";

import { expect, test as base, type Page } from "@playwright/test";

import { visualizations } from "@/visualizations/registry";

/** Fails any test whose page logs an error or throws. */
const test = base.extend<{ noPageErrors: void }>({
  noPageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

/** Saves the current frame through the UI and returns the share of non-background pixels. */
async function saveFrame(page: Page): Promise<{ width: number; drawn: number; opaque: boolean }> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Save image" }).click(),
  ]);
  const png = await readFile(await download.path());
  return page.evaluate(
    async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let drawn = 0;
      let opaque = true;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 255) opaque = false;
        const distance =
          Math.abs(data[i] - data[0]) +
          Math.abs(data[i + 1] - data[1]) +
          Math.abs(data[i + 2] - data[2]);
        if (distance > 30) drawn++;
      }
      return { width: image.width, drawn: drawn / (data.length / 4), opaque };
    },
    `data:image/png;base64,${png.toString("base64")}`,
  );
}

test("the home page links to every visualization", async ({ page }) => {
  await page.goto("/");
  for (const definition of visualizations.list()) {
    const link = page.locator(`a[href="/visualizations/${definition.metadata.slug}"]`).first();
    await expect(link).toContainText(definition.metadata.title);
  }
});

for (const definition of visualizations.list()) {
  const { slug, title } = definition.metadata;

  test(`${slug}: renders, writes its URL and saves a frame`, async ({ page }) => {
    const workers: string[] = [];
    page.on("worker", (worker) => workers.push(worker.url()));

    await page.goto(`/visualizations/${slug}?seed=7`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    // Missing params are filled in with defaults, so the URL describes the whole run.
    await expect
      .poll(() => [...new URL(page.url()).searchParams.keys()].sort())
      .toEqual([...Object.keys(definition.params), "seed"].sort());
    expect(new URL(page.url()).searchParams.get("seed")).toBe("7");

    await expect(page.locator("canvas")).toBeVisible();
    await page.waitForTimeout(1500);
    const frame = await saveFrame(page);
    expect(frame.width).toBeGreaterThan(0);
    expect(frame.opaque).toBe(true);
    expect(frame.drawn).toBeGreaterThan(0.001);
    expect(workers.length).toBe(definition.execution === "worker" ? 1 : 0);
  });
}

test("animation runs without touching the DOM", async ({ page }) => {
  await page.goto("/visualizations/random-walk?seed=7");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(1000);
  const mutations = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let count = 0;
        const observer = new MutationObserver((records) => (count += records.length));
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
        setTimeout(() => {
          observer.disconnect();
          resolve(count);
        }, 2000);
      }),
  );
  expect(mutations).toBe(0);
});

test("controls write to the URL, and reloading keeps them", async ({ page }) => {
  await page.goto("/visualizations/random-walk?seed=7");
  await page.getByRole("switch", { name: "Show trails" }).click();
  await page.getByRole("combobox", { name: "Step directions" }).click();
  await page.getByRole("option", { name: "Grid (4 directions)" }).click();
  await expect(page).toHaveURL(/trails=0/);
  await expect(page).toHaveURL(/directions=grid/);

  await page.reload();
  await expect(page.getByRole("switch", { name: "Show trails" })).not.toBeChecked();
  await expect(page.getByRole("combobox", { name: "Step directions" })).toContainText("Grid");
});

test("invalid URL values fall back to defaults", async ({ page }) => {
  await page.goto("/visualizations/random-walk?walkers=abc&directions=hex&trails=maybe&seed=7");
  await expect(page).toHaveURL(/walkers=100&.*directions=any&trails=1&seed=7/);
});

test("Copy link copies a link to this run", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/visualizations/ising-model?temperature=1.5&seed=7#explanation");
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();
  const copied = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(copied.pathname).toBe("/visualizations/ising-model");
  expect(copied.searchParams.get("temperature")).toBe("1.5");
  expect(copied.searchParams.get("seed")).toBe("7");
  expect(copied.hash).toBe("");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("fits the screen and opens the controls sheet", async ({ page }) => {
    await page.goto("/visualizations/percolation?seed=7");
    await expect(page.locator("canvas")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole("button", { name: "Controls" }).tap();
    await expect(page.getByRole("dialog").getByRole("slider", { name: "Grid size" })).toBeVisible();
  });
});

// The browser logs the 404 response as a console error, so this one uses the plain fixture.
base("unknown paths get the 404 page", async ({ page }) => {
  const response = await page.goto("/visualizations/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
