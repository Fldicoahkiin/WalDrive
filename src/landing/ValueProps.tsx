import { motion } from "motion/react";
import { BadgeCheck, ServerOff, KeyRound, Bot, type LucideIcon } from "lucide-react";
import { CONTAINER, EASE, IN_VIEW } from "./shared";

type Prop = { Icon: LucideIcon; title: string; body: string };

const PROPS: Prop[] = [
  {
    Icon: BadgeCheck,
    title: "Verifiable data",
    body: "On-chain Sui metadata over content-addressed Walrus blobs. The blob ID is the cryptographic fingerprint of your bytes — tampering is mathematically loud.",
  },
  {
    Icon: ServerOff,
    title: "No backend",
    body: "The app PUTs bytes straight to the Walrus publisher and reads from the public aggregator. No server, no proxy, no account in between.",
  },
  {
    Icon: KeyRound,
    title: "You own your files",
    body: "Each upload sends the on-chain Blob object to your wallet, so you can renew it before expiry or delete it. The data is yours, not a host's.",
  },
  {
    Icon: Bot,
    title: "Agent write-path",
    body: "Agents write artifacts and memory three ways — an MCP server, a waldrive CLI, or an installable skill — to the same Walrus data you browse here. The protocols are the plumbing; this is the screen you operate them from.",
  },
];

export function ValueProps() {
  return (
    <section className={`py-20 sm:py-24 ${CONTAINER}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROPS.map(({ Icon, title, body }, i) => (
          <motion.article
            key={title}
            className="group flex flex-col gap-3.5 rounded-xl border border-hairline bg-surface-1 p-6 lift transition-colors duration-300 hover:border-hairline-strong hover:bg-surface-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={IN_VIEW}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent/12 text-accent transition-transform duration-300 group-hover:scale-110">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
            <p className="text-[14px] leading-relaxed text-ink-subtle">{body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
