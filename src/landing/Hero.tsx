import { motion } from "motion/react";
import { ArrowRight, Download } from "lucide-react";
import { CONTAINER, EASE, RELEASE_URL } from "./shared";
import { LinkCta, NavCta } from "./primitives";
import { LiveApp } from "./LiveApp";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-36" id="top">
      <HeroBackdrop />

      <motion.div
        animate="show"
        className={`relative flex flex-col items-center text-center ${CONTAINER}`}
        initial="hidden"
        variants={container}
      >
        <motion.a
          className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-1/70 px-3.5 py-1.5 text-[13px] text-ink-muted backdrop-blur-sm transition-colors hover:border-hairline-strong"
          href="#how"
          variants={item}
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
          </span>
          Sui Overflow 2026 · Walrus track
        </motion.a>

        <motion.h1
          className="mt-7 max-w-4xl text-balance text-[clamp(40px,7vw,72px)] font-semibold leading-[1.04] tracking-[-0.035em] text-ink"
          variants={item}
        >
          A desktop drive for the data
          <br className="hidden sm:block" /> your agents store on{" "}
          <span className="bg-gradient-to-br from-[#828fff] to-accent bg-clip-text text-transparent">
            Walrus
          </span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-2xl text-pretty text-[18px] leading-relaxed text-ink-subtle"
          variants={item}
        >
          Your agents write files via MCP, CLI, or an installable skill — you browse, preview,
          verify and version them in a fluid desktop console. Bytes on Walrus, metadata on Sui,
          nothing in between: files you actually own, verifiable by anyone. Every feature here is
          live on testnet — no mock, no login wall.
        </motion.p>

        <motion.div className="mt-9 flex flex-wrap items-center justify-center gap-3" variants={item}>
          <NavCta className="h-11 px-5 text-[15px]" to="/app" variant="primary">
            Launch app
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
          </NavCta>
          <LinkCta className="h-11 px-5 text-[15px]" href={RELEASE_URL} variant="secondary">
            <Download className="size-4" strokeWidth={1.75} />
            Download for desktop
          </LinkCta>
        </motion.div>

        <motion.div
          className="mt-16 w-full max-w-[960px]"
          initial={{ opacity: 0, y: 34, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: EASE, delay: 0.45 }}
        >
          <LiveApp />
        </motion.div>
      </motion.div>
    </section>
  );
}

/** Grid + radial accent glow behind the hero. Static, purely decorative. */
function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000_30%,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute left-1/2 top-[-12%] h-[460px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(94,106,210,0.22),transparent_68%)] blur-2xl" />
    </div>
  );
}
