import { motion } from "motion/react";
import { MonitorSmartphone, Terminal, FileCode2, type LucideIcon } from "lucide-react";
import { CONTAINER, EASE, IN_VIEW } from "./shared";
import { SectionHeading } from "./primitives";

type Piece = {
  Icon: LucideIcon;
  index: string;
  title: string;
  body: string;
  bullets: string[];
};

const PIECES: Piece[] = [
  {
    Icon: MonitorSmartphone,
    index: "01",
    title: "Desktop console",
    body: "The human surface for agent data on Walrus — the star of the show, built for fluid interaction.",
    bullets: [
      "Browse, preview, rename, tag, version, organise",
      "Multi-account local wallet with faucet + balance",
      "Tauri 2.0 shell over a Vite + React SPA",
    ],
  },
  {
    Icon: Terminal,
    index: "02",
    title: "MCP server",
    body: "The agent write-path. AI clients and scripts operate the same Walrus data from the command line.",
    bullets: [
      "upload_file · list_files · download_file · get_file_info",
      "Runs locally over stdio — no CORS, no relay",
      "Signs with a dedicated testnet keypair",
    ],
  },
  {
    Icon: FileCode2,
    index: "03",
    title: "Move contracts",
    body: "File metadata as verifiable on-chain objects — the source of truth the UI reconciles against.",
    bullets: [
      "FileRecord — name, mime, size, tags, version, expiry",
      "Folder objects for nested organisation",
      "Deployed on Sui testnet",
    ],
  },
];

export function Pieces() {
  return (
    <section className="relative scroll-mt-20 py-20 sm:py-28" id="how">
      <div className={CONTAINER}>
        <SectionHeading
          align="center"
          eyebrow="How it works"
          lede="Metadata lives on Sui as Move objects, blob bytes live on Walrus, and there is no backend in between. Three pieces, one verifiable data layer."
          title="No backend. Two networks. Three pieces."
        />

        <FlowDiagram />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PIECES.map((piece, i) => (
            <motion.article
              key={piece.title}
              className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-6 lift transition-colors duration-300 hover:border-hairline-strong hover:bg-surface-2"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={IN_VIEW}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
                  <piece.Icon className="size-[18px]" strokeWidth={1.75} />
                </span>
                <span className="font-mono text-[12px] text-ink-tertiary">{piece.index}</span>
              </div>
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{piece.title}</h3>
              <p className="text-[14px] leading-relaxed text-ink-subtle">{piece.body}</p>
              <ul className="mt-1 flex flex-col gap-1.5 border-t border-hairline pt-3">
                {piece.bullets.map((b) => (
                  <li key={b} className="text-[13px] leading-relaxed text-ink-muted">
                    {b}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Compact upload → bytes/metadata → read data-flow strip. */
function FlowDiagram() {
  const steps = [
    { k: "Drag a file", v: "in the console" },
    { k: "PUT bytes", v: "→ Walrus publisher" },
    { k: "register()", v: "→ Sui FileRecord" },
    { k: "GET /blobs", v: "← aggregator, no wallet" },
  ];
  return (
    <motion.div
      className="mx-auto mb-14 mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-2.5"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={IN_VIEW}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {steps.map((s, i) => (
        <div key={s.k} className="flex items-center gap-2.5">
          <div className="rounded-lg border border-hairline bg-surface-1 px-3.5 py-2 text-center lift">
            <p className="text-[13px] font-medium text-ink">{s.k}</p>
            <p className="font-mono text-[11px] text-ink-tertiary">{s.v}</p>
          </div>
          {i < steps.length - 1 && (
            <span className="text-ink-tertiary" aria-hidden>
              →
            </span>
          )}
        </div>
      ))}
    </motion.div>
  );
}
