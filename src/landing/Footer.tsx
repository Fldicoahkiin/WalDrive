import { useState } from "react";
import { motion } from "motion/react";
import { Tag, Copy, Check, ExternalLink } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import {
  CONTAINER,
  DEEPSURGE_URL,
  EASE,
  IN_VIEW,
  PACKAGE_ID,
  REPO_URL,
  RELEASE_URL,
  SUISCAN_PACKAGE_URL,
} from "./shared";
import { NavCta, LinkCta } from "./primitives";

/** GitHub mark — lucide dropped its brand glyphs, so inline the official path. */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.3-5.466-1.305-5.466-5.811 0-1.283.465-2.333 1.235-3.155-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.205a11.563 11.563 0 0 1 3-.402c1.02.005 2.045.135 3 .402 2.28-1.521 3.285-1.205 3.285-1.205.645 1.624.24 2.823.12 3.121.765.822 1.23 1.872 1.23 3.155 0 4.518-2.805 5.508-5.475 5.799.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.561C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z" />
    </svg>
  );
}

export function ClosingCta() {
  return (
    <section className={`py-16 sm:py-20 ${CONTAINER}`}>
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-1 px-8 py-14 text-center lift sm:px-14"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={IN_VIEW}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(94,106,210,0.18),transparent_70%)]"
        />
        <h2 className="relative text-balance text-[clamp(26px,4vw,38px)] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">
          Files you actually own, on a network anyone can verify.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-[16px] text-ink-subtle">
          Open the console in your browser — no install, no account, free on testnet.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <NavCta className="h-11 px-5 text-[15px]" to="/app" variant="primary">
            Launch app
          </NavCta>
          <LinkCta className="h-11 px-5 text-[15px]" href={REPO_URL} variant="secondary">
            <GithubMark className="size-4" />
            View on GitHub
          </LinkCta>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  const [copied, setCopied] = useState(false);
  const copyAddr = async () => {
    await navigator.clipboard.writeText(PACKAGE_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <footer className="border-t border-hairline py-12">
      <div className={`flex flex-col gap-8 ${CONTAINER}`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-7" />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">WalDrive</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              className="inline-flex items-center gap-1.5 text-[14px] text-ink-subtle transition-colors hover:text-ink"
              href={REPO_URL}
              rel="noreferrer"
              target="_blank"
            >
              <GithubMark className="size-4" />
              GitHub
            </a>
            <a
              className="inline-flex items-center gap-1.5 text-[14px] text-ink-subtle transition-colors hover:text-ink"
              href={RELEASE_URL}
              rel="noreferrer"
              target="_blank"
            >
              <Tag className="size-4" strokeWidth={1.75} />
              Latest release
            </a>
            <a
              className="inline-flex items-center gap-1.5 text-[14px] text-ink-subtle transition-colors hover:text-ink"
              href={DEEPSURGE_URL}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-4" strokeWidth={1.75} />
              DeepSurge
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-tertiary">
            <span>Contract package (testnet)</span>
            <button
              className="group inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-1 px-2 py-1 font-mono text-[12px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
              onClick={copyAddr}
              type="button"
            >
              <span className="hidden sm:inline">{PACKAGE_ID.slice(0, 10)}…{PACKAGE_ID.slice(-6)}</span>
              <span className="sm:hidden">{PACKAGE_ID.slice(0, 8)}…</span>
              {copied ? (
                <Check className="size-3.5 text-success" strokeWidth={2} />
              ) : (
                <Copy className="size-3.5" strokeWidth={1.75} />
              )}
            </button>
            <a
              className="inline-flex items-center gap-1 text-ink-subtle transition-colors hover:text-ink"
              href={SUISCAN_PACKAGE_URL}
              rel="noreferrer"
              target="_blank"
            >
              Suiscan
              <ExternalLink className="size-3" strokeWidth={1.75} />
            </a>
          </div>

          <p className="text-[12.5px] text-ink-tertiary">
            Built for Sui Overflow 2026 · Walrus track ·{" "}
            <span className="text-ink-subtle">Testnet only</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
