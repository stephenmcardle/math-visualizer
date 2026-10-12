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

/** Saves the current frame through the UI and returns the PNG file. */
async function saveFramePng(page: Page): Promise<Buffer> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Save image" }).click(),
  ]);
  return readFile(await download.path());
}

/** Saves the current frame and returns the share of non-background pixels. */
async function saveFrame(page: Page): Promise<{ width: number; drawn: number; opaque: boolean }> {
  const png = await saveFramePng(page);
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

test("the home page filters by tag, keeps filters in the URL, and clears them", async ({
  page,
}) => {
  const all = visualizations.list().map((definition) => definition.metadata);
  const tagged = all.filter((metadata) => metadata.tags.includes("phase transition"));
  expect(tagged.length).toBeGreaterThan(0);
  const cards = page.locator("main li a[href^='/visualizations/']");

  await page.goto("/");
  await page.getByRole("combobox", { name: "Tag" }).click();
  await page.getByRole("option", { name: "phase transition" }).click();
  await expect(cards).toHaveCount(tagged.length);
  await expect(page.getByRole("status")).toHaveText(
    `Showing ${tagged.length} of ${all.length} visualizations.`,
  );
  await expect(page).toHaveURL(/\?tag=phase\+transition$/);

  await page.reload();
  await expect(cards).toHaveCount(tagged.length);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(cards).toHaveCount(all.length);
  await expect(page).toHaveURL(/\/$/);
});

test("a shared filter link applies, and unknown values are ignored", async ({ page }) => {
  const all = visualizations.list().map((definition) => definition.metadata);
  const category = all[0].category;
  const inCategory = all.filter((metadata) => metadata.category === category);
  await page.goto(`/?category=${encodeURIComponent(category)}&difficulty=impossible`);
  await expect(page.locator("main li a[href^='/visualizations/']")).toHaveCount(inCategory.length);
  await expect(page.getByRole("combobox", { name: "Difficulty" })).toContainText("Any difficulty");
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

    // Explanation math: no KaTeX error output, and the stylesheet loaded (it hides
    // the MathML copy; without it every formula would show twice).
    await expect(page.locator(".katex-error")).toHaveCount(0);
    const mathml = page.locator(".katex-mathml");
    if ((await mathml.count()) > 0) await expect(mathml.first()).toHaveCSS("position", "absolute");
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

test("pausing describes the current state to screen readers", async ({ page }) => {
  await page.goto("/visualizations/random-walk?walkers=50&seed=7");
  const viewport = page.getByRole("img", { name: /visualization$/ });
  await expect(viewport).toHaveAccessibleDescription(/^Running\./);
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(viewport).toHaveAccessibleDescription(/^50 walkers after \d+ steps\./);
  await expect(
    page.locator("[aria-live=polite]").filter({ hasText: /^Paused\. 50 walkers/ }),
  ).toHaveCount(1);
});

test("the 3D camera rotates with the arrow keys", async ({ page }) => {
  await page.goto("/visualizations/lorenz-attractor?seed=7");
  const viewport = page.getByRole("img", { name: /visualization$/ });
  await expect(viewport).toHaveAccessibleDescription(/arrow keys to rotate/);
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Pause" }).click();
  const before = await saveFramePng(page);
  // Saving moves focus to the button, so focus the viewport before each set of key presses.
  await viewport.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowLeft");
  const after = await saveFramePng(page);
  expect(after.equals(before)).toBe(false);
  // Rotating back returns to the same view; the simulation did not advance while paused.
  await viewport.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  expect((await saveFramePng(page)).equals(before)).toBe(true);
});

test("2D views pan and zoom with buttons, keys, Ctrl + wheel and drag", async ({ page }) => {
  await page.goto("/visualizations/ising-model?seed=7");
  const viewport = page.getByRole("img", { name: /visualization$/ });
  const resetView = page.getByRole("button", { name: "Reset view" });
  await expect(viewport).toHaveAccessibleDescription(/plus or minus to zoom/);
  await expect(resetView).toBeDisabled();
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeDisabled();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Pause" }).click();
  const before = await saveFramePng(page);

  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(resetView).toBeEnabled();
  expect((await saveFramePng(page)).equals(before)).toBe(false);
  // Zooming doesn't advance the simulation, so the default view looks the same as before.
  await viewport.focus();
  await page.keyboard.press("0");
  await expect(resetView).toBeDisabled();
  expect((await saveFramePng(page)).equals(before)).toBe(true);

  const box = (await viewport.boundingBox())!;
  const scrolled = await page.evaluate(() => scrollY);
  await page.mouse.move(box.x + box.width / 3, box.y + box.height / 3);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -100);
  await page.keyboard.up("Control");
  await expect(resetView).toBeEnabled();
  // Ctrl + wheel zooms the visualization instead of scrolling (or zooming) the page.
  expect(await page.evaluate(() => scrollY)).toBe(scrolled);
  await resetView.click();
  await expect(resetView).toBeDisabled();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 4 });
  await page.mouse.up();
  await expect(resetView).toBeEnabled();
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

  test("two fingers over the viewport zoom, and one finger scrolls the page", async ({ page }) => {
    await page.goto("/visualizations/ising-model?seed=7");
    const viewport = page.getByRole("img", { name: /visualization$/ });
    await expect(page.getByRole("button", { name: "Reset view" })).toBeDisabled();
    const box = (await viewport.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    // Playwright's touchscreen API only taps, so send raw touch events.
    const cdp = await page.context().newCDPSession(page);
    const touch = (
      type: "touchStart" | "touchMove" | "touchEnd",
      touchPoints: { x: number; y: number; id: number }[],
    ) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints });

    await touch("touchStart", [
      { x: x - 20, y, id: 1 },
      { x: x + 20, y, id: 2 },
    ]);
    for (let i = 1; i <= 8; i++) {
      await touch("touchMove", [
        { x: x - 20 - i * 10, y, id: 1 },
        { x: x + 20 + i * 10, y, id: 2 },
      ]);
    }
    await touch("touchEnd", []);
    await expect(page.getByRole("button", { name: "Reset view" })).toBeEnabled();
    // The pinch zoomed the visualization, not the page.
    expect(await page.evaluate(() => [scrollY, visualViewport!.scale])).toEqual([0, 1]);
    await page.getByRole("button", { name: "Reset view" }).tap();

    await touch("touchStart", [{ x, y, id: 1 }]);
    for (let i = 1; i <= 8; i++) await touch("touchMove", [{ x, y: y - i * 25, id: 1 }]);
    await touch("touchEnd", []);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    // A one-finger swipe isn't a view gesture.
    await expect(page.getByRole("button", { name: "Reset view" })).toBeDisabled();
  });
});

// The browser logs the 404 response as a console error, so this one uses the plain fixture.
base("unknown paths get the 404 page", async ({ page }) => {
  const response = await page.goto("/visualizations/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
