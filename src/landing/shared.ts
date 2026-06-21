/**
 * Shared building blocks for the marketing landing page.
 * Keeps animation curves, external links, and the content width cap in one place
 * so every section reads from the same source.
 */

/** Linear's ease-out — no overshoot. Matches globals.css --ease-out. */
export const EASE = [0.16, 1, 0.3, 1] as const;

export const REPO_URL = "https://github.com/Fldicoahkiin/WalDrive";
export const RELEASE_URL = "https://github.com/Fldicoahkiin/WalDrive/releases/latest";
export const PACKAGE_ID = "0xf7ac2790c5fe604fdd4b7666605a7e7423cf2feb43e37564b6158d9db800ad45";
export const SUISCAN_PACKAGE_URL = `https://suiscan.xyz/testnet/object/${PACKAGE_ID}`;
export const DEEPSURGE_URL =
  "https://www.deepsurge.xyz/projects/c13d586b-9a0a-4d77-b827-d5e6b3374a47";

/** Reusable max-width + horizontal padding for every section's inner container. */
export const CONTAINER = "mx-auto w-full max-w-[1120px] px-6";

/** whileInView config shared by scroll-reveal sections. */
export const IN_VIEW = { once: true, amount: 0.3, margin: "0px 0px -10% 0px" } as const;

/** Staggered fade/slide-up — children of a section reveal in sequence. */
export function revealUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: IN_VIEW,
    transition: { duration: 0.55, ease: EASE, delay },
  } as const;
}
