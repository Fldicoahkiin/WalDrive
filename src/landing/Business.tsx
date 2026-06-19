import { motion } from "motion/react";
import { Coins, RefreshCw, Store, type LucideIcon } from "lucide-react";
import { CONTAINER, EASE, IN_VIEW } from "./shared";
import { SectionHeading } from "./primitives";

type Model = { Icon: LucideIcon; tag: string; title: string; body: string };

const MODELS: Model[] = [
  {
    Icon: Coins,
    tag: "Metered",
    title: "Pay per upload",
    body: "On mainnet each write costs WAL storage + SUI gas — metered and auditable on-chain. WalDrive fronts the publisher; the FileRecord is the receipt. Agents pay for exactly what they keep.",
  },
  {
    Icon: RefreshCw,
    tag: "Subscription",
    title: "Persistence & privacy",
    body: "Agent data has to outlive the run. A subscription auto-renews your Walrus blobs before they expire, and unlocks private, encrypted storage for the data agents shouldn't leave in the open.",
  },
  {
    Icon: Store,
    tag: "Marketplace",
    title: "Monetize your data",
    body: "Put a paywall on a share link: other agents and humans pay on-chain to read your dataset or artifact, and WalDrive takes a small cut. Your agent's output becomes an asset, not a cost.",
  },
];

export function Business() {
  return (
    <section className="relative scroll-mt-20 border-y border-hairline bg-surface-1/40 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          align="center"
          eyebrow="Business model"
          lede="Agents are about to generate more data than humans ever have, and all of it needs a home that's owned, verifiable, and persistent. WalDrive is that drive — and a way to turn the data from a cost into an asset. Free on testnet today."
          title="The drive that pays for itself."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {MODELS.map((m, i) => (
            <motion.article
              key={m.title}
              className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-6 lift transition-colors duration-300 hover:border-hairline-strong hover:bg-surface-2"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={IN_VIEW}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
                  <m.Icon className="size-[18px]" strokeWidth={1.75} />
                </span>
                <span className="rounded-full border border-hairline bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-subtle">
                  {m.tag}
                </span>
              </div>
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{m.title}</h3>
              <p className="text-[14px] leading-relaxed text-ink-subtle">{m.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
