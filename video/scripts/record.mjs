// Records real-interaction demo clips by driving the live app (localhost:5173)
// with Playwright: a visible synthetic cursor glides, clicks ripple, and every
// scene is captured as its own webm in out/clips/. Re-run after UX changes to
// regenerate the footage. Usage: node scripts/record.mjs [scene ...]
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLIPS = join(ROOT, "out", "clips");
const APP = "http://localhost:5173";
const SIZE = { width: 1920, height: 1080 };

// Funded test wallet (hackathon testnet) — used for off-screen top-ups and the
// "restore on a new device" import scene. Read from the repo's backup env.
const FUNDER = "waldrive-app";
const RESTORE_KEY = (() => {
  try {
    const env = readFileSync(join(ROOT, "..", ".env.local"), "utf8");
    const m = env.match(/VITE_WALDRIVE_KEYPAIR=(suiprivkey1[0-9a-z]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
})();

const CURSOR_INIT = `
(() => {
  const make = () => {
    if (document.getElementById("__cursor")) return;
    const c = document.createElement("div");
    c.id = "__cursor";
    c.style.cssText = [
      "position:fixed", "left:-40px", "top:-40px", "width:22px", "height:22px",
      "border-radius:50%", "background:rgba(255,255,255,0.92)",
      "border:1.5px solid rgba(20,20,30,0.55)", "box-shadow:0 1px 6px rgba(0,0,0,0.45)",
      "z-index:2147483647", "pointer-events:none", "transform:translate(-50%,-50%)",
      "transition:width .12s ease,height .12s ease,background .12s ease",
    ].join(";");
    document.documentElement.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => { c.style.width = "15px"; c.style.height = "15px"; c.style.background = "rgba(94,106,210,0.95)"; }, true);
    addEventListener("mouseup", () => { c.style.width = "22px"; c.style.height = "22px"; c.style.background = "rgba(255,255,255,0.92)"; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", make);
  else make();
})();
`;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Director {
  constructor(page) {
    this.page = page;
    this.x = SIZE.width / 2;
    this.y = SIZE.height / 2;
  }
  async glideTo(x, y, ms = 650) {
    const steps = Math.max(12, Math.round(ms / 16));
    const [x0, y0] = [this.x, this.y];
    for (let i = 1; i <= steps; i++) {
      const t = easeInOut(i / steps);
      await this.page.mouse.move(x0 + (x - x0) * t, y0 + (y - y0) * t);
      await sleep(ms / steps);
    }
    this.x = x; this.y = y;
  }
  async glide(selector, ms = 650) {
    const el = this.page.locator(selector).first();
    await el.waitFor({ state: "visible", timeout: 15000 });
    const box = await el.boundingBox();
    await this.glideTo(box.x + box.width / 2, box.y + box.height / 2, ms);
    return el;
  }
  async click(selector, { pause = 260, ms = 600, force = false } = {}) {
    const el = await this.glide(selector, ms);
    await sleep(pause);
    // real click on the element (full event pipeline — needed for React-Aria
    // Select/Popover); the synthetic cursor already glided there for the camera.
    await el.click({ delay: 70, force });
  }
  /** Close a HeroUI modal — it ignores Escape, so click its Close button. */
  async closeModal() {
    const close = this.page.locator('[aria-label="Close"]').last();
    if (await close.count()) {
      await this.glide('[aria-label="Close"]', 500).catch(() => {});
      await close.click({ force: true });
    }
    await this.page
      .locator('[data-slot="modal-backdrop"]')
      .waitFor({ state: "detached", timeout: 8000 })
      .catch(() => {});
  }
  async type(selector, text, { perChar = 55 } = {}) {
    await this.click(selector);
    for (const ch of text) { await this.page.keyboard.type(ch); await sleep(perChar); }
  }
  /** Drop files onto the upload zone with a real drag-over (dragging UI shows). */
  async dropFiles(files) {
    const zone = this.page.locator('input[type="file"]').first().locator("xpath=..");
    const box = await zone.boundingBox();
    await this.glideTo(box.x + box.width / 2, box.y - 120, 500);
    const dt = await this.page.evaluateHandle(async (specs) => {
      const dt = new DataTransfer();
      for (const { name, mime, b64 } of specs) {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        dt.items.add(new File([bytes], name, { type: mime }));
      }
      return dt;
    }, files);
    await zone.dispatchEvent("dragover", { dataTransfer: dt });
    await this.glideTo(box.x + box.width / 2, box.y + box.height / 2, 700);
    await sleep(350);
    await zone.dispatchEvent("drop", { dataTransfer: dt });
  }
}

/** Reset to a brand-new user (no wallet, no settings). */
async function freshUser(page) {
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

const fileB64 = (rel) => readFileSync(join(ROOT, rel)).toString("base64");
const activeAddress = async (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("waldrive-wallets") ?? "{}").active ?? null);

// ───────────────────────────── scenes ─────────────────────────────

const scenes = {
  /** Welcome → generate a wallet → main view appears with the gas banner. */
  async "01-welcome"(d, page) {
    await page.waitForSelector("text=Welcome to WalDrive");
    await sleep(1800);
    await d.click('button:has-text("Generate a new wallet")', { ms: 900 });
    await page.waitForSelector("text=it just needs gas");
    await sleep(600);
    await d.glide('button:has-text("Get free test SUI")', 700);
    await sleep(1600);
  },

  /** Top up off-screen, reload: banner gone, balance live. */
  async "02-fund"(d, page) {
    const addr = await activeAddress(page);
    if (!addr) throw new Error("no wallet — run 01-welcome first (same profile)");
    console.log(`  funding ${addr.slice(0, 10)}… from ${FUNDER}`);
    try { execFileSync("sui", ["client", "switch", "--address", FUNDER], { stdio: "ignore" }); } catch {}
    const coin = JSON.parse(execFileSync("sui", ["client", "gas", "--json"]).toString())[0].gasCoinId;
    execFileSync(
      "sui",
      ["client", "transfer-sui", "--to", addr, "--sui-coin-object-id", coin, "--amount", "100000000", "--gas-budget", "10000000"],
      { stdio: "ignore" },
    );
    await page.reload();
    await page.waitForSelector("text=SUI · testnet");
    await page.waitForFunction(() => !document.body.innerText.includes("it just needs gas"), { timeout: 30000 });
    await sleep(1200);
    await d.glideTo(260, 980, 700); // toward the sidebar balance
    await sleep(1500);
  },

  /** Drag a real photo in → progress → card appears live. */
  async "03-multi-upload"(d, page) {
    await page.waitForSelector("text=Drag a file here");
    await sleep(800);
    const md = btoa(unescape(encodeURIComponent(
      "# Field Notes\n\nShot list for the trip:\n\n- harbor at dawn\n- the old lighthouse\n- **walrus colony** at the point\n\n`gear: 24-70mm`"
    )));
    const json = btoa('{"trip":"north-coast","day":3,"keepers":12,"weather":"fog"}');
    await d.dropFiles([
      { name: "trip-photo.png", mime: "image/png", b64: fileB64("public/01-grid.png") },
      { name: "field-notes.md", mime: "text/markdown", b64: md },
      { name: "shoot-log.json", mime: "application/json", b64: json },
    ]);
    // batch progress "1 of 3 — Uploading…" plays on camera
    await page.waitForSelector('[aria-label="Open trip-photo.png"]', { timeout: 90000 });
    await page.waitForSelector('[aria-label="Open field-notes.md"]', { timeout: 90000 });
    await page.waitForSelector('[aria-label="Open shoot-log.json"]', { timeout: 90000 });
    await sleep(600);
    await d.glide('[aria-label="Open field-notes.md"]', 600);
    await sleep(1200);
  },

  /** Open the markdown → rendered preview + real expiry → Verify (live SHA-256). */
  async "04-verify"(d, page) {
    await page.waitForSelector('[aria-label="Open field-notes.md"]');
    await sleep(600);
    await d.click('[aria-label="Open field-notes.md"]');
    await page.waitForSelector("text=Verifiable storage");
    await page.waitForSelector(".prose-preview h1", { timeout: 20000 }).catch(() => {});
    await sleep(1600); // rendered markdown + "epoch N · ≈Xd left" on camera
    await d.click('button:has-text("Verify")');
    await page.waitForSelector("text=Retrieved", { timeout: 30000 });
    await sleep(2400);
    await d.closeModal();
    await sleep(600);
  },

  /** Create a folder, then open a file → tag it → move it into the folder,
   *  then browse into the folder. `file` defaults to trip-photo (the upload from
   *  the chained run) but falls back to whatever's present. Tag input dismisses
   *  on blur, so type on the focused input without moving the cursor. */
  async "05-organize"(d, page) {
    await page.waitForSelector('[aria-label^="Open "]', { timeout: 20000 });
    const file = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('[aria-label^="Open "]')].map((b) => b.getAttribute("aria-label"));
      return labels.find((l) => l.includes("shoot-log")) ?? labels[0];
    });
    // 1) make the folder first (breadcrumb bar, no modal in the way)
    await d.click('button:has-text("New folder")');
    const folderInput = page.locator('[aria-label="Folder name"]');
    await folderInput.waitFor({ state: "visible" });
    await sleep(300);
    await folderInput.pressSequentially("Albums", { delay: 90 });
    await sleep(400);
    await folderInput.press("Enter");
    await page.waitForSelector('button:has-text("Albums")', { timeout: 30000 });
    await sleep(1100);
    // 2) open the file, tag it
    await d.click(`[aria-label="${file}"]`);
    await page.waitForSelector("text=Verifiable storage");
    await sleep(600);
    await d.click('button:has-text("Tag")');
    const tagInput = page.locator('[aria-label="New tag"]');
    await tagInput.waitFor({ state: "visible" });
    await sleep(300);
    await tagInput.pressSequentially("logs", { delay: 90 });
    await sleep(400);
    await tagInput.press("Enter");
    await page.waitForSelector('[role="dialog"] span:has-text("logs")', { timeout: 25000 }).catch(() => {});
    await sleep(1300);
    // 3) move it into Photos via the Move select (the select fires the move tx;
    //    the modal stays open, so close it ourselves and let the list refetch)
    await d.click('[aria-label="Move to folder"]', { force: true });
    await page.waitForSelector('[role="option"]:has-text("Albums")', { timeout: 8000 });
    await sleep(300);
    await d.click('[role="option"]:has-text("Albums")', { force: true });
    await sleep(1900); // move tx in flight
    await d.closeModal(); // HeroUI modal ignores Escape — click Close
    await sleep(1000);
    // 4) browse into the folder via the breadcrumb tile
    await d.click('button:has-text("Albums")', { force: true });
    await page.waitForSelector('[aria-label^="Open "]', { timeout: 20000 }).catch(() => {});
    await sleep(1600);
  },

  /** Upload a new version of the markdown, open History, restore v1 — one tx. */
  async "06-versions"(d, page) {
    // back to All Files (we may be inside the Photos folder from 05)
    await d.click('[role="option"]:has-text("All Files")', { force: true }).catch(() => {});
    await sleep(800);
    await page.waitForSelector('[aria-label="Open field-notes.md"]', { timeout: 20000 });
    await d.click('[aria-label="Open field-notes.md"]');
    await page.waitForSelector("text=Verifiable storage");
    await sleep(700);
    // hover the new-version button for the camera, then feed its hidden input
    await d.glide('[aria-label="Upload new version"]', 600);
    await sleep(400);
    const md2 = btoa(unescape(encodeURIComponent("# Field Notes (rev 2)\n\nTrimmed the shot list to keepers only.")));
    await page.evaluate((b64) => {
      const input = document.querySelector('[role="dialog"] input[type="file"]');
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], "field-notes.md", { type: "text/markdown" }));
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, md2);
    await sleep(12000); // version uploads + create_version tx land
    await d.closeModal();
    // reopen — now v2 with history
    await page.waitForSelector('[aria-label="Open field-notes.md"]', { timeout: 30000 });
    await sleep(900);
    await d.click('[aria-label="Open field-notes.md"]');
    await page.waitForSelector("text=History", { timeout: 30000 });
    await sleep(700);
    await d.click('button:has-text("History")');
    await page.waitForSelector('button:has-text("Restore")', { timeout: 20000 });
    await sleep(1400); // history rows on camera
    await d.click('button:has-text("Restore")');
    // restore closes the modal once the tx lands
    await page
      .locator('[data-slot="modal-backdrop"]')
      .waitFor({ state: "detached", timeout: 30000 })
      .catch(() => {});
    await sleep(1000);
    // reopen to show the v3 badge + rolled-back content
    await d.click('[aria-label="Open field-notes.md"]');
    await page.waitForSelector("text=· 2 earlier versions", { timeout: 30000 }).catch(() => {});
    await sleep(2000);
    await d.closeModal();
    await sleep(400);
  },

  /** Settings → Storage objects: the wallet's Blob receipts; extend one on-chain. */
  async "07-storage"(d, page) {
    await d.click('button:has-text("Settings")');
    await page.waitForSelector("text=Storage objects");
    await sleep(600);
    // scroll the panel into view inside the modal body
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('[role="dialog"] span')].find((s) => s.textContent === "Storage objects");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    await page.waitForSelector("text=expires epoch", { timeout: 30000 });
    await sleep(1500); // blob list on camera
    await d.click('button:has-text("epochs")');
    await sleep(9000); // extend tx + refetch — the epoch bumps on camera
    await sleep(1600);
    await d.closeModal();
    await sleep(400);
  },

  /** Account switcher: the wallet menu, then import the long-lived account —
   *  the whole tree swaps in. Restore story. */
  async "08-accounts"(d, page) {
    if (!RESTORE_KEY) throw new Error("no restore key in ../.env.local backup");
    await d.click('[aria-label="Switch account"]');
    await page.waitForSelector('[role="menu"]');
    await sleep(1600); // menu with identicon dots on camera
    await d.click('[role="menuitem"]:has-text("Add account")');
    await page.waitForSelector("text=Wallet", { timeout: 15000 });
    await sleep(600);
    await d.click('[role="dialog"] button:has-text("Add account")');
    await page.waitForSelector('[aria-label="Account name"]', { timeout: 15000 });
    await sleep(400);
    await page.locator('[aria-label="Account name"]').pressSequentially("Main", { delay: 90 });
    await d.click('[aria-label="Private key"]');
    await page.locator('[aria-label="Private key"]').fill(RESTORE_KEY);
    await sleep(600);
    await d.click('button:has-text("Import account")');
    await sleep(1400);
    await d.closeModal();
    await page.waitForSelector('[aria-label^="Open "]', { timeout: 30000 });
    await sleep(2600); // the old account's whole drive slides in
  },
};

// ───────────────────────────── main ─────────────────────────────

mkdirSync(CLIPS, { recursive: true });
const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(scenes);

// Scenes share one persistent profile via storageState chaining: 01 starts
// fresh; each scene saves state for the next (persisted so single scenes can
// be re-recorded without replaying the whole sequence).
const STATE_FILE = join(CLIPS, "state.json");
let state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : null;
for (const name of names) {
  if (!scenes[name]) { console.error(`unknown scene ${name}`); process.exit(1); }
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 1,
    recordVideo: { dir: CLIPS, size: SIZE },
    colorScheme: "dark",
    storageState: state ?? undefined,
  });
  await context.addInitScript(CURSOR_INIT);
  await context.addInitScript(() => localStorage.setItem("waldrive-theme", "dark"));
  const page = await context.newPage();
  console.log(`▶ ${name}`);
  if (name === "01-welcome") {
    await freshUser(page);
  } else {
    await page.goto(APP);
  }
  const d = new Director(page);
  try {
    await scenes[name](d, page);
    state = await context.storageState();
    writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    state = await context.storageState().catch(() => state);
  }
  const video = page.video();
  await context.close();
  const path = await video.path();
  renameSync(path, join(CLIPS, `${name}.webm`));
  await browser.close();
  console.log(`  ✓ out/clips/${name}.webm`);
}
console.log("done:", readdirSync(CLIPS).join(", "));
