// Capture real WalDrive app screenshots for the Remotion demo.
// Requires the Vite dev server running at APP_URL (default http://localhost:5173)
// with the demo wallet seeded. Run: node scripts/capture.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public");
const URL = process.env.APP_URL ?? "http://localhost:5173";

const log = (...a) => console.log("[capture]", ...a);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
page.on("console", (m) => {
  if (m.type() === "error") log("page error:", m.text());
});

// Force dark theme before app scripts run, so shots match the dark video frame.
await page.addInitScript(() => {
  try {
    localStorage.setItem("waldrive-theme", "dark");
  } catch {}
});

const shot = (name) => page.screenshot({ path: join(OUT, name) });

async function openGrid() {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector('[aria-label^="Open "]', { timeout: 30000 });
  // Let the grid entrance animation settle.
  await page.waitForTimeout(900);
}

async function closeModalIfOpen() {
  const backdrop = page.locator('[data-slot="modal-backdrop"]');
  if (!(await backdrop.count())) return;
  // Close trigger is more reliable than Escape when the markdown body holds focus.
  const closeTrigger = page.locator('[data-slot="modal-close-trigger"]').first();
  if (await closeTrigger.count()) await closeTrigger.click().catch(() => {});
  else await page.keyboard.press("Escape");
  await backdrop
    .first()
    .waitFor({ state: "detached", timeout: 5000 })
    .catch(() => log("modal backdrop did not detach in time"));
  await page.waitForTimeout(300);
}

// 01 — main grid view (sidebar + file grid + breadcrumb)
async function captureGrid() {
  await openGrid();
  await shot("01-grid.png");
  log("01-grid.png");
}

// 02 — preview modal, Verify clicked → verified state
async function capturePreview() {
  await page.click('[aria-label="Open hello.md"]');
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  // Wait for the preview body to finish loading the blob (drops "Loading preview…").
  await page
    .locator("text=Loading preview…")
    .first()
    .waitFor({ state: "detached", timeout: 15000 })
    .catch(() => log("preview body still loading; continuing"));

  const verify = page.locator("button", { hasText: "Verify" }).first();
  await verify.click();
  const ok = await page
    .locator("text=/Retrieved .* from Walrus/")
    .first()
    .waitFor({ timeout: 25000 })
    .then(() => true)
    .catch(() => false);
  log("verify success line:", ok);
  await page.waitForTimeout(500);
  await shot("02-preview.png");
  log("02-preview.png");
  await closeModalIfOpen();
}

// 03 — search field filtering on "md"
async function captureSearch() {
  const search = page.locator('input[type="search"]').first();
  await search.click();
  await search.fill("md");
  await page.waitForTimeout(700);
  await shot("03-search.png");
  log("03-search.png");
  await search.fill("");
  await page.waitForTimeout(400);
}

// 04 — All Files view (breadcrumb + Demo folder tile + files) in list view
async function captureFolder() {
  // Switch to list view for visual contrast with the grid in 01.
  const listBtn = page.locator('[aria-label="List view"]').first();
  if (await listBtn.count()) {
    await listBtn.click();
    await page.waitForTimeout(600);
  } else {
    log('no "List view" button found; keeping grid view');
  }
  await shot("04-folder.png");
  log("04-folder.png");
}

try {
  await captureGrid();
  await capturePreview();
  await captureSearch();
  await captureFolder();
  log("done");
} catch (e) {
  log("ERROR:", e?.message ?? e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
