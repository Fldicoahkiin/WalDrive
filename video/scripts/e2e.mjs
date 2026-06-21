// End-to-end test of the WalDrive console against the live app + real testnet.
// Drives /app in a headless browser and asserts the demo's core flows actually
// work end to end: onboarding → import key, the file list from chain, preview +
// on-chain Verify (re-fetch + SHA-256 from real Walrus), and a live drag-to-
// upload round-trip (real Walrus PUT + Sui register).
//
//   WALDRIVE_KEYPAIR=suiprivkey1… APP_URL=http://localhost:5173/app node scripts/e2e.mjs
// (the Vite dev/preview server must be running)
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:5173/app";
const KEY = process.env.WALDRIVE_KEYPAIR;
if (!KEY) {
  console.error("set WALDRIVE_KEYPAIR (a funded testnet suiprivkey1…)");
  process.exit(1);
}
let failures = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => {
  console.error(`  ✗ ${m}`);
  failures++;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
// Seed the funded keypair so the app opens with a real wallet (not the
// read-only demo drive, which has no upload zone).
await page.addInitScript((key) => {
  try {
    localStorage.setItem("waldrive-theme", "dark");
    localStorage.setItem("waldrive-wallets", JSON.stringify({ active: null, accounts: [{ secret: key }] }));
  } catch {}
}, KEY);

try {
  console.log(`▶ e2e against ${APP}`);
  await page.goto(APP, { waitUntil: "networkidle", timeout: 30000 });

  // 1) onboarding → import the funded demo keypair
  if (await page.locator('button:has-text("Import an existing key")').count()) {
    await page.click('button:has-text("Import an existing key")');
    await page.fill('[aria-label="Private key"]', KEY);
    await page.click('button:has-text("Import")');
    ok("onboarding → imported demo keypair");
  } else {
    ok("wallet already present");
  }

  // 2) the demo files list from chain
  await page.waitForSelector('[aria-label^="Open "]', { timeout: 30000 });
  ok("console loaded, files list from Sui");
  for (const n of ["hello.md", "data.json", "notes.txt"]) {
    if (await page.locator(`[aria-label="Open ${n}"]`).count()) ok(`file lists: ${n}`);
    else fail(`file missing: ${n}`);
  }

  // 3) preview + Verify — the verifiable-storage flow, end to end against real Walrus
  await page.click('[aria-label="Open hello.md"]');
  await page.waitForSelector("text=Verifiable storage", { timeout: 15000 });
  ok("preview opens (Verifiable storage panel)");
  await page.click('button:has-text("Verify")');
  const verified = await page
    .locator("text=/Retrieved .* from Walrus/")
    .first()
    .waitFor({ timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (verified) ok("VERIFY: re-fetched bytes + SHA-256 from real Walrus");
  else fail("verify did not complete");
  await page.locator('[data-slot="modal-close-trigger"]').first().click().catch(() => {});
  await page.waitForTimeout(600);

  // 4) drag-to-upload round-trip — real Walrus PUT + Sui register, appears live
  const name = "e2e-test.md";
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name, mimeType: "text/markdown", buffer: Buffer.from(`# e2e ${new Date().toISOString()}\n`) });
  const appeared = await page
    .locator(`[aria-label="Open ${name}"]`)
    .waitFor({ timeout: 60000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) ok("UPLOAD: stored on Walrus + registered on Sui, appeared live");
  else fail("upload did not appear within 60s");
} catch (e) {
  fail(`threw: ${e?.message ?? e}`);
} finally {
  await browser.close();
}

console.log(failures === 0 ? "✓ e2e PASSED" : `✗ e2e FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
