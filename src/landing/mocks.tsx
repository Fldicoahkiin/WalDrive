import { motion } from "motion/react";
import { RotateCcw, Clock, Trash2, History } from "lucide-react";
import { EASE, IN_VIEW } from "./shared";

const VERSIONS = [
  { v: 3, when: "now", size: "128 KB", current: true },
  { v: 2, when: "2d ago", size: "120 KB", current: false },
  { v: 1, when: "5d ago", size: "98 KB", current: false },
];

/** Mock of the on-chain version history + one-click rollback. */
export function VersionMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface-1 p-5 lift">
      <div className="mb-4 flex items-center gap-2 text-[13px] font-medium text-ink-muted">
        <History className="size-4 text-accent" strokeWidth={1.75} />
        Version history
        <span className="ml-auto font-mono text-[11px] text-ink-tertiary">report.md</span>
      </div>
      <div className="flex flex-col gap-2">
        {VERSIONS.map((row, i) => (
          <motion.div
            key={row.v}
            className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 ${
              row.current
                ? "border-accent/40 bg-accent/[0.08]"
                : "border-hairline bg-surface-2/50"
            }`}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={IN_VIEW}
            transition={{ duration: 0.45, ease: EASE, delay: 0.1 + i * 0.1 }}
          >
            <span
              className={`flex size-7 items-center justify-center rounded-md font-mono text-[12px] ${
                row.current ? "bg-accent text-on-accent" : "bg-surface-3 text-ink-subtle"
              }`}
            >
              v{row.v}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] text-ink">
                Version {row.v}
                {row.current && <span className="ml-2 text-[11px] text-accent">current</span>}
              </p>
              <p className="font-mono text-[11px] text-ink-tertiary">
                {row.when} · {row.size}
              </p>
            </div>
            {!row.current && (
              <button
                className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1 text-[12px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
                type="button"
              >
                <RotateCcw className="size-3.5" strokeWidth={1.75} />
                Roll back
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Mock of the Walrus blob lifecycle controls (extend / delete + expiry). */
export function LifecycleMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface-1 p-5 lift">
      <div className="mb-4 flex items-center gap-2 text-[13px] font-medium text-ink-muted">
        <Clock className="size-4 text-accent" strokeWidth={1.75} />
        Walrus blob lifecycle
      </div>

      <div className="rounded-lg border border-hairline bg-surface-2/50 p-4">
        <div className="flex items-center justify-between text-[12px] text-ink-subtle">
          <span>Storage epochs</span>
          <span className="font-mono text-ink-muted">expiry epoch 42</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-[#828fff]"
            initial={{ width: "0%" }}
            whileInView={{ width: "62%" }}
            viewport={IN_VIEW}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          />
        </div>
        <p className="mt-2 font-mono text-[11px] text-ink-tertiary">
          Blob object 0x7d4c…a19f · owned by you
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-on-accent transition-colors hover:bg-accent-hover"
          type="button"
        >
          <Clock className="size-4" strokeWidth={1.75} />
          Extend storage
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-hairline px-3 py-2 text-[13px] text-ink-muted transition-colors hover:border-danger/50 hover:text-danger"
          type="button"
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
          Delete
        </button>
      </div>
    </div>
  );
}
