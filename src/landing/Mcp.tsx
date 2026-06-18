import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, Upload, List, Download, Info, type LucideIcon } from "lucide-react";
import { CONTAINER, EASE, IN_VIEW } from "./shared";
import { SectionHeading } from "./primitives";

type Tool = { Icon: LucideIcon; name: string; desc: string };

const TOOLS: Tool[] = [
  { Icon: Upload, name: "upload_file", desc: "Upload a local file to Walrus and register its metadata on Sui" },
  { Icon: List, name: "list_files", desc: "List FileRecord objects owned by the configured keypair" },
  { Icon: Download, name: "download_file", desc: "Download a blob from Walrus by blob ID to a local path" },
  { Icon: Info, name: "get_file_info", desc: "Get a file's on-chain metadata and public read URL by object ID" },
];

const CONFIG = `{
  "mcpServers": {
    "waldrive": {
      "command": "bun",
      "args": ["/abs/path/to/waldrive/mcp-server/src/index.ts"],
      "env": {
        "SUI_NETWORK": "testnet",
        "CONTRACT_PACKAGE_ID": "0x2fc3…b5f6",
        "WALDRIVE_KEYPAIR": "suiprivkey1…"
      }
    }
  }
}`;

const CLI = `# teach an agent to use WalDrive
npx skills add Fldicoahkiin/WalDrive

# or drive it straight from a shell / CI
waldrive upload ./report.pdf
waldrive ls --json
waldrive download <blobId> --out ./out.pdf`;

export function Mcp() {
  return (
    <section className="border-y border-hairline bg-surface-1/40 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="For agents & developers"
          lede="WalDrive gives agents three ways in — an MCP server, a waldrive CLI, and an installable skill — so AI clients, scripts, and CI store artifacts and memory to the same Walrus data you manage in the console. Humans get a fluid console; agents get a clean protocol. Same chain, same blobs, same truth."
          title="Your agents write. You browse."
        />

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={tool.name}
                className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-1 p-5 lift transition-colors duration-300 hover:border-hairline-strong"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={IN_VIEW}
                transition={{ duration: 0.45, ease: EASE, delay: i * 0.07 }}
              >
                <tool.Icon className="size-[18px] text-accent" strokeWidth={1.75} />
                <code className="font-mono text-[13.5px] font-medium text-ink">{tool.name}</code>
                <p className="text-[13px] leading-relaxed text-ink-subtle">{tool.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={IN_VIEW}
            transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
          >
            <CodeBlock caption="claude_desktop_config.json" code={CONFIG} />
            <CodeBlock caption="terminal" code={CLI} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** Mono code panel with a window header and a copy-to-clipboard button. */
export function CodeBlock({ code, caption }: { code: string; caption: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-[#0a0b0d] lift">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[12px] text-ink-tertiary">{caption}</span>
        <button
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
          onClick={copy}
          type="button"
        >
          {copied ? <Check className="size-3.5 text-success" strokeWidth={2} /> : <Copy className="size-3.5" strokeWidth={1.75} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="selectable overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.7] text-ink-muted">
        <code>{code}</code>
      </pre>
    </div>
  );
}
