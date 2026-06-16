import { motion } from "motion/react";
import { Rocket, MonitorDown, TerminalSquare, Plug } from "lucide-react";
import { CONTAINER, EASE, IN_VIEW, RELEASE_URL } from "./shared";
import { SectionHeading, LinkCta, NavCta } from "./primitives";
import { CodeBlock } from "./Mcp";

const SOURCE = `bun install
bun tauri dev   # launch the desktop window
# or: bun dev   # browser preview at :5173`;

export function GetStarted() {
  return (
    <section className={`scroll-mt-20 py-20 sm:py-28 ${CONTAINER}`} id="docs">
      <SectionHeading
        align="center"
        eyebrow="Get started"
        lede="Four ways in — no sign-up, testnet only. Pick the one that fits."
        title="Up and running in a minute"
      />

      <div className="mt-14 grid gap-4 lg:grid-cols-2">
        <Card
          Icon={Rocket}
          delay={0}
          title="Use it now in the browser"
          body="The live console runs in your browser. Generate a local wallet, grab free testnet SUI from the in-app faucet, and drag a file in."
        >
          <NavCta className="w-fit" to="/app" variant="primary">
            Open the console
          </NavCta>
        </Card>

        <Card
          Icon={MonitorDown}
          delay={0.08}
          title="Download the desktop app"
          body="Native builds for macOS, Windows and Linux — the full Tauri shell with window state and native materials. Grab the latest release."
        >
          <LinkCta className="w-fit" href={RELEASE_URL} variant="secondary">
            Latest release
          </LinkCta>
        </Card>

        <Card
          Icon={TerminalSquare}
          delay={0.16}
          title="Run from source"
          body="Clone the repo, install with bun, and launch. The contracts are already deployed on testnet, so the defaults work out of the box."
        >
          <CodeBlock caption="terminal" code={SOURCE} />
        </Card>

        <Card
          Icon={Plug}
          delay={0.24}
          title="Connect the MCP server"
          body="Point your AI client at the MCP server with a dedicated testnet keypair, and your agents can write to the same drive. Config is in the developer section above."
        >
          <a
            className="w-fit text-[14px] font-medium text-accent transition-colors hover:text-accent-hover"
            href="#features"
          >
            See the four tools →
          </a>
        </Card>
      </div>
    </section>
  );
}

function Card({
  Icon,
  title,
  body,
  delay,
  children,
}: {
  Icon: typeof Rocket;
  title: string;
  body: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.article
      className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-7 lift transition-colors duration-300 hover:border-hairline-strong"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={IN_VIEW}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-accent/12 text-accent">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-2">
        <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
        <p className="text-[14.5px] leading-relaxed text-ink-subtle">{body}</p>
      </div>
      <div className="mt-auto pt-1">{children}</div>
    </motion.article>
  );
}
