import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Moon, Plus, RotateCcw, Sun, X, type LucideIcon } from "lucide-react";
import { Input } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { WalletPanel } from "@/components/WalletPanel";
import { useTheme, type Theme } from "@/lib/theme";
import { useSettings } from "@/stores/settingsStore";
import type { SuiNetwork } from "@/lib/constants";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;
const VERSION = "0.1.0";
const NETWORKS: SuiNetwork[] = ["testnet", "mainnet", "devnet", "localnet"];

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string; Icon?: LucideIcon }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 self-start rounded-lg border border-hairline bg-surface-1 p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          aria-pressed={value === o.key}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
            value === o.key ? "bg-surface-2 text-ink" : "text-ink-subtle hover:text-ink",
          )}
          type="button"
          onClick={() => onChange(o.key)}
        >
          {o.Icon && <o.Icon aria-hidden className="size-3.5" strokeWidth={1.75} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TextField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink-subtle">{label}</span>
      <Input
        className="selectable font-mono text-xs"
        value={draft}
        variant="secondary"
        onBlur={() => draft.trim() !== value && onCommit(draft.trim())}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ink-subtle">{title}</span>
      {children}
    </section>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.set);
  const s = useSettings();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const restoreTo = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      restoreTo?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          style={{ background: "var(--scrim)" }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            aria-label="Settings"
            aria-modal="true"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="lift-2 flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-hairline-strong bg-surface-1 outline-none"
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            role="dialog"
            tabIndex={-1}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-hairline px-4 py-3">
              <span className="text-sm font-medium text-ink">Settings</span>
              <Button isIconOnly aria-label="Close" size="sm" variant="ghost" onPress={onClose}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-5 overflow-auto p-4">
              <Section title="Wallet">
                <WalletPanel onClose={onClose} />
              </Section>

              <Section title="Appearance">
                <Segmented<Theme>
                  onChange={setTheme}
                  options={[
                    { key: "light", label: "Light", Icon: Sun },
                    { key: "dark", label: "Dark", Icon: Moon },
                  ]}
                  value={theme}
                />
              </Section>

              <Section title="Network">
                <Segmented<SuiNetwork>
                  onChange={s.setNetwork}
                  options={NETWORKS.map((n) => ({ key: n, label: n }))}
                  value={s.network}
                />
              </Section>

              <Section title="Walrus storage">
                <TextField label="Aggregator" onCommit={s.setAggregator} value={s.aggregator} />
                <TextField label="Publisher" onCommit={s.setPublisher} value={s.publisher} />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-subtle">Default epochs</span>
                  <div className="flex items-center gap-0.5 rounded-lg border border-hairline bg-surface-1 p-0.5">
                    <button
                      aria-label="Fewer epochs"
                      className="rounded-md px-2 py-1 text-ink-subtle transition-colors hover:text-ink disabled:opacity-40"
                      disabled={s.epochs <= 1}
                      type="button"
                      onClick={() => s.setEpochs(Math.max(1, s.epochs - 1))}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono text-xs text-ink">{s.epochs}</span>
                    <button
                      aria-label="More epochs"
                      className="rounded-md px-2 py-1 text-ink-subtle transition-colors hover:text-ink"
                      type="button"
                      onClick={() => s.setEpochs(s.epochs + 1)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </Section>

              <Section title="Contract">
                <TextField label="Package ID" onCommit={s.setPackageId} value={s.packageId} />
              </Section>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-hairline px-4 py-2.5">
              <span className="text-xs text-ink-tertiary">WalDrive v{VERSION}</span>
              <Button size="sm" variant="ghost" onPress={s.reset}>
                <RotateCcw className="size-3.5" /> Reset defaults
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
